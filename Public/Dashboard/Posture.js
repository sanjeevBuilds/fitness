// TensorFlow.js and PoseNet CDN loader
const tfjsScript = document.createElement('script');
tfjsScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js';
document.head.appendChild(tfjsScript);

const posenetScript = document.createElement('script');
posenetScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@2.2.2/dist/posenet.min.js';
document.head.appendChild(posenetScript);

// Wait for scripts to load
function waitForTFJS() {
    return new Promise(resolve => {
        function check() {
            if (window.posenet && window.tf) resolve();
            else setTimeout(check, 50);
        }
        check();
    });
}

// DOM elements
const webcamArea = document.querySelector('.webcam-area');
const video = document.getElementById('webcam');
const canvas = document.getElementById('pose-canvas');
const ctx = canvas.getContext('2d');
const scanBtn = document.querySelector('.scan-btn');
const feedbackDiv = document.querySelector('.feedback');
const tabBtns = document.querySelectorAll('.tab-btn');
const cameraOverlay = document.querySelector('.camera-overlay');
const imageUpload = document.getElementById('image-upload');
const uploadPreview = document.getElementById('upload-preview');
const scoreBadge = document.getElementById('score-badge');
const scanContainer = document.querySelector('.scan-container');
const scanHistoryTable = document.querySelector('.scan-history tbody');

let scanning = false;
let currentTab = 0; // 0: Webcam, 1: Upload
let net = null;
let animationId = null;

// Tab switching logic
function switchTab(idx) {
    tabBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
    });
    currentTab = idx;
    feedbackDiv.textContent = '';
    scoreBadge.style.display = 'none';
    if (idx === 0) {
        // Webcam
        video.style.display = 'none';
        canvas.style.display = 'none';
        cameraOverlay.style.display = '';
        imageUpload.style.display = 'none';
        uploadPreview.style.display = 'none';
        scanBtn.textContent = 'Start Scan';
    } else {
        // Upload
        stopWebcam();
        video.style.display = 'none';
        canvas.style.display = 'none';
        cameraOverlay.style.display = 'none';
        imageUpload.style.display = '';
        uploadPreview.style.display = 'none';
        scanBtn.textContent = 'Analyze Image';
    }
}
tabBtns[0].addEventListener('click', () => switchTab(0));
tabBtns[1].addEventListener('click', () => switchTab(1));
switchTab(0);

// Webcam logic
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = '';
        cameraOverlay.style.display = 'none';
        await video.play();
        resizeCanvasToVideo();
        canvas.style.display = '';
    } catch (e) {
        feedbackDiv.textContent = 'Unable to access webcam.';
    }
}
function stopWebcam() {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    video.style.display = 'none';
    canvas.style.display = 'none';
    cameraOverlay.style.display = '';
    if (animationId) cancelAnimationFrame(animationId);
}
function resizeCanvasToVideo() {
    const rect = webcamArea.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvasToVideo);

// PoseNet logic
async function runPoseNetOnVideo() {
    scanning = true;
    await waitForTFJS();
    if (!net) net = await posenet.load();
    resizeCanvasToVideo();
    async function poseLoop() {
        if (!scanning) return;
        const pose = await net.estimateSinglePose(video, { flipHorizontal: false });
        drawPose(pose);
        const { score, feedback } = evaluatePosture(pose);
        showFeedback(score, feedback);
        saveScan(score, feedback);
        animationId = requestAnimationFrame(poseLoop);
    }
    poseLoop();
}

// Upload image logic
imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    uploadPreview.src = url;
    uploadPreview.style.display = '';
    video.style.display = 'none';
    canvas.style.display = '';
    cameraOverlay.style.display = 'none';
    await waitForTFJS();
    if (!net) net = await posenet.load();
    uploadPreview.onload = async () => {
        resizeCanvasToImage();
        const pose = await net.estimateSinglePose(uploadPreview, { flipHorizontal: false });
        drawPose(pose);
        const { score, feedback } = evaluatePosture(pose);
        showFeedback(score, feedback);
        saveScan(score, feedback);
    };
});
function resizeCanvasToImage() {
    canvas.width = uploadPreview.naturalWidth;
    canvas.height = uploadPreview.naturalHeight;
}

// Scan button logic
scanBtn.addEventListener('click', async () => {
    if (currentTab === 0) {
        if (!scanning) {
            await startWebcam();
            scanning = true;
            runPoseNetOnVideo();
            scanBtn.textContent = 'Stop Scan';
        } else {
            scanning = false;
            stopWebcam();
            scanBtn.textContent = 'Start Scan';
            feedbackDiv.textContent = '';
            scoreBadge.style.display = 'none';
        }
    } else {
        imageUpload.click();
    }
});

// Draw pose keypoints
function drawPose(pose) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pose || !pose.keypoints) return;
    for (const kp of pose.keypoints) {
        if (kp.score > 0.5) {
            ctx.beginPath();
            ctx.arc(kp.position.x, kp.position.y, 7, 0, 2 * Math.PI);
            ctx.fillStyle = '#1ec878';
            ctx.fill();
        }
    }
}

// Posture evaluation logic
function evaluatePosture(pose) {
    // Find left/right ear and shoulder
    const leftEar = pose.keypoints.find(kp => kp.part === 'leftEar');
    const rightEar = pose.keypoints.find(kp => kp.part === 'rightEar');
    const leftShoulder = pose.keypoints.find(kp => kp.part === 'leftShoulder');
    const rightShoulder = pose.keypoints.find(kp => kp.part === 'rightShoulder');
    let angleL = null, angleR = null;
    if (leftEar && leftShoulder && leftEar.score > 0.5 && leftShoulder.score > 0.5) {
        angleL = getAngle(leftEar.position, leftShoulder.position);
    }
    if (rightEar && rightShoulder && rightEar.score > 0.5 && rightShoulder.score > 0.5) {
        angleR = getAngle(rightEar.position, rightShoulder.position);
    }
    // Use the smaller angle (worst side)
    let angle = null;
    if (angleL !== null && angleR !== null) angle = Math.min(angleL, angleR);
    else if (angleL !== null) angle = angleL;
    else if (angleR !== null) angle = angleR;
    else return { score: 0, feedback: 'Face not detected.' };
    let feedback = '', score = 0;
    if (angle < 15) {
        feedback = '✅ Great posture!';
        score = 95 + Math.round((15 - angle) * 0.3);
    } else if (angle < 30) {
        feedback = '⚠️ Slight forward head posture.';
        score = 80 + Math.round((30 - angle) * 0.7);
    } else {
        feedback = '❗ Bad posture detected!';
        score = Math.max(40, 100 - Math.round(angle * 1.2));
    }
    score = Math.max(0, Math.min(100, score));
    return { score, feedback };
}
function getAngle(ear, shoulder) {
    // Angle between vertical and line from shoulder to ear
    const dx = ear.x - shoulder.x;
    const dy = ear.y - shoulder.y;
    const angleRad = Math.atan2(dx, dy); // dx/dy because vertical
    return Math.abs(angleRad * 180 / Math.PI);
}

// Show feedback and badge
function showFeedback(score, feedback) {
    feedbackDiv.textContent = feedback;
    scoreBadge.textContent = score;
    scoreBadge.style.display = '';
    // Color badge based on score
    if (score > 90) scoreBadge.style.background = 'var(--primary-btn, #1ec878)';
    else if (score > 70) scoreBadge.style.background = '#f7b500';
    else scoreBadge.style.background = '#e74c3c';
    // Dark mode
    if (document.body.classList.contains('dark-mode')) {
        scoreBadge.style.color = '#121816';
    } else {
        scoreBadge.style.color = '#fff';
    }
}

// Scan history logic
function saveScan(score, feedback) {
    if (!score || !feedback) return;
    const date = new Date().toISOString().slice(0, 10);
    let history = JSON.parse(localStorage.getItem('postureHistory') || '[]');
    if (history.length > 0 && history[0].date === date && history[0].score === score) return; // avoid duplicates
    history.unshift({ date, score, feedback });
    history = history.slice(0, 10); // keep last 10
    localStorage.setItem('postureHistory', JSON.stringify(history));
    renderHistory();
}
function renderHistory() {
    let history = JSON.parse(localStorage.getItem('postureHistory') || '[]');
    scanHistoryTable.innerHTML = '';
    for (const entry of history) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${entry.date}</td><td>${entry.score}</td><td>${entry.feedback}</td>`;
        scanHistoryTable.appendChild(tr);
    }
}
renderHistory();

// Initial state
switchTab(0);
