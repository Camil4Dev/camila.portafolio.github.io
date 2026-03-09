(function () {
  const earlySmallScreen = window.matchMedia('(max-width: 768px)').matches;
  const earlySaveData = navigator.connection && navigator.connection.saveData;
  const earlyLowMemory = (navigator.deviceMemory || 4) <= 4;
  const earlyLowCores = (navigator.hardwareConcurrency || 4) <= 4;
  if (earlySaveData || (earlySmallScreen && (earlyLowMemory || earlyLowCores))) {
    document.documentElement.classList.add('performance-lite');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    const lowMemory = (navigator.deviceMemory || 4) <= 4;
    const lowCores = (navigator.hardwareConcurrency || 4) <= 4;
    const performanceLite = !!(saveData || (isSmallScreen && (lowMemory || lowCores)));
    let pointerRafId = 0;

    if (performanceLite) {
      document.documentElement.classList.add('performance-lite');
    }

    let pointerResetTimer = 0;
    let pendingPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    function commitPointer() {
      const x = pendingPointer.x;
      const y = pendingPointer.y;
      root.style.setProperty('--mx', ((x / window.innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty('--my', ((y / window.innerHeight) * 2 - 1).toFixed(3));
      pointerRafId = 0;
    }

    function schedulePointerUpdate(e) {
      const x = (e.clientX ?? (e.touches && e.touches[0].clientX) ?? window.innerWidth / 2);
      const y = (e.clientY ?? (e.touches && e.touches[0].clientY) ?? window.innerHeight / 2);
      pendingPointer = { x, y };

      if (!pointerRafId) pointerRafId = requestAnimationFrame(commitPointer);

      if (pointerResetTimer) clearTimeout(pointerResetTimer);
      pointerResetTimer = setTimeout(() => {
        root.style.setProperty('--mx', '0');
        root.style.setProperty('--my', '0');
      }, 2500);
    }

    if (!prefersReducedMotion && !performanceLite) {
      window.addEventListener('mousemove', schedulePointerUpdate, { passive: true });
      window.addEventListener('touchmove', schedulePointerUpdate, { passive: true });
    } else {
      root.style.setProperty('--mx', '0');
      root.style.setProperty('--my', '0');
    }

    const revealEls = $$('[data-reveal]');
    if (revealEls.length) {
      if (prefersReducedMotion || performanceLite) {
        revealEls.forEach((el) => el.classList.add('is-revealed'));
      } else {
        const obs = new IntersectionObserver((entries, ob) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            en.target.classList.add('is-revealed');
            ob.unobserve(en.target);
          });
        }, { threshold: 0.12 });
        revealEls.forEach((el) => obs.observe(el));
      }
    }

    $$('a, .nav-button').forEach((a) => {
      try {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || a.target === '_blank') return;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          if (prefersReducedMotion) {
            window.location.href = href;
            return;
          }
          document.body.classList.add('page-exit');
          setTimeout(() => {
            window.location.href = href;
          }, 280);
        });
      } catch (e) {
      }
    });

    function ripple(e) {
      if (prefersReducedMotion || performanceLite) return;
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const span = document.createElement('span');
      span.className = 'ripple';
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? (rect.left + rect.width / 2);
      const clientY = e.clientY ?? (e.touches && e.touches[0].clientY) ?? (rect.top + rect.height / 2);
      span.style.left = `${clientX - rect.left}px`;
      span.style.top = `${clientY - rect.top}px`;
      btn.appendChild(span);
      setTimeout(() => span.remove(), 650);
    }

    $$('button, .nav-button, .skill-card, .project-card, .contact-link').forEach((el) => {
      el.style.position = el.style.position || 'relative';
      el.addEventListener('pointerdown', ripple, { passive: true });
    });

    $$('.skill-card[data-tooltip], .logo-tooltip[data-tooltip]').forEach((el) => {
      if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
      const tip = el.getAttribute('data-tooltip');
      if (tip && !el.getAttribute('aria-label')) el.setAttribute('aria-label', tip);
    });

    let term = false;
    window.addEventListener('keydown', (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 't') {
        term = !term;
        document.body.classList.toggle('terminal-mode', term);
      }
    });

    const konami = [38, 38, 40, 40];
    let idx = 0;
    window.addEventListener('keydown', (e) => {
      if (e.keyCode === konami[idx]) {
        idx += 1;
        if (idx === konami.length) {
          idx = 0;
          document.body.classList.add('konami');
          setTimeout(() => document.body.classList.remove('konami'), 1800);
        }
      } else {
        idx = 0;
      }
    });

    if (prefersReducedMotion) document.documentElement.classList.add('reduced-motion');

    const filterButtons = $$('.filter-button');
    const projectLinks = $$('.project-link');
    if (filterButtons.length && projectLinks.length) {
      const applyFilter = (filter) => {
        projectLinks.forEach((link) => {
          const tags = (link.dataset.tags || '').split(',').map((t) => t.trim());
          const matches = filter === 'all' || tags.includes(filter);
          link.classList.toggle('is-hidden', !matches);
          link.setAttribute('aria-hidden', (!matches).toString());
        });

        filterButtons.forEach((btn) => {
          const isActive = btn.dataset.filter === filter;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-checked', isActive.toString());
          btn.tabIndex = isActive ? 0 : -1;
        });
      };

      filterButtons.forEach((btn, buttonIndex) => {
        btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
        btn.addEventListener('keydown', (ev) => {
          const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
          if (!keys.includes(ev.key)) return;
          ev.preventDefault();
          const dir = (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') ? 1 : -1;
          const nextIndex = (buttonIndex + dir + filterButtons.length) % filterButtons.length;
          const nextBtn = filterButtons[nextIndex];
          if (!nextBtn) return;
          nextBtn.focus();
          applyFilter(nextBtn.dataset.filter);
        });
      });

      applyFilter('all');
    }

    const track = document.getElementById('collabsTrack');
    if (track && track.children.length > 0) {
      const originalCardCount = track.children.length;

      function cloneCards() {
        const cards = Array.from(track.children).slice(0, originalCardCount);
        cards.forEach((card) => {
          track.appendChild(card.cloneNode(true));
        });
      }

      cloneCards();

      setTimeout(() => {
        let scrollPosition = 0;
        const scrollSpeed = performanceLite ? 1 : 1.5;
        let singleRowWidth = 0;
        let resizeTimer = 0;
        let collabsVisible = true;
        let manualPaused = false;
        let collabsRafId = 0;
        const collabsToggleBtn = document.getElementById('collabs-toggle');

        function calculateWidth() {
          singleRowWidth = 0;
          for (let i = 0; i < originalCardCount; i += 1) {
            const card = track.children[i];
            if (card) singleRowWidth += card.offsetWidth + 28;
          }
        }

        function stopCollabsScroll() {
          if (!collabsRafId) return;
          cancelAnimationFrame(collabsRafId);
          collabsRafId = 0;
        }

        function autoScroll() {
          if (prefersReducedMotion || document.hidden || !collabsVisible || manualPaused) {
            collabsRafId = 0;
            return;
          }
          if (singleRowWidth <= 0) calculateWidth();
          scrollPosition += scrollSpeed;
          if (scrollPosition >= singleRowWidth) scrollPosition = 0;
          track.scrollLeft = scrollPosition;
          collabsRafId = requestAnimationFrame(autoScroll);
        }

        function startCollabsScroll() {
          if (!collabsRafId && collabsVisible && !manualPaused) autoScroll();
        }

        calculateWidth();

        document.addEventListener('visibilitychange', () => {
          if (document.hidden || !collabsVisible) stopCollabsScroll();
          else startCollabsScroll();
        });

        track.addEventListener('pointerenter', stopCollabsScroll, { passive: true });
        track.addEventListener('pointerleave', startCollabsScroll, { passive: true });
        track.addEventListener('focusin', stopCollabsScroll);
        track.addEventListener('focusout', startCollabsScroll);

        if ('IntersectionObserver' in window) {
          const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              collabsVisible = entry.isIntersecting;
              if (collabsVisible) startCollabsScroll();
              else stopCollabsScroll();
            });
          }, { threshold: 0.2 });
          visibilityObserver.observe(track);
        }

        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(calculateWidth, 150);
        }, { passive: true });

        if (collabsToggleBtn) {
          const setToggleLabel = () => {
            const pausedLabel = root.lang === 'en' ? 'Resume scroll' : 'Reanudar scroll';
            const runningLabel = root.lang === 'en' ? 'Pause scroll' : 'Pausar scroll';
            const label = manualPaused ? pausedLabel : runningLabel;
            collabsToggleBtn.textContent = label;
            collabsToggleBtn.dataset.paused = manualPaused ? 'true' : 'false';
            collabsToggleBtn.setAttribute('aria-pressed', manualPaused ? 'true' : 'false');
          };

          collabsToggleBtn.addEventListener('click', () => {
            manualPaused = !manualPaused;
            if (manualPaused) stopCollabsScroll();
            else startCollabsScroll();
            setToggleLabel();
          });

          setToggleLabel();
        }

        startCollabsScroll();
      }, 300);
    }

    const collabsSection = document.querySelector('.collabs-section');
    if (collabsSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll('.collab-card').forEach((card, i) => {
            setTimeout(() => card.classList.add('visible'), i * 120);
          });
        });
      }, { threshold: 0.3 });

      observer.observe(collabsSection);
    }
  });
})();
