(function () {
  function getLang() {
    if (typeof currentLang !== "undefined") return currentLang;
    if (typeof window.currentLang !== "undefined") return window.currentLang;
    return "es";
  }

  function getProfileText(key, fallback) {
    try {
      const lang = getLang();
      const map = translations?.[lang]?.profile;
      return map && map[key] ? map[key] : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getInitials(name, creatorEmoji) {
    const cleanName = (name || "").replace(creatorEmoji || "", "").trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    const first = parts[0][0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }

  function formatRelativeTime(date) {
    const prefix = getProfileText("timeAgoPrefix", "hace ");
    const suffix = getProfileText("timeAgoSuffix", "");
    const nowText = getProfileText("timeNow", "ahora");
    const units = {
      s: getProfileText("timeSecondShort", "s"),
      m: getProfileText("timeMinuteShort", "m"),
      h: getProfileText("timeHourShort", "h"),
      d: getProfileText("timeDayShort", "d"),
      w: getProfileText("timeWeekShort", "sem"),
      mo: getProfileText("timeMonthShort", "mes"),
      y: getProfileText("timeYearShort", "a")
    };

    const now = Date.now();
    const diff = Math.max(0, now - date.getTime());
    const seconds = Math.floor(diff / 1000);
    if (seconds < 10) return nowText;
    if (seconds < 60) return `${prefix}${seconds}${units.s}${suffix}`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${prefix}${minutes}${units.m}${suffix}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${prefix}${hours}${units.h}${suffix}`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${prefix}${days}${units.d}${suffix}`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${prefix}${weeks}${units.w}${suffix}`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${prefix}${months}${units.mo}${suffix}`;

    const years = Math.floor(days / 365);
    return `${prefix}${years}${units.y}${suffix}`;
  }

  function looksLikeSpam(name, message) {
    const linkMatches = (message.match(/https?:\/\//gi) || []).length;
    if (linkMatches >= 3) return true;
    if (/(.)\1{7,}/.test(message)) return true;
    const tokens = message.toLowerCase().split(/\s+/).filter(Boolean);
    const freq = tokens.reduce((acc, token) => {
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});
    if (Object.values(freq).some((count) => count >= 6)) return true;
    if (name && /https?:\/\//i.test(name)) return true;
    return false;
  }

  window.CommentsShared = {
    getLang,
    getProfileText,
    getInitials,
    formatRelativeTime,
    looksLikeSpam
  };
})();
