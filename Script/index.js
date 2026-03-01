const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;
let dpr = 1;
let particles = [];
let particleCount = 0;
let rafId = 0;

function getQualityFactor() {
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  if (memory <= 4 || cores <= 4) return 0.7;
  if (memory >= 8 && cores >= 8) return 1.1;
  return 0.9;
}

function resizeCanvas() {
  viewWidth = window.innerWidth;
  viewHeight = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(viewWidth * dpr);
  canvas.height = Math.round(viewHeight * dpr);
  canvas.style.width = viewWidth + "px";
  canvas.style.height = viewHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const baseDensity = prefersReducedMotion ? 0.00002 : 0.00005;
  const quality = getQualityFactor();
  particleCount = Math.round(Math.min(90, Math.max(30, viewWidth * viewHeight * baseDensity * quality)));
  initParticles();
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * viewWidth;
    this.y = Math.random() * viewHeight;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.opacity = Math.random() * 0.6 + 0.2;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > viewWidth) this.reset();
    if (this.y < 0 || this.y > viewHeight) this.reset();
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(214,185,40,${this.opacity})`;
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) particles.push(new Particle());
}

function animate() {
  ctx.clearRect(0, 0, viewWidth, viewHeight);
  particles.forEach(p => { p.update(); p.draw(); });
  rafId = requestAnimationFrame(animate);
}

function startParticles() {
  if (prefersReducedMotion) return;
  if (!rafId) animate();
}

function stopParticles() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

initParticles();
startParticles();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopParticles();
  } else {
    startParticles();
  }
});

