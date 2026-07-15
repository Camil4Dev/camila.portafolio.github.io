(function () {
  const container = document.getElementById("profile-media");
  if (!container) return;

  const animeLoading = document.getElementById("anime-loading");
  const animeRows = document.getElementById("anime-rows");
  const animeTracks = {
    CURRENT: document.getElementById("anime-current-track"),
    COMPLETED: document.getElementById("anime-completed-track"),
    PAUSED: document.getElementById("anime-paused-track"),
    DROPPED: document.getElementById("anime-dropped-track"),
    PLANNING: document.getElementById("anime-planning-track")
  };
  const animeEmptyText = document.getElementById("anime-empty-text");
  const songsLoading = document.getElementById("songs-loading");
  const songsContent = document.getElementById("songs-content");
  const songsEmptyText = document.getElementById("songs-empty-text");

  const anilistUser = container.dataset.anilistUser;
  const spotifyTracks = container.dataset.spotifyTracks;

  function hide(el) {
    if (!el) return;
    el.classList.add("is-hidden");
    el.style.display = "none";
  }

  function show(el) {
    if (!el) return;
    el.classList.remove("is-hidden");
    el.style.display = "";
  }

  function createEmptyMessage(text) {
    const p = document.createElement("p");
    p.className = "media-empty";
    p.textContent = text;
    return p;
  }

  function createAnimeCard(entry) {
    const link = document.createElement("a");
    link.href = entry.siteUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "anime-card";

    const img = document.createElement("img");
    img.src = entry.coverImage || "media/proyectos/icon.png";
    img.alt = entry.title;
    img.className = "anime-cover";
    img.width = 320;
    img.height = 180;
    img.loading = "lazy";
    img.decoding = "async";

    const text = document.createElement("div");
    text.className = "anime-text";

    const title = document.createElement("div");
    title.className = "anime-title";
    title.textContent = entry.title;

    const meta = document.createElement("div");
    meta.className = "anime-status";
    meta.textContent = entry.statusLabel;

    text.appendChild(title);
    text.appendChild(meta);

    link.appendChild(img);
    link.appendChild(text);

    return link;
  }

  function parseTrackId(value) {
    if (!value) return "";
    if (value.includes("spotify.com/track/")) {
      const parts = value.split("spotify.com/track/")[1];
      return parts ? parts.split("?")[0] : "";
    }
    if (value.includes("spotify.com/intl-")) {
      const parts = value.split("spotify.com/")[1];
      if (!parts) return "";
      const trackPart = parts.split("track/")[1];
      return trackPart ? trackPart.split("?")[0] : "";
    }
    if (value.includes("spotify.com/intl-es/track/")) {
      const parts = value.split("spotify.com/intl-es/track/")[1];
      return parts ? parts.split("?")[0] : "";
    }
    if (value.startsWith("spotify:track:")) {
      return value.replace("spotify:track:", "");
    }
    return value;
  }

  function getStatusLabel(status) {
    const isEnglish = document.documentElement.lang && document.documentElement.lang.startsWith("en");
    if (status === "CURRENT") return isEnglish ? "Watching" : "Viendo";
    if (status === "COMPLETED") return isEnglish ? "Completed" : "Visto";
    if (status === "PAUSED") return isEnglish ? "Paused" : "Pausado";
    if (status === "DROPPED") return isEnglish ? "Dropped" : "Droppeado";
    if (status === "PLANNING") return isEnglish ? "Planning" : "Planning";
    return status;
  }

  function setupAutoScroll(track) {
    if (!track || track.children.length === 0) return;

    if (track._animeRafId) {
      cancelAnimationFrame(track._animeRafId);
      track._animeRafId = 0;
    }

    let scrollPosition = 0;

    function loop() {
      if (document.hidden) {
        track._animeRafId = 0;
        return;
      }

      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) {
        track._animeRafId = 0;
        return;
      }

      scrollPosition += 0.35;
      if (scrollPosition >= maxScroll) scrollPosition = 0;
      track.scrollLeft = scrollPosition;
      track._animeRafId = requestAnimationFrame(loop);
    }

    track.addEventListener("pointerenter", () => {
      if (track._animeRafId) cancelAnimationFrame(track._animeRafId);
      track._animeRafId = 0;
    }, { passive: true });

    track.addEventListener("pointerleave", () => {
      if (!track._animeRafId) track._animeRafId = requestAnimationFrame(loop);
    }, { passive: true });

    track._animeRafId = requestAnimationFrame(loop);
  }

  async function loadAnime() {
    if (!anilistUser || !animeRows) {
      hide(animeLoading);
      return;
    }

    try {
      const query = "query ($userName: String) { MediaListCollection(userName: $userName, type: ANIME, status_in: [CURRENT, COMPLETED, PAUSED, DROPPED, PLANNING]) { lists { status entries { media { title { romaji } siteUrl coverImage { large } } } } } }";
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          query,
          variables: { userName: anilistUser }
        })
      });

      const payload = await response.json();
      const lists = payload?.data?.MediaListCollection?.lists || [];
      const byStatus = {
        CURRENT: [],
        COMPLETED: [],
        PAUSED: [],
        DROPPED: [],
        PLANNING: []
      };

      lists.forEach((list) => {
        if (!byStatus[list.status]) return;
        const mapped = (list.entries || []).map((entry) => ({
          title: entry.media.title.romaji,
          siteUrl: entry.media.siteUrl,
          coverImage: entry.media.coverImage?.large,
          statusLabel: getStatusLabel(list.status)
        }));
        byStatus[list.status] = mapped;
      });

      hide(animeLoading);

      const total = Object.values(byStatus).reduce((sum, list) => sum + list.length, 0);
      if (!total) {
        if (animeLoading) animeLoading.textContent = animeEmptyText?.textContent || "Sin datos";
        show(animeLoading);
        hide(animeRows);
        return;
      }

      hide(animeLoading);
      show(animeRows);
      Object.keys(byStatus).forEach((status) => {
        const track = animeTracks[status];
        if (!track) return;
        track.innerHTML = "";
        byStatus[status].forEach((entry) => track.appendChild(createAnimeCard(entry)));
        if (byStatus[status].length) setupAutoScroll(track);
      });
    } catch (error) {
      if (animeLoading) animeLoading.textContent = animeEmptyText?.textContent || "Sin datos";
      show(animeLoading);
      hide(animeRows);
    }
  }

  function loadSongs() {
    hide(songsLoading);
    const rawTracks = spotifyTracks ? spotifyTracks.split("|").map((item) => item.trim()).filter(Boolean) : [];
    if (!rawTracks.length) {
      if (songsContent) songsContent.appendChild(createEmptyMessage(songsEmptyText?.textContent || "Sin datos"));
      return;
    }

    const trackIds = rawTracks.map(parseTrackId).filter(Boolean);
    if (!trackIds.length) {
      if (songsContent) songsContent.appendChild(createEmptyMessage(songsEmptyText?.textContent || "Sin datos"));
      return;
    }

    trackIds.forEach((trackId) => {
      const card = document.createElement("div");
      card.className = "song-card";

      const iframe = document.createElement("iframe");
      iframe.src = `https://open.spotify.com/embed/track/${trackId}?theme=0`;
      iframe.width = "100%";
      iframe.height = "80";
      iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      iframe.loading = "lazy";
      iframe.className = "song-iframe";

      card.appendChild(iframe);
      if (songsContent) songsContent.appendChild(card);
    });
  }

  loadAnime();
  loadSongs();
})();
