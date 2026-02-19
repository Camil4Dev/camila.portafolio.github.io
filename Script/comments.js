const supabaseUrl = 'https://fldqudjajhuxgvmrjduq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZHF1ZGphamh1eGd2bXJqZHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTg3OTcsImV4cCI6MjA4NzA5NDc5N30.u9BKB3av9UD4hGSwh17Ty7MQ1ctKU7hRbao6pxn59R4';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_UID = "9f531012-2216-4902-8feb-98759d266c44";

const MAX_LENGTH = 500;
const COMMENT_COOLDOWN = 10000; 

let lastCommentTime = 0;

const bannedNames = [
  "hitler",
  "nazi",
  "stalin",
  "terrorista",
  "admin",
  "moderador",
  "ku klux klan",
  "pedofilo",
  "violador",
  "asesino",
  "dictador",
  "racista",
  "homofobo",
  "transfobo",
  "islamofobo",
  "antisemita",
  "xenofobo",
  "machista",
  "misogino",
  "fascista",
  "comunista",
  "anarquista",
  "extremista",
  "fanatico",
  "radical",
  "terrorismo",
  "genocida",
  "dictadura",
  "totalitario",
  "opresor",
  "censurador",
  "troll",
  "spam",
  "bot",
  "fake",
  "scam",
  "fraude",
  "estafa",
  "phishing",
  "malware",
  "virus",
  "ransomware",
  "spyware",
  "adware",
  "keylogger",
  "rootkit",
  "backdoor",
  "exploit",
  "vulnerabilidad",
  "brecha",
  "hack",
  "crack",
  "pirata",
  "ladrón",
  "estafador",
  "troll",
  "bully",
  "hater",
  "flamer",
  "griefer",
  "cyberbully",
  "doxxer",
  "stalker",
  "harasser",
  "abuser",
  "predator",
  "groomer",
  "Jeffrey Epstein",
  "R. Kelly",
  "Larry Nassar",
  "Harvey Weinstein",
  "Bill Cosby",
  "Woody Allen",
  "Roman Polanski",
  "Kevin Spacey",
  "Michael Jackson",
  "Bill Clinton",
  "Donald Trump",
  "Vladimir Putin",
  "Kim Jong-un",
  "Bashar al-Assad",
  "Muammar Gaddafi",
  "Saddam Hussein",
  "Osama bin Laden",
  "Abu Bakr al-Baghdadi",
  "Ayman al-Zawahiri",
  "Joseph Stalin",
  "Adolf  Hitler",
  "Benito Mussolini",
  "Pol Pot",
  "Mao Zedong",
  "Fidel Castro",
  "Che Guevara",
  "Pablo Escobar",
  "El Chapo",
  "Al Capone",
  "John Gotti",
  "Whitey Bulger",
  "Charles Manson",
  "Ted Bundy",
  "Jeffrey Dahmer",
  "Richard Ramirez",
  "David Berkowitz",
  "Edmund Kemper",
  "Gary Ridgway",
  "Dennis Rader",
  "Andrei Chikatilo",
  "Issei Sagawa",
  "Jack Unterweger",
  "Robert Pickton",
  "Alexander Skrynnik",
  "Mikhail Popkov",
  "Luis Garavito",
  "Pedro Alonso Lopez",
  "Harold Shipman",
  "R. Kelly",
  "Jeffrey Epstein",
  "Larry Nassar",
  "Harvey Weinstein",
  "Bill Cosby",
  "Woody Allen",
  "Roman Polanski",
  "Kevin Spacey",
  "Michael Jackson",
  "Bill Clinton",
  "Donald Trump",
  "Vladimir Putin",
  "Kim Jong-un",
  "Benjamin Netanyahu",
  "Bashar al-Assad",
  "Muammar Gaddafi",
  "Saddam Hussein",
  "Osama bin Laden",
  "Abu Bakr al-Baghdadi",
  "Ayman al-Zawahiri",
  "Joseph Stalin",
  "mi cuenta de banco",
  "mis bolas",
  "chocando contra tu culo",
  "veni a mi isla y hablamos",
  "negro sucio",
  "hotea",
  "acabe todita",
  "desnudito",
  "peludito"
];

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/0/g, "o")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9]/g, "");
}

function isBannedName(name) {
  const normalized = normalizeText(name);
  return bannedNames.some(word => normalized.includes(word));
}

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


  if (message.length > MAX_LENGTH) {
    alert("Máximo 500 caracteres");
    return;
  }


  if (isBannedName(name)) {
    alert("Ese nombre no está permitido");
    return;
  }


  const now = Date.now();
  if (now - lastCommentTime < COMMENT_COOLDOWN) {
    alert("Esperá 10 segundos antes de comentar otra vez");
    return;
  }

  
  const { data: recentComments } = await supabaseClient
    .from("comments")
    .select("message")
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentComments?.some(c => c.message === message)) {
    alert("Comentario repetido detectado");
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
