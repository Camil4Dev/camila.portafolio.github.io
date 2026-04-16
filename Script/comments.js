const supabaseConfig = window.SupabaseConfig || {};
const supabaseUrl = supabaseConfig.url || "https://fldqudjajhuxgvmrjduq.supabase.co";
const supabaseKey = supabaseConfig.key || "sb_publishable_ucvN_ohgRXwKvK-GPs96jw_CObwLo9D";
const supabaseClient = window.supabase
  ? window.supabase.createClient(supabaseUrl, supabaseKey)
  : null;
let supabaseEnabled = true;
let supabaseNotified = false;

const ADMIN_UID = "9f531012-2216-4902-8feb-98759d266c44";

const MAX_LENGTH = 500;
const COMMENT_COOLDOWN = 10000;
const DRAFT_KEY = "comment_draft";

let lastCommentTime = 0;
const CREATOR_EMOJI = "📺";
const CommentsShared = window.CommentsShared || {};

const getLang = () => {
  if (typeof CommentsShared.getLang === "function") return CommentsShared.getLang();
  if (typeof currentLang !== "undefined") return currentLang;
  if (typeof window.currentLang !== "undefined") return window.currentLang;
  return "es";
};

const getProfileText = (key, fallback) => {
  if (typeof CommentsShared.getProfileText === "function") {
    return CommentsShared.getProfileText(key, fallback);
  }
  return fallback;
};

const getInitials = (name) => {
  if (typeof CommentsShared.getInitials === "function") {
    return CommentsShared.getInitials(name, CREATOR_EMOJI);
  }
  return "?";
};

const formatRelativeTime = (date) => {
  if (typeof CommentsShared.formatRelativeTime === "function") {
    return CommentsShared.formatRelativeTime(date);
  }
  return "";
};

const looksLikeSpam = (name, message) => {
  if (typeof CommentsShared.looksLikeSpam === "function") {
    return CommentsShared.looksLikeSpam(name, message);
  }
  return false;
};

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

function notifySupabase(messageKey, fallback) {
  if (supabaseNotified) return;
  showToast(getProfileText(messageKey, fallback), "error");
  supabaseNotified = true;
}

function handleSupabaseError(error) {
  const message = (error && error.message) ? error.message : String(error || "");
  if (message.includes("ERR_NAME_NOT_RESOLVED") || message.includes("Failed to fetch")) {
    notifySupabase("supabaseNetwork", "No se pudo conectar a Supabase. Revisa tu conexion o DNS.");
    supabaseEnabled = false;
    return;
  }
  notifySupabase("supabaseError", "Error al conectar con Supabase.");
}

function ensureSupabase() {
  if (!supabaseEnabled) return false;
  if (!supabaseClient) {
    notifySupabase("supabaseMissing", "Supabase no esta disponible.");
    supabaseEnabled = false;
    return false;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    notifySupabase("supabaseOffline", "Sin conexion. Reintenta cuando vuelvas a estar online.");
    return false;
  }
  return true;
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
  if (!ensureSupabase()) return;

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const isAdmin = user && user.id === ADMIN_UID;

    const { data, error } = await supabaseClient
      .from("comments")
      .select("*")
      .order("created_at", { ascending: sortMode === "oldest" });

    if (error) {
      console.error(error);
      handleSupabaseError(error);
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
  } catch (error) {
    console.error(error);
    handleSupabaseError(error);
  }
}


async function addComment() {
  if (!ensureSupabase()) return;
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
  if (!ensureSupabase()) return;
  const { data: { user } } = await supabaseClient.auth.getUser();

  const adminBtn = document.getElementById("admin-toggle");
  const badge = document.getElementById("admin-badge");

  if (!adminBtn) return;

  if (badge) {
    badge.style.display = "inline-flex";
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

  }
}

document.getElementById("admin-login-btn").addEventListener("click", async () => {
  if (!ensureSupabase()) return;
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

  const EMOJI_DATA_URLS = [
    "data/emoji-mart-data.json",
    "https://cdn.jsdelivr.net/npm/emoji-mart-data@latest/emoji-mart-data.json",
    "https://cdn.jsdelivr.net/npm/emoji-mart-data@1.0.0/emoji-mart-data.json"
  ];
  const DEFAULT_EMOJI_GROUPS = {
    faces: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😜","😝","😛","🫠","🫶","🤗","🤭","🫢","🤫","🤔","😐","😑","😶","🙄","😬","😮","😲","😳","🥳","😎","🤓","🥸","😴","🤤","😪","😵","😵‍💫","🤯","🥺","😏","😒","😅","😡","🤬","😭","😢","🥲","🫣","🤡"],
    gestures: ["👍","👎","👏","🙌","🤝","✌️","🤘","🫡","💪","🙏","👌","👀","👋","🤙","🖐️","✋","🤟","☝️","👇","👉","👈","🫰","👐","🤲","🫶","🙅","🙆","🙋","🤷","🤦","✍️","🤞","🫶","🤜","🤛","🧎","🧍","🧘"],
    hearts: ["❤️","🧡","💛","💚","💙","💜","🩷","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💖","💗","💓","💞","💕","💝","💘","💟","💌","💐","🫶","💍"],
    food: ["🍕","🍔","🍟","🌭","🍿","🥓","🥞","🧇","🍳","🍣","🍜","🍱","🍛","🍙","🍤","🥗","🥪","🍩","🍪","🎂","🍰","🧁","🍫","🍬","🍭","🧋","☕","🧃","🥤","🧊","🍓","🍌","🍎","🍇","🍒","🍉","🍪","🍕"],
    objects: ["🎮","🕹️","🧱","⛏️","🧪","🧠","⚙️","💻","🛠️","📌","📎","📷","🎧","🎵","🎤","🚀","🔥","✨","🧲","🔮","💡","🧩","🪄","📦","📡","🔧","🧰","🔬","🧪","📱","🧯"],
    nature: ["🌿","🌱","🌸","🌙","⭐","☀️","⚡","🌊","🍀","🪐","🌌","🌈","🌧️","❄️","🔥","🌋","🪨","🌵","🦋","🐝","🐢","🐬","🦊","🐺","🐱","🐶","🦜","🌻"],
    symbols: ["✅","☑️","✔️","❌","⚠️","❗","❓","💯","🔔","🔕","🔒","🔓","💬","🗯️","💭","🎯","📌","🔹","🔸","🟢","🟡","🔴","⚪","⚫","➕","➖","➗","✴️","⭐","🌟"],
    recent: []
  };

  let EMOJI_GROUPS = { ...DEFAULT_EMOJI_GROUPS };
  let EMOJI_INDEX = new Map();

  const buildSearch = (emoji) => {
    const parts = [emoji.id, emoji.name, ...(emoji.keywords || [])].filter(Boolean);
    return parts.join(" ").toLowerCase();
  };

  const getNative = (emoji) => emoji?.skins?.[0]?.native || emoji?.native || "";

  const indexEmoji = (native, search) => {
    if (!native) return;
    if (!EMOJI_INDEX.has(native)) EMOJI_INDEX.set(native, search || native);
  };

  const isGesture = (search, id) => {
    const hay = `${search} ${id || ""}`;
    return /(hand|finger|gesture|thumb|clap|pray|wave|fist|sign)/i.test(hay);
  };

  const isHeart = (search, id) => {
    const hay = `${search} ${id || ""}`;
    return /(heart|love|kiss|romance)/i.test(hay);
  };

  const buildEmojiGroups = (data) => {
    const categoryMap = {
      people: "faces",
      nature: "nature",
      foods: "food",
      activity: "objects",
      places: "objects",
      objects: "objects",
      symbols: "symbols",
      flags: "symbols",
      "smileys-emotion": "faces",
      "people-body": "faces",
      "animals-nature": "nature",
      "food-drink": "food",
      "travel-places": "objects",
      activities: "objects",
      objects: "objects",
      symbols: "symbols",
      flags: "symbols"
    };

    const groups = {
      faces: [],
      gestures: [],
      hearts: [],
      food: [],
      objects: [],
      nature: [],
      symbols: []
    };

    const groupSets = {
      faces: new Set(),
      gestures: new Set(),
      hearts: new Set(),
      food: new Set(),
      objects: new Set(),
      nature: new Set(),
      symbols: new Set()
    };

    const addToGroup = (group, native, search) => {
      if (!native || !groups[group]) return;
      if (groupSets[group].has(native)) return;
      groupSets[group].add(native);
      groups[group].push({ native, search });
    };

    data.categories.forEach((category) => {
      const group = categoryMap[category.id];
      if (!group) return;
      category.emojis.forEach((emojiId) => {
        const emoji = data.emojis[emojiId];
        if (!emoji) return;
        const native = getNative(emoji);
        const search = buildSearch(emoji);
        indexEmoji(native, search);
        addToGroup(group, native, search);
        if (category.id === "people" && isGesture(search, emoji.id)) addToGroup("gestures", native, search);
        if (isHeart(search, emoji.id)) addToGroup("hearts", native, search);
      });
    });

    if (!groups.gestures.length) groups.gestures = DEFAULT_EMOJI_GROUPS.gestures.map((native) => ({ native, search: native }));
    if (!groups.hearts.length) groups.hearts = DEFAULT_EMOJI_GROUPS.hearts.map((native) => ({ native, search: native }));

    return groups;
  };

  const loadEmojiData = async () => {
    let data = null;
    for (const url of EMOJI_DATA_URLS) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        data = await response.json();
        break;
      } catch (e) {
        continue;
      }
    }

    if (data) {
      EMOJI_INDEX = new Map();
      const groups = buildEmojiGroups(data);
      EMOJI_GROUPS = { ...groups, recent: EMOJI_GROUPS.recent };
      return;
    }

    EMOJI_INDEX = new Map();
    Object.values(DEFAULT_EMOJI_GROUPS)
      .flat()
      .forEach((native) => indexEmoji(native, native));
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

    const normalized = list.map((item) => {
      if (typeof item === "string") {
        const search = EMOJI_INDEX.get(item) || item;
        return { native: item, search };
      }
      return item;
    });

    let filtered = term
      ? normalized.filter((emoji) => (emoji.search || "").includes(term) || emoji.native.includes(term))
      : normalized;

    if (term) {
      const dedupe = new Map();
      filtered.forEach((emoji) => {
        if (!dedupe.has(emoji.native)) dedupe.set(emoji.native, emoji);
      });
      filtered = Array.from(dedupe.values());
    }
    const labels = getEmojiLabels();
    if (emojiTitle) emojiTitle.textContent = term ? getProfileText("emojiResults", "Resultados") : (labels[group] || "Emojis");
    if (emojiClear) emojiClear.style.visibility = (group === "recent" && !term) ? "visible" : "hidden";

    filtered.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "emoji-btn";
      btn.dataset.emoji = emoji.native;
      btn.textContent = emoji.native;
      btn.addEventListener("click", () => insertEmoji(emoji.native));
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
  const initialGroup = emojiTabs[0]?.dataset.group || "recent";
  loadEmojiData().finally(() => {
    if (emojiTabs.length) renderEmojiGrid(initialGroup);
  });

  if (window.PresenceBadge && typeof window.PresenceBadge.start === "function") {
    window.PresenceBadge.start({ badgeId: "admin-badge" });
  }
  checkAdmin();
  loadComments(window.currentSort);
  updateRelativeTimes();
  setInterval(updateRelativeTimes, 60000);

  const btn = document.getElementById("send-comment");
  if (btn) btn.addEventListener("click", addComment);

  window.addEventListener("online", () => {
    supabaseEnabled = true;
    supabaseNotified = false;
    loadComments(window.currentSort);
  });
});

window.addComment = addComment;