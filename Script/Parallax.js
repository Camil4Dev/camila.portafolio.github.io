const canvas = document.getElementById("parallaxCanvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);


const layers = [
    { count: 20,  size: 80,  speed: 0.10, color: "rgba(214,185,40,0.18)" },
    { count: 50,  size: 45,  speed: 0.25, color: "rgba(214,185,40,0.25)" },
    { count: 120, size: 20,  speed: 0.55, color: "rgba(214,185,40,0.35)" }
];


const FLOATING_COUNT = 70;

let objects = [];
let mouseX = 0, mouseY = 0;


layers.forEach(layer => {
    for (let i = 0; i < layer.count; i++) {
        objects.push({
            type: "bubble",
            layer,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: layer.size,
            speed: layer.speed,
            color: layer.color
        });
    }
});


for (let i = 0; i < FLOATING_COUNT; i++) {
    objects.push({
        type: "particle",
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
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


function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    objects.forEach(obj => {

        
        if (obj.type === "bubble") {
            obj.y += obj.speed;
            if (obj.y - obj.size > canvas.height) {
                obj.y = -obj.size;
                obj.x = Math.random() * canvas.width;
            }

            const px = obj.x + mouseX * obj.layer.speed * 50;
            const py = obj.y + mouseY * obj.layer.speed * 50;

            ctx.globalAlpha = 0.9;
            ctx.fillStyle = obj.color;
            ctx.beginPath();
            ctx.arc(px, py, obj.size * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }

        
        else {
            obj.x += obj.speedX;
            obj.y += obj.speedY;

            if (obj.x < 0 || obj.x > canvas.width) obj.x = Math.random() * canvas.width;
            if (obj.y < 0 || obj.y > canvas.height) obj.y = Math.random() * canvas.height;

            ctx.globalAlpha = 1;
            ctx.fillStyle = `rgba(214,185,40,${obj.opacity})`;
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    requestAnimationFrame(loop);
}

loop();