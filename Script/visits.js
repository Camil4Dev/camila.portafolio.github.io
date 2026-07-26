(function () {
  const EMOJIS = ['💜', '🔥', '⭐', '👾', '🇦🇷'];

  async function api(path, options) {
    const res = await fetch(path, options);
    if (!res.ok) throw new Error(`${path} failed`);
    return res.json();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const countEl = document.getElementById('visitor-count');
    const reactionsRow = document.getElementById('reactions-row');
    if (!countEl || !reactionsRow) return;

    (async () => {
      try {
        let data;
        if (!sessionStorage.getItem('profile-viewed')) {
          data = await api('/api/views', { method: 'POST' });
          sessionStorage.setItem('profile-viewed', '1');
        } else {
          data = await api('/api/views');
        }
        countEl.textContent = Number(data.count).toLocaleString();
      } catch (e) {
        countEl.textContent = '—';
      }
    })();

    const reacted = (() => {
      try { return JSON.parse(localStorage.getItem('profile-reactions')) || {}; }
      catch (e) { return {}; }
    })();

    const buttons = {};
    EMOJIS.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reaction-btn';
      btn.innerHTML = `<span class="reaction-emoji">${emoji}</span><span class="reaction-count">0</span>`;
      if (reacted[emoji]) btn.classList.add('is-reacted');
      btn.addEventListener('click', async () => {
        if (reacted[emoji]) return;
        reacted[emoji] = true;
        btn.classList.add('is-reacted', 'reaction-pop');
        const countSpan = btn.querySelector('.reaction-count');
        countSpan.textContent = Number(countSpan.textContent) + 1;
        try { localStorage.setItem('profile-reactions', JSON.stringify(reacted)); } catch (e) { }
        try {
          const data = await api('/api/reactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emoji })
          });
          if (data.count !== null && data.count !== undefined) countSpan.textContent = Number(data.count).toLocaleString();
        } catch (e) { }
        setTimeout(() => btn.classList.remove('reaction-pop'), 500);
      });
      buttons[emoji] = btn;
      reactionsRow.appendChild(btn);
    });

    (async () => {
      try {
        const rows = await api('/api/reactions');
        rows.forEach((row) => {
          const btn = buttons[row.emoji];
          if (btn) btn.querySelector('.reaction-count').textContent = Number(row.count).toLocaleString();
        });
      } catch (e) { }
    })();
  });
})();
