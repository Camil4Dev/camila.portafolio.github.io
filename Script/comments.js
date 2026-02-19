const supabaseUrl = "https://fldqudjajhuxgvmrjduq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZHF1ZGphamh1eGd2bXJqZHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTg3OTcsImV4cCI6MjA4NzA5NDc5N30.u9BKB3av9UD4hGSwh17Ty7MQ1ctKU7hRbao6pxn59R4";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const MAX_LENGTH = 500;
const COMMENT_COOLDOWN = 10000;

let lastCommentTime = 0;


async function loadComments() {

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


    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Borrar";
    deleteBtn.classList.add("delete-btn");

    deleteBtn.addEventListener("click", async () => {
      if (!confirm("¿Seguro que querés borrar este comentario?")) return;

      const { data, error } = await supabaseClient.functions.invoke(
        "delete-comment",
        {
          body: { id: comment.id }
        }
      );

      if (error || data?.error) {
        alert("No autorizado");
        return;
      }

      div.remove();
    });

    div.appendChild(deleteBtn);
    container.appendChild(div);

  });
}


async function addComment() {
  const nameInput = document.getElementById("comment-name");
  const messageInput = document.getElementById("comment-message");

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

  loadComments();
}


document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.getElementById("comment-message");

  if (messageInput) {
    messageInput.addEventListener("input", () => {
      if (messageInput.value.length > MAX_LENGTH) {
        messageInput.value = messageInput.value.slice(0, MAX_LENGTH);
      }
    });
  }

  loadComments();

  const btn = document.getElementById("send-comment");
  if (btn) btn.addEventListener("click", addComment);
});

window.addComment = addComment;