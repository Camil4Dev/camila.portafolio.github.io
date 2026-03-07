(function () {
  const DISCORD_USER_ID = "932721517995888650";
  const LANYARD_API = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;
  const LANYARD_SOCKET_URL = "wss://api.lanyard.rest/socket";
  const VISIBLE_POLL_MS = 60 * 1000;
  const HIDDEN_POLL_MS = 5 * 60 * 1000;
  const MAX_BACKOFF_MS = 10 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 5000;
  const STALE_AFTER_MS = 10 * 60 * 1000;
  const WS_RECONNECT_BASE_MS = 3000;
  const WS_RECONNECT_MAX_MS = 60 * 1000;

  let pollTimerId = 0;
  let heartbeatTimerId = 0;
  let reconnectTimerId = 0;
  let socket = null;
  let started = false;
  let consecutiveFailures = 0;
  let lastSuccessAt = 0;
  let reconnectAttempts = 0;
  let pollingEnabled = true;
  let currentBadgeId = "admin-badge";

  function getBadge() {
    return document.getElementById(currentBadgeId);
  }

  function applyBadgeState(state) {
    const badge = getBadge();
    if (!badge) return;

    const states = ["online", "idle", "dnd", "offline", "unavailable"];
    states.forEach((key) => badge.classList.remove(`is-${key}`));
    badge.classList.add(`is-${state}`);
    badge.dataset.discordStatus = state;
  }

  function mapDiscordStatus(discordStatus) {
    if (discordStatus === "online") return "online";
    if (discordStatus === "idle") return "idle";
    if (discordStatus === "dnd") return "dnd";
    if (discordStatus === "offline") return "offline";
    return "unavailable";
  }

  function setPollingEnabled(enabled) {
    pollingEnabled = enabled;
    if (!enabled && pollTimerId) {
      clearTimeout(pollTimerId);
      pollTimerId = 0;
    }
  }

  function clearHeartbeat() {
    if (heartbeatTimerId) {
      clearInterval(heartbeatTimerId);
      heartbeatTimerId = 0;
    }
  }

  function safeSend(payload) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  }

  function sendSubscribe() {
    safeSend({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } });
  }

  function startHeartbeat(intervalMs) {
    clearHeartbeat();
    if (!intervalMs || intervalMs <= 0) return;

    heartbeatTimerId = setInterval(() => {
      safeSend({ op: 3 });
    }, intervalMs);
  }

  function extractSocketStatus(data) {
    if (!data) return null;
    if (typeof data.discord_status === "string") return data.discord_status;
    if (data[DISCORD_USER_ID] && typeof data[DISCORD_USER_ID].discord_status === "string") {
      return data[DISCORD_USER_ID].discord_status;
    }
    return null;
  }

  async function fetchPresenceWithTimeout(timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(LANYARD_API, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Lanyard HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function scheduleNextTick() {
    if (!pollingEnabled) return;
    if (pollTimerId) clearTimeout(pollTimerId);

    const base = document.hidden ? HIDDEN_POLL_MS : VISIBLE_POLL_MS;
    const backoffFactor = Math.min(consecutiveFailures, 3);
    const delay = Math.min(base * (2 ** backoffFactor), MAX_BACKOFF_MS);
    pollTimerId = setTimeout(tick, delay);
  }

  async function tick() {
    if (!pollingEnabled) return;

    const badge = getBadge();
    if (!badge) return;

    try {
      const payload = await fetchPresenceWithTimeout(REQUEST_TIMEOUT_MS);
      const discordStatus = payload?.data?.discord_status;
      const mapped = mapDiscordStatus(discordStatus);

      applyBadgeState(mapped);
      lastSuccessAt = Date.now();
      consecutiveFailures = 0;
    } catch (error) {
      consecutiveFailures += 1;
      const isStale = !lastSuccessAt || (Date.now() - lastSuccessAt) > STALE_AFTER_MS;
      if (isStale || consecutiveFailures >= 3) {
        applyBadgeState("unavailable");
      }
      console.warn("Discord presence unavailable", error);
    } finally {
      scheduleNextTick();
    }
  }

  function cleanupSocket() {
    clearHeartbeat();
    if (!socket) return;

    try {
      socket.close();
    } catch (error) {
      console.warn("Socket close failed", error);
    }
    socket = null;
  }

  function scheduleReconnect() {
    if (!started) return;
    if (reconnectTimerId) return;

    const backoff = Math.min(WS_RECONNECT_BASE_MS * (2 ** reconnectAttempts), WS_RECONNECT_MAX_MS);
    reconnectAttempts += 1;

    reconnectTimerId = setTimeout(() => {
      reconnectTimerId = 0;
      connectSocket();
    }, backoff);
  }

  function handleSocketMessage(event) {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      return;
    }

    if (payload.op === 1) {
      const interval = payload?.d?.heartbeat_interval;
      startHeartbeat(interval);
      sendSubscribe();
      setPollingEnabled(false);
      return;
    }

    if (payload.op !== 0) return;

    const discordStatus = extractSocketStatus(payload.d);
    if (!discordStatus) return;

    const mapped = mapDiscordStatus(discordStatus);
    applyBadgeState(mapped);
    lastSuccessAt = Date.now();
    consecutiveFailures = 0;
    reconnectAttempts = 0;
    setPollingEnabled(false);
  }

  function connectSocket() {
    if (!started) return;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    cleanupSocket();

    try {
      socket = new WebSocket(LANYARD_SOCKET_URL);
    } catch (error) {
      console.warn("Presence socket init failed", error);
      setPollingEnabled(true);
      tick();
      scheduleReconnect();
      return;
    }

    socket.addEventListener("open", () => {
      if (reconnectTimerId) {
        clearTimeout(reconnectTimerId);
        reconnectTimerId = 0;
      }
      sendSubscribe();
    });

    socket.addEventListener("message", handleSocketMessage);

    socket.addEventListener("error", () => {
      setPollingEnabled(true);
      tick();
    });

    socket.addEventListener("close", () => {
      clearHeartbeat();
      setPollingEnabled(true);

      const isStale = !lastSuccessAt || (Date.now() - lastSuccessAt) > STALE_AFTER_MS;
      if (isStale) applyBadgeState("unavailable");

      tick();
      scheduleReconnect();
    });
  }

  function start(options = {}) {
    currentBadgeId = options.badgeId || currentBadgeId;

    if (started) {
      connectSocket();
      tick();
      return;
    }

    started = true;
    connectSocket();
    tick();

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        connectSocket();
        if (pollingEnabled) tick();
      }
    });
  }

  window.PresenceBadge = {
    start
  };
})();