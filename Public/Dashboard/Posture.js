// --- JWT Auth Check (Protected Page) ---
(function() {
    const redirectToLogin = () => {
        window.location.href = '/Public/test/login.html';
    };
    const token = localStorage.getItem('authToken');
    if (!token) {
        redirectToLogin();
        return;
    }
    // jwt-decode must be loaded via CDN in the HTML
    try {
        const decoded = window.jwt_decode ? window.jwt_decode(token) : null;
        if (!decoded || !decoded.exp) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        // exp is in seconds since epoch
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
            localStorage.removeItem('authToken');
            redirectToLogin();
            return;
        }
        // Token is valid, allow access
    } catch (e) {
        localStorage.removeItem('authToken');
        redirectToLogin();
    }
})();

console.log('Posture.js loaded successfully!');

// Load MediaPipe Pose API and utilities
const poseScript = document.createElement('script');
poseScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
document.head.appendChild(poseScript);

const cameraScript = document.createElement('script');
cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
document.head.appendChild(cameraScript);

function waitForMediaPipe() {
  return new Promise(resolve => {
    function check() {
      if (window.Pose && window.Camera) resolve();
      else setTimeout(check, 50);
    }
    check();
  });
}

let pose = null;
let camera = null;
let scanning = false;
let video, canvas, ctx, scanBtn, feedbackDiv, scoreBadge, scanHistoryTable;

async function initializePose() {
  await waitForMediaPipe();
  pose = new Pose({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  pose.onResults(onResults);
}

// --- Advanced Posture Evaluation Functions ---
function getAngle(ear, shoulder) {
  const dx = ear.x - shoulder.x;
  const dy = ear.y - shoulder.y;
  return Math.abs(Math.atan2(dx, dy) * 180 / Math.PI);
}

function getJointAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  const angleRad = Math.acos(dot / (magAB * magCB));
  return (angleRad * 180) / Math.PI;
}

// ✅ Evaluation dispatcher
function evaluatePosture(landmarks) {
  const selectedExercise = localStorage.getItem('selectedExercise');

  switch (selectedExercise?.toLowerCase()) {
    case 'push-up':
      return evaluatePushup(landmarks);
    case 'squat':
      return evaluateSquat(landmarks);
    case 'plank':
      return evaluatePlank(landmarks);
    default:
      return evaluateGeneralPosture(landmarks);
  }
}

// ✅ Push-up evaluation
function evaluatePushup(landmarks) {
  const shoulder = landmarks[11];
  const elbow = landmarks[13];
  const wrist = landmarks[15];

  if (shoulder.visibility > 0.5 && elbow.visibility > 0.5 && wrist.visibility > 0.5) {
    const angle = getJointAngle(shoulder, elbow, wrist);

    if (angle > 150 && angle < 180) return { score: 95, feedback: '✅ Good push-up extension!' };
    if (angle > 100) return { score: 70, feedback: '⚠️ Try straightening your arms more.' };
    return { score: 40, feedback: '❗ Poor push-up posture.' };
  }
  return { score: 0, feedback: '❌ Arm landmarks not detected.' };
}

// ✅ Squat evaluation
function evaluateSquat(landmarks) {
  const hip = landmarks[24];
  const knee = landmarks[26];
  const ankle = landmarks[28];

  if (hip.visibility > 0.5 && knee.visibility > 0.5 && ankle.visibility > 0.5) {
    const angle = getJointAngle(hip, knee, ankle);

    if (angle > 80 && angle < 110) return { score: 90, feedback: '✅ Perfect squat depth!' };
    if (angle > 60 && angle < 130) return { score: 70, feedback: '⚠️ Go a bit deeper or adjust knee.' };
    return { score: 40, feedback: '❗ Incorrect squat posture.' };
  }
  return { score: 0, feedback: '❌ Leg landmarks not detected.' };
}

// ✅ Plank evaluation
function evaluatePlank(landmarks) {
  const shoulder = landmarks[12];
  const hip = landmarks[24];
  const ankle = landmarks[28];

  if (shoulder.visibility > 0.5 && hip.visibility > 0.5 && ankle.visibility > 0.5) {
    const angle = getJointAngle(shoulder, hip, ankle);

    if (angle > 165 && angle < 185) return { score: 90, feedback: '✅ Solid plank posture!' };
    if (angle > 150 && angle < 200) return { score: 70, feedback: '⚠️ Try keeping back straighter.' };
    return { score: 40, feedback: '❗ Back is not aligned properly.' };
  }
  return { score: 0, feedback: '❌ Posture landmarks not visible.' };
}

// ✅ General fallback evaluation
function evaluateGeneralPosture(landmarks) {
  const leftEar = landmarks[7];
  const leftShoulder = landmarks[11];
  const rightEar = landmarks[8];
  const rightShoulder = landmarks[12];

  let angleL = null, angleR = null;
  if (leftEar && leftShoulder && leftEar.visibility > 0.5 && leftShoulder.visibility > 0.5)
    angleL = getAngle(leftEar, leftShoulder);
  if (rightEar && rightShoulder && rightEar.visibility > 0.5 && rightShoulder.visibility > 0.5)
    angleR = getAngle(rightEar, rightShoulder);

  let angle = angleL !== null && angleR !== null ? Math.max(angleL, angleR) : angleL || angleR;
  if (angle === null) return { score: 0, feedback: 'Face not detected.' };

  if (angle < 15) return { score: 95, feedback: '✅ Excellent posture!' };
  if (angle < 30) return { score: 80, feedback: '⚠️ Slightly forward head posture.' };
  return { score: 50, feedback: '❗ Poor posture.' };
}

function onResults(results) {
  if (!scanning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    const { score, feedback } = evaluatePosture(results.poseLandmarks);
    showFeedback(score, feedback);
    saveScan(score, feedback);

    // Stop scanning and camera after first feedback
    scanning = false;
    stopCamera();
    
    // Reset button text based on selected exercise
    const selectedExercise = localStorage.getItem('selectedExercise');
    if (selectedExercise) {
      scanBtn.textContent = `Scan: ${selectedExercise}`;
    } else {
      scanBtn.textContent = 'Start Scan';
    }

    // Show overlay again
    const overlay = document.querySelector('.camera-overlay');
    if (overlay) overlay.style.display = 'block';
  }
}

function showFeedback(score, feedback) {
  feedbackDiv.textContent = feedback;
  scoreBadge.textContent = score;
  scoreBadge.style.display = 'inline-block';
}

function saveScan(score, feedback) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let history = JSON.parse(localStorage.getItem('postureHistory') || '[]');
  history.unshift({ date, time, score, feedback });
  history = history.slice(0, 10);
  localStorage.setItem('postureHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('postureHistory') || '[]');
  scanHistoryTable.innerHTML = '';
  for (const entry of history) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${entry.date} ${entry.time || ''}</td><td>${entry.score}</td><td>${entry.feedback}</td>`;
    scanHistoryTable.appendChild(tr);
  }
}

async function toggleScan() {
  if (!scanning) {
    scanning = true;
    scanBtn.textContent = 'Scanning...';
    // Hide overlay
    const overlay = document.querySelector('.camera-overlay');
    if (overlay) overlay.style.display = 'none';

    await initializePose();
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    camera = new Camera(video, {
      onFrame: async () => {
        if (pose && scanning) await pose.send({ image: video });
      },
      width: 640,
      height: 480
    });
    await camera.start();
  } else {
    scanning = false;
    stopCamera(); // <--- call this first!
    
    // Reset button text based on selected exercise
    const selectedExercise = localStorage.getItem('selectedExercise');
    if (selectedExercise) {
      scanBtn.textContent = `Scan: ${selectedExercise}`;
    } else {
      scanBtn.textContent = 'Start Scan';
    }
    
    // Show overlay
    const overlay = document.querySelector('.camera-overlay');
    if (overlay) overlay.style.display = 'block';
  }
}

function stopCamera() {
  if (camera) {
    camera.stop();
    camera = null;
    console.log('MediaPipe Camera stopped');
  }
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => {
      track.stop();
      console.log('Stopped track:', track);
    });
    video.srcObject = null;
    console.log('Webcam stream stopped and srcObject cleared');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  video = document.getElementById('webcam');
  canvas = document.getElementById('pose-canvas');
  ctx = canvas.getContext('2d');
  scanBtn = document.querySelector('.scan-btn');
  feedbackDiv = document.querySelector('.feedback');
  scoreBadge = document.getElementById('score-badge');
  scanHistoryTable = document.querySelector('.scan-history tbody');

  if (video) {
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.style.display = 'block';
  }

  scanBtn.addEventListener('click', toggleScan);
  renderHistory();

  const viewExercisesBtn = document.querySelector('.view-exercises-btn');
  const exerciseModal = document.getElementById('exercise-modal');
  const closeExerciseModal = document.querySelector('.close-exercise-modal');
  const exerciseCategoriesDiv = document.getElementById('exercise-categories');
  const exerciseListDiv = document.getElementById('exercise-list');

  const RAPIDAPI_KEY = '1e8af5ddb8msh2301985a7a5a5ddp1956c8jsn75db66375e61';

  async function fetchCategories() {
    const res = await fetch('https://exercisedb.p.rapidapi.com/exercises/targetList', {
      headers: {
        'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });
    return res.json();
  }

  async function fetchExercisesByCategory(category) {
    const res = await fetch(`https://exercisedb.p.rapidapi.com/exercises/target/${category}`, {
      headers: {
        'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });
    return res.json();
  }

  viewExercisesBtn.addEventListener('click', async () => {
    exerciseModal.style.display = 'block';
    exerciseListDiv.innerHTML = '';
    exerciseCategoriesDiv.innerHTML = 'Loading...';
    const categories = await fetchCategories();
    exerciseCategoriesDiv.innerHTML = categories.map(cat => 
      `<button class="exercise-category-btn" data-category="${cat}">${cat}</button>`
    ).join(' ');
  });

  closeExerciseModal.addEventListener('click', () => {
    exerciseModal.style.display = 'none';
    exerciseListDiv.innerHTML = '';
  });

  // Close modal when clicking outside
  exerciseModal.addEventListener('click', (e) => {
    if (e.target === exerciseModal) {
      exerciseModal.style.display = 'none';
      exerciseListDiv.innerHTML = '';
    }
  });

  exerciseCategoriesDiv.addEventListener('click', async (e) => {
    if (e.target.classList.contains('exercise-category-btn')) {
      const category = e.target.dataset.category;
      exerciseListDiv.innerHTML = 'Loading exercises...';
      const exercises = await fetchExercisesByCategory(category);
      exerciseListDiv.innerHTML = exercises.slice(0, 10).map(ex =>
        `<div class="exercise-item">
          <strong>${ex.name}</strong> (${ex.bodyPart})<br>
          <button class="select-exercise-btn" data-exercise="${ex.name}">Select</button>
        </div>`
      ).join('');
    }
  });

  // Handle exercise selection and start scan
  exerciseListDiv.addEventListener('click', async (e) => {
    if (e.target.classList.contains('select-exercise-btn')) {
      const exerciseName = e.target.dataset.exercise;
      exerciseModal.style.display = 'none';
      
      // Update scan button text to show selected exercise
      scanBtn.textContent = `Scan: ${exerciseName}`;
      
      // Store selected exercise for reference
      localStorage.setItem('selectedExercise', exerciseName);
      
      // Show feedback about selected exercise
      feedbackDiv.textContent = `Selected: ${exerciseName}. Click "Scan: ${exerciseName}" to start posture analysis.`;
    }
  });
});
