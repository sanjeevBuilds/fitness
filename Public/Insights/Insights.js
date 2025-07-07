// --- Posture Graph Logic ---
function getPostureHistory() {
    let history = JSON.parse(localStorage.getItem('postureHistory') || '[]');
    // Only last 7 days
    return history.slice(0, 7).reverse();
}

function drawCurvedGraph(ctx, points, color) {
    if (points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    // Catmull-Rom Spline for smooth curve
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];
        for (let t = 0; t < 1; t += 0.1) {
            const tt = t * t, ttt = tt * t;
            const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * tt + (-p0.x + 3*p1.x - 3*p2.x + p3.x) * ttt);
            const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * tt + (-p0.y + 3*p1.y - 3*p2.y + p3.y) * ttt);
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.restore();
}

function renderPostureGraph() {
    const canvas = document.getElementById('posture-graph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const history = getPostureHistory();
    const maxScore = 100;
    const minScore = 0;
    // X: equally spaced, Y: invert (higher score = higher)
    const n = 7;
    const w = canvas.width, h = canvas.height;
    const margin = 32;
    const points = [];
    for (let i = 0; i < n; i++) {
        const score = history[i] ? history[i].score : 0;
        const x = margin + i * ((w - 2 * margin) / (n - 1));
        const y = h - margin - ((score - minScore) / (maxScore - minScore)) * (h - 2 * margin);
        points.push({ x, y });
    }
    // Draw curve
    drawCurvedGraph(ctx, points, '#1ec878');
    // Draw points
    ctx.fillStyle = '#1ec878';
    for (const pt of points) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
    // Draw day labels
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#666';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < n; i++) {
        ctx.fillText(days[i], points[i].x - 16, h - 8);
    }
}

function updatePostureStats() {
    const history = getPostureHistory();
    const avg = history.length ? Math.round(history.reduce((a, b) => a + b.score, 0) / history.length) : 0;
    document.getElementById('posture-score').textContent = (history[0]?.score || 0) + '/100';
    document.getElementById('posture-avg').textContent = avg;
}

// --- Nutrition Summary (static or from localStorage) ---
function updateNutrition() {
    // Example static values
    document.getElementById('nutrition-protein').textContent = 'Protein: 60g';
    document.getElementById('nutrition-carbs').textContent = 'Carbs: 150g';
    document.getElementById('nutrition-fats').textContent = 'Fats: 40g';
    // Bar heights
    document.querySelector('.nutrition-bar.protein').style.height = '60px';
    document.querySelector('.nutrition-bar.carbs').style.height = '150px';
    document.querySelector('.nutrition-bar.fats').style.height = '40px';
}

// --- Detailed Reports Table ---
function updateReports() {
    const tbody = document.getElementById('insights-table-body');
    tbody.innerHTML = '';
    // Example: Use postureHistory for posture, add static food/activity
    const postureHistory = JSON.parse(localStorage.getItem('postureHistory') || '[]');
    for (const entry of postureHistory.slice(0, 3)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${entry.date}</td><td>Posture</td><td>${entry.feedback}</td>`;
        tbody.appendChild(tr);
    }
    // Example static rows
    const staticRows = [
        { date: '2024-01-14', category: 'Food', insight: 'Protein intake slightly low on 2024-01-14.' },
        { date: '2024-01-13', category: 'Activity', insight: 'Low step count; walk recommended.' }
    ];
    for (const row of staticRows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.date}</td><td>${row.category}</td><td>${row.insight}</td>`;
        tbody.appendChild(tr);
    }
}

// --- Real-time updates ---
function refreshInsights() {
    renderPostureGraph();
    updatePostureStats();
    updateNutrition();
    updateReports();
}
window.addEventListener('storage', refreshInsights);
window.addEventListener('DOMContentLoaded', refreshInsights);
