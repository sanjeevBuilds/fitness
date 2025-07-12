// Confetti using Canvas
const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];

function createParticles() {
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 2,
      speedY: Math.random() * 3 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    });
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    p.y += p.speedY;
    if (p.y > canvas.height) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
  }
}

function animateParticles() {
  drawParticles();
  requestAnimationFrame(animateParticles);
}

document.querySelector(".enter-btn").addEventListener("click", () => {
  createParticles();
  animateParticles();
});
