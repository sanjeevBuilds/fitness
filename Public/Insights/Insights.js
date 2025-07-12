// Sample data for Posture Trend (last 7 days)
const postureScores = [78, 82, 85, 80, 88, 84, 90];

// Sample data for Nutrition Summary (g)
const nutritionData = {
  protein: 60,
  carbs: 150,
  fats: 40
};

// Sample data for detailed report
const reportData = [
  { date: '2024-06-01', category: 'Posture', insight: 'Good posture maintained (82/100)' },
  { date: '2024-06-01', category: 'Nutrition', insight: 'Protein intake met (60g)' },
  { date: '2024-06-02', category: 'Posture', insight: 'Excellent posture (85/100)' },
  { date: '2024-06-02', category: 'Nutrition', insight: 'Carbs slightly high (160g)' },
  { date: '2024-06-03', category: 'Posture', insight: 'Posture dipped, try more breaks (80/100)' },
  { date: '2024-06-03', category: 'Nutrition', insight: 'Fats within target (40g)' },
  { date: '2024-06-04', category: 'Posture', insight: 'Great improvement (88/100)' },
  { date: '2024-06-04', category: 'Nutrition', insight: 'Balanced macros' },
];

// Render Posture Trend Chart
function renderPostureTrend() {
  const canvas = document.getElementById('posture-graph');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Chart settings
  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const maxScore = 100;
  const minScore = 70;
  const days = postureScores.length;

  // Draw axes
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  // Draw line
  ctx.strokeStyle = '#1ec878';
  ctx.lineWidth = 3;
  ctx.beginPath();
  postureScores.forEach((score, i) => {
    const x = padding + (i * chartWidth) / (days - 1);
    const y = padding + chartHeight - ((score - minScore) / (maxScore - minScore)) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw points
  ctx.fillStyle = '#1ec878';
  postureScores.forEach((score, i) => {
    const x = padding + (i * chartWidth) / (days - 1);
    const y = padding + chartHeight - ((score - minScore) / (maxScore - minScore)) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
  });
}

// Render Nutrition Summary
function renderNutritionSummary() {
  document.getElementById('nutrition-protein').textContent = `Protein: ${nutritionData.protein}g`;
  document.getElementById('nutrition-carbs').textContent = `Carbs: ${nutritionData.carbs}g`;
  document.getElementById('nutrition-fats').textContent = `Fats: ${nutritionData.fats}g`;

  // Set bar heights (max 150px for demo)
  document.querySelector('.nutrition-bar.protein').style.height = `${nutritionData.protein}px`;
  document.querySelector('.nutrition-bar.carbs').style.height = `${nutritionData.carbs}px`;
  document.querySelector('.nutrition-bar.fats').style.height = `${nutritionData.fats}px`;
}

// Set average posture score
function setPostureAvg() {
  const avg = Math.round(postureScores.reduce((a, b) => a + b, 0) / postureScores.length);
  document.getElementById('posture-score').textContent = `${postureScores[postureScores.length-1]}/100`;
  document.getElementById('posture-avg').textContent = avg;
}

function renderDetailedReport() {
  const tbody = document.getElementById('insights-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  reportData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.date}</td><td>${row.category}</td><td>${row.insight}</td>`;
    tbody.appendChild(tr);
  });
}

function renderNutritionPie() {
  const canvas = document.getElementById('nutrition-pie');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const macros = [nutritionData.protein, nutritionData.carbs, nutritionData.fats];
  const colors = ['#1ec878', '#ffb347', '#ff5252'];
  const total = macros.reduce((a, b) => a + b, 0);
  console.log('Drawing nutrition pie:', macros, 'Total:', total);
  let startAngle = -0.5 * Math.PI;
  if (total === 0) {
    // Fallback: fill with gray if no data
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#ccc';
    ctx.fill();
    return;
  }
  macros.forEach((value, i) => {
    if (value <= 0) return;
    const sliceAngle = (value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, 80, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    startAngle += sliceAngle;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderPostureTrend();
  renderNutritionSummary();
  setPostureAvg();
  renderDetailedReport();
  renderNutritionPie();
});
