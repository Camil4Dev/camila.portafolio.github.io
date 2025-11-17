const translations = {
  es: {

    index: {
      title: "camila.dev",
      h1: "camila",
      subtitle: "Developer • Minecraft Plugins & Mods • ScreamingLAB",
      aboutTitle: "Sobre mí",
      aboutText: "Soy desarrolladora especializada en la creación de <strong>plugins para Paper</strong>, <strong>mods Fabric</strong> y sistemas avanzados para servidores. Trabajo con Mixin, GeckoLib, entidades personalizadas, packets, mundos dinámicos y mecánicas complejas para minijuegos. <br><br> Actualmente desarrollo en <strong>ScreamingLAB</strong> y colaboro en proyectos privados.",
      contactTitle: "Contacto",
      contactText: "¿Necesitás un plugin, mod o sistema personalizado? Podés escribirme a:",
      footer: "© 2025 camila — Minecraft Developer 🎶",
      projectsButton: "Proyectos",
      skillsButton: "Habilidades",
      langButton: "🇺🇸"
    },

    projects: {
      title: "Proyectos - camila.dev",
      h1: "camila",
      subtitle: "Developer • Minecraft Plugins & Mods • ScreamingLAB",
      projectsTitle: "Proyectos destacados",
      project1Title: "Perfectamente equilibrado (Paper 1.21.1)",
      project1Desc: "Minijuego donde tenes que equilibrar el libro en tu cabeza para conseguir puntos, minijuego creado para el Geo ware Oddysey.",
      project2Title: "Fork de UniverseJobs(Paper 1.21.8)",
      project2Desc: "ReCodeo del plugin de trabajos de Masivo SMP compatible con Folia.",
      project3Title: "Fork de nocape (Fabric 1.20.4)",
      project3Desc: "Mod para desactivar todas las capas del juego desde el Cliente.",
      project4Title: "Port de Sniffers Delight (Fabric 1.20.1)",
      project4Desc: "mod de comidas sobre el sniffer.",
      project5Title: "Perspective Lock (Fabric 1.20.4-1.21.1)",
      project5Desc: "Mod de cliente que recibe packets de un plugin para cambiar de perspectivas y bloquear la camara del jugador en cualquier posicion.",
      backButton: "← Volver al Inicio",
      footer: "© 2025 camila — Minecraft Developer 🎶",
      langButton: "🇺🇸"
    },

    skills: {
      title: "Habilidades - camila.dev",
      h1: "camila",
      subtitle: "Developer • Minecraft Plugins & Mods • ScreamingLAB",

      skillsTitle: "Habilidades",
      skillsSubtitle: "Tecnologías que utilizo diariamente",

      devSkillsTitle: "Desarrollo",
      toolsTitle: "Herramientas & Tecnologías",

      backHome: "← Inicio",
      footer: "© 2025 camila — Minecraft Developer 🎶",
      langButton: "🇺🇸"
    }
  },

  en: {

    index: {
      title: "camila.dev",
      h1: "camila",
      subtitle: "Developer • Minecraft Plugins & Mods • ScreamingLAB",
      aboutTitle: "About Me",
      aboutText: "I am a developer specialized in creating <strong>Paper plugins</strong>, <strong>Fabric mods</strong>, and advanced server systems. I work with Mixin, GeckoLib, custom entities, packets, dynamic worlds, and complex minigame mechanics. <br><br> Currently developing at <strong>ScreamingLAB</strong> and collaborating on private projects.",
      contactTitle: "Contact",
      contactText: "Need a custom plugin, mod, or system? You can write to me at:",
      footer: "© 2025 camila — Minecraft Developer 🎶",
      projectsButton: "Projects",
      skillsButton: "Skills",
      langButton: "🇪🇸"
    },

    projects: {
      title: "Projects - camila.dev",
      h1: "camila",
      subtitle: "Developer • Minecraft Plugins & Mods • ScreamingLAB",
      projectsTitle: "Featured Projects",
      project1Title: "Perfectly Balanced (Paper 1.21.1)",
      project1Desc: "Minigame where you have to balance the book on your head to score points, minigame created for Geo Ware Odyssey.",
      project2Title: "UniverseJobs Fork (Paper 1.21.8)",
      project2Desc: "Recode of the Masivo SMP jobs plugin compatible with Folia.",
      project3Title: "nocape Fork (Fabric 1.20.4)",
      project3Desc: "Mod to disable all game layers from the Client.",
      project4Title: "Sniffers Delight Port (Fabric 1.20.1)",
      project4Desc: "Food-related mod about the sniffer.",
      project5Title: "Perspective Lock (Fabric 1.20.4-1.21.1)",
      project5Desc: "Client mod that receives packets from a plugin to change perspectives and lock the player's camera in any position.",
      backButton: "← Back to Home",
      footer: "© 2025 camila — Minecraft Developer 🎶",
      langButton: "🇪🇸"
    },

    skills: {
      title: "Skills - camila.dev",
      h1: "camila",
      subtitle: "Developer • Minecraft Plugins & Mods • ScreamingLAB",

      skillsTitle: "Skills",
      skillsSubtitle: "Technologies I use daily",

      devSkillsTitle: "Development",
      toolsTitle: "Tools & Technologies",

      backHome: "← Home",
      footer: "© 2025 camila — Minecraft Developer 🎶",
      langButton: "🇪🇸"
    }
  }
};


let storedLang = localStorage.getItem('lang');

if (storedLang) {
  currentLang = storedLang;
} else {
  const browserLang = navigator.language || navigator.userLanguage;
  currentLang = browserLang.startsWith('es') ? 'es' : 'en';
  localStorage.setItem('lang', currentLang);
}





function changeLanguage() {
  const path = window.location.pathname;

  let pageKey = "index";
  if (path.includes("projects")) pageKey = "projects";
  if (path.includes("skills")) pageKey = "skills";

  const trans = translations[currentLang][pageKey];


  document.title = trans.title;

  document.querySelector("h1").textContent = trans.h1;
  document.querySelector("header p").textContent = trans.subtitle;
  document.querySelector("footer p").textContent = trans.footer;

  document.getElementById("lang-toggle").innerHTML = trans.langButton;



  if (pageKey === "index") {
    document.querySelector(".about h2").textContent = trans.aboutTitle;
    document.querySelector(".about p").innerHTML = trans.aboutText;

    document.querySelector(".contact h2").textContent = trans.contactTitle;
    document.querySelector(".contact p").textContent = trans.contactText;

    document.querySelector('.nav-button[href="projects.html"]').innerHTML =
      `<i class="fas fa-folder-open"></i> ${trans.projectsButton}`;

    document.querySelector('.nav-button[href="skills.html"]').innerHTML =
      `<i class="fas fa-code"></i> ${trans.skillsButton}`;
  }



  if (pageKey === "projects") {
    document.querySelector(".projects h2").textContent = trans.projectsTitle;

    const projectCards = document.querySelectorAll(".project-card");

    projectCards[0].querySelector("h3").textContent = trans.project1Title;
    projectCards[0].querySelector("p").textContent = trans.project1Desc;

    projectCards[1].querySelector("h3").textContent = trans.project2Title;
    projectCards[1].querySelector("p").textContent = trans.project2Desc;

    projectCards[2].querySelector("h3").textContent = trans.project3Title;
    projectCards[2].querySelector("p").textContent = trans.project3Desc;

    projectCards[3].querySelector("h3").textContent = trans.project4Title;
    projectCards[3].querySelector("p").textContent = trans.project4Desc;

    projectCards[4].querySelector("h3").textContent = trans.project5Title;
    projectCards[4].querySelector("p").textContent = trans.project5Desc;

    document.querySelector('.nav-button[href="index.html"]').innerHTML =
      trans.backButton;
  }



  if (pageKey === "skills") {
  // Títulos principales
  document.querySelector('[data-lang="skills-title"]').textContent = trans.skillsTitle;
  document.querySelector('[data-lang="skills-subtitle"]').textContent = trans.skillsSubtitle;

  // Subtítulos de secciones
  document.querySelector('[data-lang="dev-skills-title"]').textContent = trans.devSkillsTitle;
  document.querySelector('[data-lang="tools-title"]').textContent = trans.toolsTitle;

  // Botón volver
  const backBtn = document.querySelector('.nav-button[href="index.html"]');
  if (backBtn) backBtn.innerHTML = trans.backHome;
}
}




document.getElementById("lang-toggle").addEventListener("click", () => {
  currentLang = currentLang === "es" ? "en" : "es";
  localStorage.setItem("lang", currentLang);
  changeLanguage();
});



changeLanguage();