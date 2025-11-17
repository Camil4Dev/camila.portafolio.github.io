(function () {
  const fxCanvas = document.getElementById('parallaxCanvas');
  if (!fxCanvas) return;
  const ctx = fxCanvas.getContext('2d', { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let objects = [];
  let mouseX = 0, mouseY = 0;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const LAYERS = [
    { count: 18, size: 80, speed: 0.08, color: 'rgba(214,185,40,0.14)' },
    { count: 42, size: 45, speed: 0.22, color: 'rgba(214,185,40,0.22)' },
    { count: 100, size: 20, speed: 0.5, color: 'rgba(214,185,40,0.32)' }
  ];

  const FLOATING_BASE = 60;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = fxCanvas.width = Math.round(window.innerWidth * dpr);
    h = fxCanvas.height = Math.round(window.innerHeight * dpr);
    fxCanvas.style.width = window.innerWidth + 'px';
    fxCanvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildObjects();
  }

  function rebuildObjects() {
    objects = [];
    const scaleFactor = Math.max(1, Math.min(window.innerWidth / 1200, 1.2));
    LAYERS.forEach(layer => {
      const count = Math.round(layer.count * scaleFactor * (isTouch ? 0.6 : 1));
      for (let i = 0; i < count; i++) {
        objects.push({
          type: 'bubble',
          layer,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: layer.size * (0.5 + Math.random() * 0.9),
          speed: layer.speed * (0.7 + Math.random() * 0.7),
          color: layer.color
        });
      }
    });

    const floatingCount = Math.round(FLOATING_BASE * (isTouch ? 0.5 : 1));
    for (let i = 0; i < floatingCount; i++) {
      objects.push({
        type: 'particle',
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (0.2 + Math.random() * 0.6),
        opacity: 0.15 + Math.random() * 0.6
      });
    }
  }

  
  function setPointer(x, y) {
    mouseX = (x - window.innerWidth / 2) / window.innerWidth;
    mouseY = (y - window.innerHeight / 2) / window.innerHeight;
  }

  window.addEventListener('mousemove', (e) => setPointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const t = e.touches[0];
    setPointer(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener('resize', () => {
   
    clearTimeout(window.___parallax_resize_timeout);
    window.___parallax_resize_timeout = setTimeout(resize, 120);
  });

  function loop() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    
    const objs = objects;
    for (let i = 0, len = objs.length; i < len; i++) {
      const obj = objs[i];

      if (obj.type === 'bubble') {
        obj.y += obj.speed;
        if (obj.y - obj.size > window.innerHeight) {
          obj.y = -obj.size - Math.random() * 20;
          obj.x = Math.random() * window.innerWidth;
        }

        const px = obj.x + mouseX * obj.layer.speed * 45;
        const py = obj.y + mouseY * obj.layer.speed * 45;

        ctx.fillStyle = obj.color;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(px, py, obj.size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        obj.x += obj.speedX;
        obj.y += obj.speedY;
        if (obj.x < -10 || obj.x > window.innerWidth + 10) obj.x = Math.random() * window.innerWidth;
        if (obj.y < -10 || obj.y > window.innerHeight + 10) obj.y = Math.random() * window.innerHeight;

        ctx.globalAlpha = obj.opacity;
        ctx.fillStyle = 'rgba(214,185,40,1)';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(loop);
  }


  resize();
  loop();
})();