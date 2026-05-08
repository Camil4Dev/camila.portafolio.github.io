(function () {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Camila",
    "url": "https://camila.portafolio.github.io/profile.html",
    "jobTitle": "Minecraft Developer",
    "knowsAbout": ["Paper", "Fabric", "Hytale", "Java", "Minecraft"],
    "sameAs": [
      "https://twitter.com/CamilaDev_",
      "https://instagram.com/camila.cami.camiladev",
      "https://github.com/Camil4Dev"
    ]
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
})();
