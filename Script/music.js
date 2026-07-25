(function () {
  const STORAGE_KEY = 'camila-music';

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveState(patch) {
    const state = { ...loadState(), ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { }
    return state;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const state = loadState();

    const audio = new Audio('media/sounds/Duvet.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = typeof state.volume === 'number' ? state.volume : 0.35;
    audio.muted = !!state.muted;
    if (typeof state.time === 'number' && isFinite(state.time)) {
      audio.currentTime = state.time;
    }

    const userPaused = !!state.paused;

    const widget = document.createElement('div');
    widget.className = 'music-player';
    widget.innerHTML = `
      <button type="button" class="music-btn music-toggle" aria-label="Reproducir / pausar música" title="Reproducir / pausar">
        <svg class="music-icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>
        <svg class="music-icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>
      </button>
      <div class="music-info">
        <span class="music-title">Duvet</span>
        <span class="music-artist">bôa</span>
      </div>
      <button type="button" class="music-btn music-mute" aria-label="Silenciar" title="Silenciar">
        <svg class="music-icon-vol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none"/><path d="M15.5 9.5a4 4 0 010 5"/><path d="M17.8 7.2a7 7 0 010 9.6"/></svg>
        <svg class="music-icon-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg>
      </button>
      <input type="range" class="music-volume" min="0" max="1" step="0.05" aria-label="Volumen">
    `;
    document.body.appendChild(widget);

    const toggleBtn = widget.querySelector('.music-toggle');
    const muteBtn = widget.querySelector('.music-mute');
    const volumeSlider = widget.querySelector('.music-volume');
    volumeSlider.value = audio.volume;

    function refreshUI() {
      widget.classList.toggle('is-playing', !audio.paused);
      widget.classList.toggle('is-muted', audio.muted || audio.volume === 0);
    }

    function tryPlay() {
      audio.play().then(refreshUI).catch(() => { });
    }

    toggleBtn.addEventListener('click', () => {
      if (audio.paused) {
        tryPlay();
        saveState({ paused: false });
      } else {
        audio.pause();
        saveState({ paused: true, time: audio.currentTime });
      }
      refreshUI();
    });

    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      saveState({ muted: audio.muted });
      refreshUI();
    });

    volumeSlider.addEventListener('input', () => {
      audio.volume = parseFloat(volumeSlider.value);
      if (audio.volume > 0 && audio.muted) {
        audio.muted = false;
        saveState({ muted: false });
      }
      saveState({ volume: audio.volume });
      refreshUI();
    });

    audio.addEventListener('play', refreshUI);
    audio.addEventListener('pause', refreshUI);

    setInterval(() => {
      if (!audio.paused) saveState({ time: audio.currentTime });
    }, 3000);

    window.addEventListener('pagehide', () => {
      saveState({ time: audio.currentTime, paused: audio.paused });
    });

    if (!userPaused) {
      tryPlay();
      const startOnInteraction = () => {
        if (audio.paused && !loadState().paused) tryPlay();
        window.removeEventListener('pointerdown', startOnInteraction);
        window.removeEventListener('keydown', startOnInteraction);
      };
      window.addEventListener('pointerdown', startOnInteraction);
      window.addEventListener('keydown', startOnInteraction);
    }

    refreshUI();
  });
})();
