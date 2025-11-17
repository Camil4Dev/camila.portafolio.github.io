const canvas = document.getElementById("parallaxCanvas");
const ctx = canvas.getContext("2d");

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const layers = Array.from({ length: 40 }, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  size: Math.random() * 3 + 1,
  depth: Math.random() * 3 + 1
}));

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX / window.innerWidth - 0.5;
  mouseY = e.clientY / window.innerHeight - 0.5;
});

let mouseX = 0, mouseY = 0;

function draw() {
  ctx.clearRect(0, 0, w, h);

  for (const s of layers) {
    const offsetX = mouseX * s.depth * 25;
    const offsetY = mouseY * s.depth * 25;

    ctx.beginPath();
    ctx.arc(s.x + offsetX, s.y + offsetY, s.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(214,185,40,0.25)";
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

draw();