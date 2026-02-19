const supabaseUrl = 'https://fldqudjajhuxgvmrjduq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZHF1ZGphamh1eGd2bXJqZHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTg3OTcsImV4cCI6MjA4NzA5NDc5N30.u9BKB3av9UD4hGSwh17Ty7MQ1ctKU7hRbao6pxn59R4';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_UID = "9f531012-2216-4902-8feb-98759d266c44";

async function loadComments() {

  const { data: { user } } = await supabaseClient.auth.getUser();

  const { data, error } = await supabaseClient
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("comments-list");
  if (!container) return;

  container.innerHTML = "";

  data.forEach(comment => {

    const div = document.createElement("div");
    div.classList.add("comment-item");

    
    const strong = document.createElement("strong");
    strong.textContent = comment.name;

  
    const span = document.createElement("span");
    span.textContent = new Date(comment.created_at).toLocaleString();

   
    const p = document.createElement("p");
    p.textContent = comment.message;

    div.appendChild(strong);
    div.appendChild(span);
    div.appendChild(p);

  
    if (user && user.id === ADMIN_UID) {

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Borrar";
      deleteBtn.classList.add("delete-btn");

      deleteBtn.addEventListener("click", async () => {

        const confirmDelete = confirm("¿Seguro que querés borrar este comentario?");
        if (!confirmDelete) return;

        const { error } = await supabaseClient
          .from("comments")
          .delete()
          .eq("id", comment.id);

        if (error) {
          alert("No tenés permiso para borrar");
          return;
        }

        loadComments();
      });

      div.appendChild(deleteBtn);
    }

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

  if (message.length > 500) {
    alert("El comentario es demasiado largo (máx 500 caracteres)");
    return;
  }

  const { error } = await supabaseClient
    .from('comments')
    .insert([{ name, message }]);

  if (error) {
    console.error(error);
    alert("Error enviando comentario");
    return;
  }

  nameInput.value = "";
  messageInput.value = "";

  loadComments();
}

document.addEventListener("DOMContentLoaded", () => {

  loadComments();

  const btn = document.getElementById("send-comment");
  if (btn) btn.addEventListener("click", addComment);

});

window.addComment = addComment;
