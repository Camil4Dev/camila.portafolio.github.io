(function () {

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));


  const root = document.documentElement;
  let lastMove = 0;

  function onPointer(e) {
    const x = (e.clientX || (e.touches?.[0]?.clientX) || window.innerWidth / 2);
    const y = (e.clientY || (e.touches?.[0]?.clientY) || window.innerHeight / 2);

    root.style.setProperty('--mx', ((x / window.innerWidth) * 2 - 1).toFixed(3));
    root.style.setProperty('--my', ((y / window.innerHeight) * 2 - 1).toFixed(3));
    lastMove = Date.now();
  }

  window.addEventListener('mousemove', onPointer, { passive: true });
  window.addEventListener('touchmove', onPointer, { passive: true });

  setInterval(() => {
    if (Date.now() - lastMove > 2500) {
      root.style.setProperty('--mx', '0');
      root.style.setProperty('--my', '0');
    }
  }, 1000);


  
  const revealElements = $$('[data-reveal]');
  if (revealElements.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));
  }


  $$('.nav-button, a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || a.target === '_blank') return;

    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(() => { window.location.href = href; }, 300);
    });
  });



  function rippleEffect(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');

    ripple.className = 'ripple';
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  $$('.nav-button, .contact-link, .skill-card, .project-card').forEach(btn => {
    btn.style.position = 'relative';
    btn.addEventListener('click', rippleEffect);
  });



  let terminal = false;
  window.addEventListener('keydown', e => {
    if (e.shiftKey && e.key.toLowerCase() === 't') {
      terminal = !terminal;
      document.body.classList.toggle('terminal-mode', terminal);
    }
  });



  const konami = [38,38,40,40];
  let konamiIndex = 0;

  window.addEventListener('keydown', (e) => {
    if (e.keyCode === konami[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konami.length) {
        konamiIndex = 0;
        document.body.classList.add('konami');
        setTimeout(() => document.body.classList.remove('konami'), 2000);
      }
    } else {
      konamiIndex = 0;
    }
  });


 
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduced-motion');
  }

})();