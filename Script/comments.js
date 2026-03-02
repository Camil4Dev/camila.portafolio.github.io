const supabaseUrl = "https://fldqudjajhuxgvmrjduq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZHF1ZGphamh1eGd2bXJqZHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTg3OTcsImV4cCI6MjA4NzA5NDc5N30.u9BKB3av9UD4hGSwh17Ty7MQ1ctKU7hRbao6pxn59R4";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_UID = "9f531012-2216-4902-8feb-98759d266c44";

const MAX_LENGTH = 500;
const COMMENT_COOLDOWN = 10000;
const DRAFT_KEY = "comment_draft";

let lastCommentTime = 0;
const CREATOR_EMOJI = "📺";

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
  } catch (e) {
    return fallback;
  }
}


function getInitials(name) {
  const cleanName = (name || "").replace(CREATOR_EMOJI, "").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) {
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    setTimeout(() => toast.remove(), 250);
  }, 2600);
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

function updateRelativeTimes() {
  document.querySelectorAll(".comment-time").forEach((el) => {
    const ts = el.dataset.timestamp;
    if (!ts) return;
    const date = new Date(ts);
    el.textContent = formatRelativeTime(date);
  });
}

function getDraft() {
  try {
    const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    return {
      name: stored.name || "",
      message: stored.message || ""
    };
  } catch (e) {
    return { name: "", message: "" };
  }
}

function saveDraft(name, message) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, message }));
  } catch (e) { }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) { }
}

function looksLikeSpam(name, message) {
  const linkMatches = (message.match(/https?:\/\//gi) || []).length;
  if (linkMatches >= 3) return true;
  if (/(.)\1{7,}/.test(message)) return true;
  const tokens = message.toLowerCase().split(/\s+/).filter(Boolean);
  const freq = tokens.reduce((acc, t) => (acc[t] = (acc[t] || 0) + 1, acc), {});
  if (Object.values(freq).some(count => count >= 6)) return true;
  if (name && /https?:\/\//i.test(name)) return true;
  return false;
}

function updatePreview(name, message) {
  const previewName = document.getElementById("comment-preview-name");
  const previewMessage = document.getElementById("comment-preview-message");
  const previewAvatar = document.querySelector("#comment-preview-card .comment-avatar");
  if (previewName) previewName.textContent = name || getProfileText("commentPreviewName", "Tu nombre");
  if (previewMessage) {
    previewMessage.textContent = message || getProfileText("commentPreviewPlaceholder", "Escribí tu mensaje para ver la vista previa.");
  }
  if (previewAvatar) previewAvatar.textContent = getInitials(name || "?");
}

async function loadComments(sortMode = "recent") {
  
  const { data: { user } } = await supabaseClient.auth.getUser();
  const isAdmin = user && user.id === ADMIN_UID;

  const { data, error } = await supabaseClient
    .from("comments")
    .select("*")
    .order("created_at", { ascending: sortMode === "oldest" });

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("comments-list");
  if (!container) return;

  container.innerHTML = "";

  const filtered = sortMode === "featured"
    ? data.filter(comment => (comment.name || "").includes(CREATOR_EMOJI))
    : data;

  filtered.forEach((comment, index) => {
    const div = document.createElement("div");
    div.classList.add("comment-item");
    div.style.animationDelay = `${index * 0.08}s`;

    const avatar = document.createElement("div");
    avatar.classList.add("comment-avatar");
    avatar.textContent = getInitials(comment.name);
    avatar.title = comment.name;

    const strong = document.createElement("strong");
    strong.textContent = comment.name;

    const span = document.createElement("span");
    const createdAt = new Date(comment.created_at);
    span.classList.add("comment-time");
    span.dataset.timestamp = createdAt.toISOString();
    span.textContent = formatRelativeTime(createdAt);
    span.title = createdAt.toLocaleString();

    const p = document.createElement("p");
    p.textContent = comment.message;

    const header = document.createElement("div");
    header.classList.add("comment-header");

    header.appendChild(avatar);
    header.appendChild(strong);
    header.appendChild(span);

    div.appendChild(header);
    div.appendChild(p);

   
    if (isAdmin) {
      const creatorBtn = document.createElement("button");
      creatorBtn.classList.add("creator-btn");
      creatorBtn.textContent = comment.name.includes(CREATOR_EMOJI)
        ? getProfileText("commentCreatorRemove", "Quitar 📺")
        : getProfileText("commentCreatorAdd", "Agregar 📺");

      creatorBtn.addEventListener("click", async () => {
        const hasEmoji = strong.textContent.includes(CREATOR_EMOJI);
        const nextName = hasEmoji
          ? strong.textContent.replace(CREATOR_EMOJI, "").replace(/\s{2,}/g, " ").trim()
          : `${strong.textContent} ${CREATOR_EMOJI}`;

        const { error } = await supabaseClient
          .from("comments")
          .update({ name: nextName })
          .eq("id", comment.id);

        if (error) {
          showToast(getProfileText("commentUnauthorized", "No autorizado"), "error");
          return;
        }

        strong.textContent = nextName;
        creatorBtn.textContent = nextName.includes(CREATOR_EMOJI)
          ? getProfileText("commentCreatorRemove", "Quitar 📺")
          : getProfileText("commentCreatorAdd", "Agregar 📺");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = getProfileText("commentDelete", "Borrar");
      deleteBtn.classList.add("delete-btn");

      deleteBtn.addEventListener("click", async () => {
        const confirmText = getProfileText("commentDeleteConfirm", "¿Seguro que querés borrar este comentario?");
        if (!confirm(confirmText)) return;

        const { data, error } = await supabaseClient.functions.invoke(
          "delete-comment",
          { body: { id: comment.id } }
        );

        if (error || data?.error) {
          showToast(getProfileText("commentUnauthorized", "No autorizado"), "error");
          return;
        }

        div.remove();
      });

      div.appendChild(creatorBtn);
      div.appendChild(deleteBtn);
    }

    container.appendChild(div);
  });
}


async function addComment() {
  const nameInput = document.getElementById("comment-name");
  const messageInput = document.getElementById("comment-message");
  const countEl = document.getElementById("comment-count");
  const sendBtn = document.getElementById("send-comment");

  const setSending = (isSending) => {
    if (!sendBtn) return;
    if (!sendBtn.dataset.label) sendBtn.dataset.label = sendBtn.textContent;
    sendBtn.disabled = isSending;
    sendBtn.classList.toggle("is-loading", isSending);
    sendBtn.textContent = isSending ? getProfileText("commentSending", "Enviando...") : sendBtn.dataset.label;
  };

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (!name || !message) {
    showToast(getProfileText("commentEmpty", "Completá todos los campos"), "error");
    setSending(false);
    return;
  }

  if (message.length > MAX_LENGTH) {
    showToast(getProfileText("commentMax", "Máximo 500 caracteres"), "error");
    setSending(false);
    return;
  }

  const now = Date.now();
  if (now - lastCommentTime < COMMENT_COOLDOWN) {
    showToast(getProfileText("commentCooldown", "Esperá 10 segundos antes de comentar otra vez"), "error");
    setSending(false);
    return;
  }

  if (looksLikeSpam(name, message)) {
    showToast(getProfileText("commentSpam", "Tu comentario parece spam. Probá editarlo."), "error");
    setSending(false);
    return;
  }

  setSending(true);

  const { data, error } = await supabaseClient.functions.invoke(
    "super-responder",
    { body: { name, message } }
  );

  if (error) {
    console.error("ERROR COMPLETO:", error);
    showToast(getProfileText("commentSendError", "Error al enviar el comentario"), "error");
    setSending(false);
    return;
  }

  if (data?.error) {
    showToast(data.error, "error");
    setSending(false);
    return;
  }

  lastCommentTime = now;

  nameInput.value = "";
  messageInput.value = "";
  messageInput.style.height = "";

  if (countEl) countEl.textContent = `0/${MAX_LENGTH}`;

  clearDraft();
  updatePreview("", "");
  loadComments(currentSort);
  setSending(false);
  showToast(getProfileText("commentSendSuccess", "Comentario enviado"), "success");
}

async function checkAdmin() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  const adminBtn = document.getElementById("admin-toggle");
  const badge = document.getElementById("admin-badge");

  if (!adminBtn) return;

  if (badge) {
    badge.style.display = "inline-flex";
    badge.classList.remove("is-offline", "is-online");
  }

  if (user && user.id === ADMIN_UID) {
    adminBtn.classList.add("logged-in");
    const logoutLabel = getProfileText("adminLogout", "Logout");
    adminBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 12h10" />
        <path d="M15 8l4 4-4 4" />
        <path d="M5 5h7a2 2 0 012 2v2" />
        <path d="M14 15v2a2 2 0 01-2 2H5" />
      </svg>
      <span>${logoutLabel}</span>
    `;
    adminBtn.onclick = async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    };

    if (badge) badge.classList.add("is-online");
  } else {
    const adminLabel = getProfileText("adminLabel", "Admin");
    adminBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l7.5 4v5.5c0 4.5-3.4 8.7-7.5 9.5-4.1-0.8-7.5-5-7.5-9.5V7l7.5-4z" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
      <span>${adminLabel}</span>
    `;
    adminBtn.onclick = () => {
      document.getElementById("login-modal").classList.remove("hidden");
    };

    if (badge) badge.classList.add("is-offline");
  }
}

document.getElementById("admin-login-btn").addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showToast(getProfileText("adminLoginError", "Credenciales incorrectas"), "error");
    return;
  }

  document.getElementById("login-modal").classList.add("hidden");
  checkAdmin();
  loadComments();
});

document.getElementById("admin-cancel-btn").addEventListener("click", () => {
  document.getElementById("login-modal").classList.add("hidden");
});


document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.getElementById("comment-message");
  const countEl = document.getElementById("comment-count");
  const emojiToggle = document.getElementById("emoji-toggle");
  const emojiPanel = document.getElementById("emoji-panel");
  const emojiTabs = document.querySelectorAll(".emoji-tab");
  const emojiGrid = document.getElementById("emoji-grid");
  const emojiSearch = document.getElementById("emoji-search");
  const emojiTitle = document.getElementById("emoji-section-title");
  const emojiClear = document.getElementById("emoji-clear");
  const nameInput = document.getElementById("comment-name");
  const sortSelect = document.getElementById("comment-sort");

  let draftTimer = 0;
  window.currentSort = sortSelect?.value || "recent";

  const EMOJI_GROUPS = {
    faces: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😜","😝","😛","🫠","🫶","🤗","🤭","🫢","🤫","🤔","😐","😑","😶","🙄","😬","😮","😲","😳","🥳","😎","🤓","🥸","😴","🤤"],
    gestures: ["👍","👎","👏","🙌","🤝","✌️","🤘","🫡","💪","🙏","👌","👀","👋","🤙","🖐️","✋","🤟","☝️","👇","👉","👈","🫰","👐","🤲","🫶","🙅","🙆","🙋","🤷","🤦"],
    hearts: ["❤️","🧡","💛","💚","💙","💜","🩷","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💖","💗","💓","💞","💕","💝","💘","💟"],
    food: ["🍕","🍔","🍟","🌭","🍿","🥓","🥞","🧇","🍳","🍣","🍜","🍱","🍛","🍙","🍤","🥗","🥪","🍩","🍪","🎂","🍰","🧁","🍫","🍬","🍭","🧋","☕","🧃"],
    objects: ["🎮","🕹️","🧱","⛏️","🧪","🧠","⚙️","💻","🛠️","📌","📎","📷","🎧","🎵","🎤","🚀","🔥","✨","🧲","🔮","💡","🧩","🪄","📦","📡"],
    nature: ["🌿","🌱","🌸","🌙","⭐","☀️","⚡","🌊","🍀","🪐","🌌","🌈","🌧️","❄️","🔥","🌋","🪨","🌵","🦋","🐝","🐢"],
    symbols: ["✅","☑️","✔️","❌","⚠️","❗","❓","💯","🔔","🔕","🔒","🔓","💬","🗯️","💭","🎯","📌","🔹","🔸","🟢","🟡","🔴","⚪","⚫"],
    recent: []
  };

  const getEmojiLabels = () => ({
    recent: getProfileText("emojiLabelRecent", "Recientes"),
    faces: getProfileText("emojiLabelFaces", "Emoticonos y personas"),
    gestures: getProfileText("emojiLabelGestures", "Gestos"),
    hearts: getProfileText("emojiLabelHearts", "Corazones"),
    food: getProfileText("emojiLabelFood", "Comida"),
    objects: getProfileText("emojiLabelObjects", "Objetos"),
    nature: getProfileText("emojiLabelNature", "Naturaleza"),
    symbols: getProfileText("emojiLabelSymbols", "Símbolos")
  });

  const RECENT_KEY = "emoji_recent";

  const resizeMessage = () => {
    if (!messageInput) return;
    messageInput.style.height = "";
    messageInput.style.height = `${messageInput.scrollHeight}px`;
  };

  const updateCount = () => {
    if (!messageInput || !countEl) return;
    const value = messageInput.value.length;
    countEl.textContent = `${value}/${MAX_LENGTH}`;
    countEl.classList.toggle("is-warn", value >= 450 && value < MAX_LENGTH);
    countEl.classList.toggle("is-danger", value >= MAX_LENGTH);
  };

  const syncDraft = () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      saveDraft(nameInput?.value || "", messageInput?.value || "");
    }, 300);
  };

  const insertEmoji = (emoji) => {
    if (!messageInput) return;
    const start = messageInput.selectionStart ?? messageInput.value.length;
    const end = messageInput.selectionEnd ?? messageInput.value.length;
    const nextValue = messageInput.value.slice(0, start) + emoji + messageInput.value.slice(end);
    if (nextValue.length > MAX_LENGTH) return;
    messageInput.value = nextValue;
    const caret = start + emoji.length;
    messageInput.setSelectionRange(caret, caret);
    messageInput.focus();
    resizeMessage();
    updateCount();
    addRecentEmoji(emoji);
  };

  const closeEmojiPanel = () => {
    if (!emojiPanel || !emojiToggle) return;
    emojiPanel.classList.remove("is-open");
    emojiPanel.setAttribute("aria-hidden", "true");
    emojiToggle.setAttribute("aria-expanded", "false");
  };

  const toggleEmojiPanel = () => {
    if (!emojiPanel || !emojiToggle) return;
    const isOpen = emojiPanel.classList.toggle("is-open");
    emojiPanel.setAttribute("aria-hidden", (!isOpen).toString());
    emojiToggle.setAttribute("aria-expanded", isOpen.toString());
  };

  const loadRecentEmojis = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(stored)) EMOJI_GROUPS.recent = stored;
    } catch (e) { }
  };

  const saveRecentEmojis = () => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(EMOJI_GROUPS.recent));
    } catch (e) { }
  };

  const addRecentEmoji = (emoji) => {
    EMOJI_GROUPS.recent = [emoji, ...EMOJI_GROUPS.recent.filter(e => e !== emoji)].slice(0, 24);
    saveRecentEmojis();
    if (getActiveGroup() === "recent") renderEmojiGrid("recent");
  };

  const clearRecent = () => {
    EMOJI_GROUPS.recent = [];
    saveRecentEmojis();
    if (getActiveGroup() === "recent") renderEmojiGrid("recent");
  };

  const getActiveGroup = () => {
    const active = Array.from(emojiTabs).find(tab => tab.classList.contains("is-active"));
    return active?.dataset.group || "recent";
  };

  const renderEmojiGrid = (group, query = "") => {
    if (!emojiGrid) return;
    const term = query.trim().toLowerCase();
    const list = term
      ? Object.values(EMOJI_GROUPS).flat()
      : (EMOJI_GROUPS[group] || []);

    emojiGrid.innerHTML = "";

    const filtered = term ? list.filter((emoji) => emoji.includes(term) || emoji === term) : list;
    const labels = getEmojiLabels();
    if (emojiTitle) emojiTitle.textContent = term ? getProfileText("emojiResults", "Resultados") : (labels[group] || "Emojis");
    if (emojiClear) emojiClear.style.visibility = (group === "recent" && !term) ? "visible" : "hidden";

    filtered.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "emoji-btn";
      btn.dataset.emoji = emoji;
      btn.textContent = emoji;
      btn.addEventListener("click", () => insertEmoji(emoji));
      emojiGrid.appendChild(btn);
    });
  };

  if (messageInput) {
    messageInput.addEventListener("input", () => {
      if (messageInput.value.length > MAX_LENGTH) {
        messageInput.value = messageInput.value.slice(0, MAX_LENGTH);
      }
      resizeMessage();
      updateCount();
      updatePreview(nameInput?.value || "", messageInput.value);
      syncDraft();
    });
  }

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      updatePreview(nameInput.value, messageInput?.value || "");
      syncDraft();
    });
  }

  if (emojiToggle) {
    emojiToggle.addEventListener("click", (ev) => {
      ev.preventDefault();
      toggleEmojiPanel();
    });
  }

  emojiTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const group = tab.dataset.group;
      emojiTabs.forEach(t => {
        const isActive = t === tab;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", isActive.toString());
      });
      if (emojiSearch) emojiSearch.value = "";
      renderEmojiGrid(group);
    });

    tab.addEventListener("keydown", (ev) => {
      if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
      ev.preventDefault();
      const dir = ev.key === "ArrowRight" ? 1 : -1;
      const tabs = Array.from(emojiTabs);
      const currentIndex = tabs.indexOf(tab);
      const nextIndex = (currentIndex + dir + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        nextTab.focus();
        nextTab.click();
      }
    });
  });

  if (emojiSearch) {
    emojiSearch.addEventListener("input", () => {
      renderEmojiGrid(getActiveGroup(), emojiSearch.value);
    });
  }

  if (emojiClear) {
    emojiClear.addEventListener("click", () => clearRecent());
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      window.currentSort = sortSelect.value;
      loadComments(window.currentSort);
    });
  }

  document.addEventListener("click", (ev) => {
    if (!emojiPanel || !emojiToggle) return;
    const target = ev.target;
    if (emojiPanel.contains(target) || emojiToggle.contains(target)) return;
    closeEmojiPanel();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (!emojiPanel || !emojiToggle) return;
    if (!emojiPanel.classList.contains("is-open")) return;
    closeEmojiPanel();
    emojiToggle.focus();
  });

  resizeMessage();
  updateCount();

  const draft = getDraft();
  if (nameInput && draft.name) nameInput.value = draft.name;
  if (messageInput && draft.message) messageInput.value = draft.message;
  updatePreview(nameInput?.value || "", messageInput?.value || "");

  if (emojiSearch) {
    const placeholder = getProfileText("emojiSearchPlaceholder", "Buscar emojis");
    emojiSearch.placeholder = placeholder;
    emojiSearch.setAttribute("aria-label", placeholder);
  }

  if (emojiClear) emojiClear.textContent = getProfileText("emojiClear", "Borrar todo");

  loadRecentEmojis();
  if (emojiTabs.length) {
    renderEmojiGrid(emojiTabs[0].dataset.group || "recent");
  }

  checkAdmin();
  loadComments(window.currentSort);
  updateRelativeTimes();
  setInterval(updateRelativeTimes, 60000);

  const btn = document.getElementById("send-comment");
  if (btn) btn.addEventListener("click", addComment);
});

window.addComment = addComment;