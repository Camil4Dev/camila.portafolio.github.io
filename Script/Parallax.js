const fxCanvas = document.getElementById("parallaxCanvas");
const fxCtx = fxCanvas.getContext("2d");

function resizeFX() {
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
}

resizeFX();
window.addEventListener("resize", resizeFX);


const layers = [
    { type: "bubble", count: 20,  size: 80,  speed: 0.10, color: "rgba(214,185,40,0.18)" },
    { type: "bubble", count: 50,  size: 45,  speed: 0.25, color: "rgba(214,185,40,0.25)" },
    { type: "bubble", count: 120, size: 20,  speed: 0.55, color: "rgba(214,185,40,0.35)" },
];

const floatingParticlesCount = 70;

let fxObjects = [];
let mouseX = 0, mouseY = 0;


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


document.addEventListener("mousemove", e => {
    mouseX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
    mouseY = (e.clientY - window.innerHeight / 2) / window.innerHeight;
});


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