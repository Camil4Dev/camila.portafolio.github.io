const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.6;
    this.speedY = (Math.random() - 0.5) * 0.6;
    this.opacity = Math.random() * 0.6 + 0.2;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > canvas.width) this.reset();
    if (this.y < 0 || this.y > canvas.height) this.reset();
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
  for (let i = 0; i < 70; i++) particles.push(new Particle());
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animate);
}

initParticles();
animate();


const fxCanvas = document.getElementById("parallaxCanvas");
const fxCtx = fxCanvas.getContext("2d");

function resizeFX() {
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
    initFX();
}
resizeFX();
window.addEventListener("resize", resizeFX);


let fxObjects = [];
let mouseX = 0, mouseY = 0;

function initFX() {
    fxObjects = [];
    layers.forEach(layer => {
        for (let i = 0; i < layer.count; i++) {
            fxObjects.push({
                layer,
                type: "bubble",
                x: Math.random() * fxCanvas.width,
                y: Math.random() * fxCanvas.height,
                size: layer.size,
                speed: layer.speed,
                color: layer.color
            });
        }
    });

    for (let i = 0; i < floatingParticlesCount; i++) {
        fxObjects.push({
            type: "particle",
            x: Math.random() * fxCanvas.width,
            y: Math.random() * fxCanvas.height,
            size: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.6,
            speedY: (Math.random() - 0.5) * 0.6,
            opacity: Math.random() * 0.6 + 0.2
        });
    }
}

initFX();






document.addEventListener("mousemove", e => {
    mouseX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
    mouseY = (e.clientY - window.innerHeight / 2) / window.innerHeight;
});



let lastTouchX = null;
let lastTouchY = null;

document.addEventListener("touchmove", e => {
    if (e.touches.length > 0) {
        const t = e.touches[0];

        if (lastTouchX === null) {
            lastTouchX = t.clientX;
            lastTouchY = t.clientY;
        }

        const dx = t.clientX - lastTouchX;
        const dy = t.clientY - lastTouchY;

        mouseX = dx / window.innerWidth;
        mouseY = dy / window.innerHeight;

        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
    }
}, { passive: true });

document.addEventListener("touchend", () => {
    lastTouchX = null;
    lastTouchY = null;
});



if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", event => {
        
        if (event.gamma !== null && event.beta !== null) {
            mouseX = event.gamma / 45;  
            mouseY = event.beta / 45;
        }
    });
}



function fxLoop() {
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

    fxObjects.forEach(obj => {

        if (obj.type === "bubble") {
            
            obj.y += obj.speed;
            if (obj.y - obj.size > fxCanvas.height) {
                obj.y = -obj.size;
                obj.x = Math.random() * fxCanvas.width;
            }

            
            const px = obj.x + mouseX * obj.layer.speed * 50;
            const py = obj.y + mouseY * obj.layer.speed * 50;

            fxCtx.globalAlpha = 0.9;
            fxCtx.fillStyle = obj.color;

            fxCtx.beginPath();
            fxCtx.arc(px, py, obj.size * 0.12, 0, Math.PI * 2);
            fxCtx.fill();
        }

        else if (obj.type === "particle") {
            obj.x += obj.speedX;
            obj.y += obj.speedY;

            if (obj.x < 0 || obj.x > fxCanvas.width) obj.x = Math.random() * fxCanvas.width;
            if (obj.y < 0 || obj.y > fxCanvas.height) obj.y = Math.random() * fxCanvas.height;

            fxCtx.fillStyle = `rgba(214,185,40,${obj.opacity})`;
            fxCtx.beginPath();
            fxCtx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
            fxCtx.fill();
        }

    });

    requestAnimationFrame(fxLoop);
}

fxLoop();
