const supabaseUrl = "https://fldqudjajhuxgvmrjduq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZHF1ZGphamh1eGd2bXJqZHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTg3OTcsImV4cCI6MjA4NzA5NDc5N30.u9BKB3av9UD4hGSwh17Ty7MQ1ctKU7hRbao6pxn59R4";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_UID = "9f531012-2216-4902-8feb-98759d266c44";

const MAX_LENGTH = 500;
const COMMENT_COOLDOWN = 10000;

let lastCommentTime = 0;
const CREATOR_EMOJI = "📺";


async function loadComments() {
  
  const { data: { user } } = await supabaseClient.auth.getUser();
  const isAdmin = user && user.id === ADMIN_UID;

  const { data, error } = await supabaseClient
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("comments-list");
  if (!container) return;

  container.innerHTML = "";

  data.forEach((comment, index) => {
    const div = document.createElement("div");
    div.classList.add("comment-item");
    div.style.animationDelay = `${index * 0.08}s`;

    const strong = document.createElement("strong");
    strong.textContent = comment.name;

    const span = document.createElement("span");
    span.textContent = new Date(comment.created_at).toLocaleString();

    const p = document.createElement("p");
    p.textContent = comment.message;

    const header = document.createElement("div");
    header.classList.add("comment-header");

    const separator = document.createElement("span");
    separator.textContent = "•";
    separator.classList.add("comment-separator");

    header.appendChild(strong);
    header.appendChild(separator);
    header.appendChild(span);

    div.appendChild(header);
    div.appendChild(p);

   
    if (isAdmin) {
      const creatorBtn = document.createElement("button");
      creatorBtn.classList.add("creator-btn");
      creatorBtn.textContent = comment.name.includes(CREATOR_EMOJI)
        ? "Quitar 📺"
        : "Agregar 📺";

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
          alert("No autorizado");
          return;
        }

        strong.textContent = nextName;
        creatorBtn.textContent = nextName.includes(CREATOR_EMOJI)
          ? "Quitar 📺"
          : "Agregar 📺";
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Borrar";
      deleteBtn.classList.add("delete-btn");

      deleteBtn.addEventListener("click", async () => {
        if (!confirm("¿Seguro que querés borrar este comentario?")) return;

        const { data, error } = await supabaseClient.functions.invoke(
          "delete-comment",
          { body: { id: comment.id } }
        );

        if (error || data?.error) {
          alert("No autorizado");
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

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (!name || !message) {
    alert("Completá todos los campos");
    return;
  }

  if (message.length > MAX_LENGTH) {
    alert("Máximo 500 caracteres");
    return;
  }

  const now = Date.now();
  if (now - lastCommentTime < COMMENT_COOLDOWN) {
    alert("Esperá 10 segundos antes de comentar otra vez");
    return;
  }

  const { data, error } = await supabaseClient.functions.invoke(
    "super-responder",
    { body: { name, message } }
  );

  if (error) {
  console.error("ERROR COMPLETO:", error);
  alert("Error real: " + error.message);
  return;
}

  if (data?.error) {
    alert(data.error);
    return;
  }

  lastCommentTime = now;

  nameInput.value = "";
  messageInput.value = "";
  messageInput.style.height = "";

  if (countEl) countEl.textContent = `0/${MAX_LENGTH}`;

  loadComments();
}

async function checkAdmin() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  const adminBtn = document.getElementById("admin-toggle");
  const badge = document.getElementById("admin-badge");

  if (!adminBtn) return;

  if (user && user.id === ADMIN_UID) {
    adminBtn.classList.add("logged-in");
    adminBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 12h10" />
        <path d="M15 8l4 4-4 4" />
        <path d="M5 5h7a2 2 0 012 2v2" />
        <path d="M14 15v2a2 2 0 01-2 2H5" />
      </svg>
      <span>Logout</span>
    `;
    adminBtn.onclick = async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    };

    if (badge) badge.style.display = "flex";
  } else {
    adminBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l7.5 4v5.5c0 4.5-3.4 8.7-7.5 9.5-4.1-0.8-7.5-5-7.5-9.5V7l7.5-4z" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
      <span>Admin</span>
    `;
    adminBtn.onclick = () => {
      document.getElementById("login-modal").classList.remove("hidden");
    };

    if (badge) badge.style.display = "none";
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
    alert("Credenciales incorrectas");
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

  const CATEGORY_LABELS = {
    recent: "Recientes",
    faces: "Emoticonos y personas",
    gestures: "Gestos",
    hearts: "Corazones",
    food: "Comida",
    objects: "Objetos",
    nature: "Naturaleza",
    symbols: "Símbolos"
  };

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
    if (emojiTitle) emojiTitle.textContent = term ? "Resultados" : (CATEGORY_LABELS[group] || "Emojis");
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

  loadRecentEmojis();
  if (emojiTabs.length) {
    renderEmojiGrid(emojiTabs[0].dataset.group || "recent");
  }

  checkAdmin();
  loadComments();

  const btn = document.getElementById("send-comment");
  if (btn) btn.addEventListener("click", addComment);
});

window.addComment = addComment;