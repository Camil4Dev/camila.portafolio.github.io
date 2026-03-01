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
    adminBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i><span>Logout</span>`;
    adminBtn.onclick = async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    };

    if (badge) badge.style.display = "flex";
  } else {
    adminBtn.innerHTML = `<i class="fas fa-user-shield"></i><span>Admin</span>`;
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

  if (messageInput) {
    messageInput.addEventListener("input", () => {
      if (messageInput.value.length > MAX_LENGTH) {
        messageInput.value = messageInput.value.slice(0, MAX_LENGTH);
      }
      resizeMessage();
      updateCount();
    });
  }

  resizeMessage();
  updateCount();

  checkAdmin();
  loadComments();

  const btn = document.getElementById("send-comment");
  if (btn) btn.addEventListener("click", addComment);
});

window.addComment = addComment;