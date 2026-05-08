(function () {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "camila.dev projects",
    "url": "https://camila.portafolio.github.io/projects.html",
    "itemListElement": [
      {
        "@type": "CreativeWork",
        "position": 1,
        "name": "Perfectamente equilibrado",
        "inLanguage": "es",
        "creator": {
          "@type": "Person",
          "name": "Camila"
        }
      },
      {
        "@type": "CreativeWork",
        "position": 2,
        "name": "Perspective Lock",
        "creator": {
          "@type": "Person",
          "name": "Camila"
        }
      },
      {
        "@type": "CreativeWork",
        "position": 3,
        "name": "SCZombies",
        "creator": {
          "@type": "Person",
          "name": "Camila"
        }
      },
      {
        "@type": "CreativeWork",
        "position": 4,
        "name": "Quests Epic",
        "creator": {
          "@type": "Person",
          "name": "Camila"
        }
      },
      {
        "@type": "CreativeWork",
        "position": 5,
        "name": "Hylamity",
        "creator": {
          "@type": "Person",
          "name": "Camila"
        }
      }
    ]
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
})();
