(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const $ = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));
    const root = document.documentElement;
    let lastMove = Date.now();

    
    function onPointer(e) {
      const x = (e.clientX ?? (e.touches && e.touches[0].clientX) ?? window.innerWidth/2);
      const y = (e.clientY ?? (e.touches && e.touches[0].clientY) ?? window.innerHeight/2);
      root.style.setProperty('--mx', ((x / window.innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty('--my', ((y / window.innerHeight) * 2 - 1).toFixed(3));
      lastMove = Date.now();
    }
    window.addEventListener('mousemove', onPointer, {passive:true});
    window.addEventListener('touchmove', onPointer, {passive:true});
    setInterval(()=> {
      if (Date.now() - lastMove > 2500) {
        root.style.setProperty('--mx','0');
        root.style.setProperty('--my','0');
      }
    }, 1200);

   
    const revealEls = $$('[data-reveal]');
    if (revealEls.length) {
      const obs = new IntersectionObserver((entries, ob) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add('revealed');
            ob.unobserve(en.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(el => obs.observe(el));
    } else {
      console.info('ui.js: no elements with [data-reveal] found.');
    }

   
    $$('a, .nav-button').forEach(a => {
      try {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || a.target === '_blank') return;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          document.body.classList.add('page-exit');
          setTimeout(()=> window.location.href = href, 280);
        });
      } catch(e) {  }
    });

    
    function ripple(e){
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const span = document.createElement('span');
      span.className = 'ripple';
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? (rect.left + rect.width/2);
      const clientY = e.clientY ?? (e.touches && e.touches[0].clientY) ?? (rect.top + rect.height/2);
      span.style.left = (clientX - rect.left) + 'px';
      span.style.top = (clientY - rect.top) + 'px';
      btn.appendChild(span);
      setTimeout(()=> span.remove(), 650);
    }
    $$('button, .nav-button, .skill-card, .project-card, .contact-link').forEach(el => {
      el.style.position = el.style.position || 'relative';
      el.addEventListener('click', ripple);
    });

    
    let term = false;
    window.addEventListener('keydown', (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 't') {
        term = !term;
        document.body.classList.toggle('terminal-mode', term);
      }
    });

 
    const konami = [38,38,40,40,37,39,37,39,66,65];
    let idx = 0;
    window.addEventListener('keydown', (e) => {
      if (e.keyCode === konami[idx]) {
        idx++;
        if (idx === konami.length) {
          idx = 0;
          document.body.classList.add('konami');
          setTimeout(()=> document.body.classList.remove('konami'), 1800);
        }
      } else idx = 0;
    });

 
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduced-motion');
    }

  
    console.info('ui.js loaded — reveal elements:', revealEls.length);
  });
})();