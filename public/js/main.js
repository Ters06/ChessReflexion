// Ce script est le cœur de l'UI. Il gère les composants réutilisables comme le footer et les modales.
console.log("main.js: Script chargé.");

// --- MODAL & UI FUNCTIONS (GLOBAL) ---
function createModal(id, title, color, content, isResourceModal = false) {
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) {
    console.error("L'élément 'modal-container' est introuvable dans le DOM.");
    return;
  }

  const modalHTML = `
        <div id="${id}" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-hidden">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm modal-overlay" onclick="closeModal('${id}')"></div>
            <div class="bg-slate-800 rounded-xl ${
              isResourceModal ? "p-0" : "p-8"
            } border border-slate-700 shadow-2xl w-full max-w-2xl relative modal-content">
                ${
                  isResourceModal
                    ? ""
                    : `<h3 class="text-2xl font-bold ${color} mb-6">${title}</h3>`
                }
                ${content}
                <button onclick="closeModal('${id}')" class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-3xl font-bold z-20">&times;</button>
            </div>
        </div>
    `;
  modalContainer.insertAdjacentHTML("beforeend", modalHTML);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("modal-hidden");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("modal-hidden");
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const targetPanelId = button.getAttribute("data-target");
      tabPanels.forEach((panel) => {
        panel.id === targetPanelId
          ? panel.classList.add("active")
          : panel.classList.remove("active");
      });
    });
  });
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("main.js: DOMContentLoaded - Démarrage de l'initialisation.");

  // 1. Inject Header and Footer
  const headerContainer = document.getElementById("header-container");
  if (headerContainer) {
    fetch("/components/header.html")
      .then((response) =>
        response.ok ? response.text() : Promise.reject("Header not found")
      )
      .then((data) => {
        headerContainer.innerHTML = data;
        // Once the header is loaded, update its state
        updateHeaderState();
      })
      .catch((error) => console.error("Error loading header:", error));
  }

  const footerContainer = document.getElementById("footer-container");
  if (footerContainer) {
    fetch("/components/footer.html")
      .then((response) =>
        response.ok ? response.text() : Promise.reject("Footer not found")
      )
      .then((data) => {
        footerContainer.innerHTML = data;
      })
      .catch((error) => console.error("Error loading footer:", error));
  }

  // 2. Create ALL modals
  console.log("main.js: Création des modales...");

  // New Game Modal
  createModal(
    "modal-new-game",
    "Nouvelle Partie",
    "text-violet-400",
    `
        <p class="text-slate-300 mb-6">Choisissez la couleur que vous jouez dans cette partie.</p>
        <div class="flex justify-center gap-8 mb-8">
            <label class="flex flex-col items-center gap-2 cursor-pointer p-4 border-2 border-transparent rounded-lg has-[:checked]:border-violet-500">
                <input type="radio" name="player-color" value="w" class="sr-only" checked>
                <div class="text-6xl">♔</div><span class="font-semibold text-slate-200">Blancs</span>
            </label>
            <label class="flex flex-col items-center gap-2 cursor-pointer p-4 border-2 border-transparent rounded-lg has-[:checked]:border-violet-500">
                <input type="radio" name="player-color" value="b" class="sr-only">
                <div class="text-6xl">♚</div><span class="font-semibold text-slate-200">Noirs</span>
            </label>
        </div>
        <button id="start-game-btn" class="w-full bg-violet-500 text-white font-bold py-3 rounded-lg hover:bg-violet-600 transition">Créer la partie</button>
    `
  );

  // Export Modal
  createModal(
    "modal-export",
    "Exporter la Partie",
    "text-cyan-400",
    `
        <div class="mb-6"><label class="font-semibold text-slate-300">PGN (Partie Complète)</label><textarea id="export-pgn" readonly class="w-full h-32 mt-2 bg-slate-900/50 border border-slate-600 rounded-lg p-2 font-mono text-sm"></textarea></div>
        <div><label class="font-semibold text-slate-300">FEN (Position Actuelle)</label><input id="export-fen" readonly type="text" class="w-full mt-2 bg-slate-900/50 border border-slate-600 rounded-lg p-2 font-mono text-sm"></div>
    `
  );

  // Dojo Modals
  createModal(
    "modal-step1",
    "ÉTAPE 1 : Le Radar Tactique",
    "text-red-400",
    `<p class="text-slate-400 mb-1 text-sm">Limite de 255 caractères.</p><textarea id="reflection-step1" placeholder="Quelles sont les menaces de l'adversaire ? Quels sont les coups forcés ?" maxlength="255" class="w-full h-32 bg-slate-700/50 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"></textarea><div class="flex justify-end mt-4"><button id="goto-step2" class="bg-amber-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-amber-600 transition">Suivant &rarr;</button></div>`
  );
  createModal(
    "modal-step2",
    "ÉTAPE 2 : L'Évaluation Stratégique",
    "text-amber-400",
    `<div class="mb-4 bg-slate-700/30 p-3 rounded-lg border border-slate-600"><p class="font-bold text-red-300 text-sm">Résumé Étape 1 (Radar):</p><p id="summary-step1" class="text-slate-400 text-sm whitespace-pre-wrap"></p></div><p class="text-slate-400 mb-1 text-sm">Limite de 255 caractères.</p><textarea id="reflection-step2" placeholder="Structure de pions ? Sécurité des rois ? Quelle est ma pire pièce ?" maxlength="255" class="w-full h-32 bg-slate-700/50 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea><div class="flex justify-between mt-4"><button id="back-to-step1" class="bg-slate-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-slate-700 transition">&larr; Précédent</button><button id="goto-step3" class="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition">Suivant &rarr;</button></div>`
  );
  createModal(
    "modal-step3",
    "ÉTAPE 3 : La Synthèse et l'Action",
    "text-green-400",
    `<div class="mb-4 bg-slate-700/30 p-3 rounded-lg border border-slate-600"><p class="font-bold text-red-300 text-sm">Résumé Étape 1 (Radar):</p><p id="summary-step2-1" class="text-slate-400 text-sm whitespace-pre-wrap"></p><p class="font-bold text-amber-300 text-sm mt-2">Résumé Étape 2 (Stratégie):</p><p id="summary-step2-2" class="text-slate-400 text-sm whitespace-pre-wrap"></p></div><p class="text-slate-400 mb-1 text-sm">Limite de 255 caractères.</p><textarea id="reflection-step3" placeholder="Mon objectif, mes 3 coups candidats, et la vérification anti-gaffe." maxlength="255" class="w-full h-32 bg-slate-700/50 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea><div class="flex justify-between mt-4"><button id="back-to-step2" class="bg-slate-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-slate-700 transition">&larr; Précédent</button><button id="save-reflection" class="bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-600 transition">Sauvegarder l'Analyse</button></div>`
  );

  // Resources Modal
  const resourcesContent = `<div class="sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10"><h3 class="text-2xl font-bold text-cyan-400 p-8 pb-0">Bibliothèque de Ressources</h3><div class="px-8 border-b border-slate-700 text-sm font-medium text-slate-400"><div class="flex -mb-px"><button data-target="panel-tactics" class="tab-button active">Tactique</button><button data-target="panel-strategy" class="tab-button">Stratégie</button><button data-target="panel-endgames" class="tab-button">Finales</button><button data-target="panel-openings" class="tab-button">Ouvertures</button><button data-target="panel-youtube" class="tab-button">YouTube</button></div></div></div><div class="p-8"><div id="panel-tactics" class="tab-panel active"><ul class="space-y-4"><li><a href="https://lichess.org/training" target="_blank" class="font-semibold hover:text-cyan-400">Lichess Puzzles</a><p class="text-sm text-slate-400">Le meilleur pour un entraînement quotidien, gratuit et illimité.</p></li><li><a href="https://www.chesstempo.com" target="_blank" class="font-semibold hover:text-cyan-400">Chess Tempo</a><p class="text-sm text-slate-400">Idéal pour un entraînement ciblé sur des thèmes spécifiques.</p></li></ul></div><div id="panel-strategy" class="tab-panel"><ul class="space-y-4"><li><strong class="text-slate-200">Livre : "Comment Mûrir son Style" - J. Silman</strong><p class="text-sm text-slate-400">La bible pour comprendre les déséquilibres et le jeu positionnel.</p></li></ul></div><div id="panel-endgames" class="tab-panel"><ul class="space-y-4"><li><a href="https://lichess.org/practice" target="_blank" class="font-semibold hover:text-cyan-400">Pratique des Finales Lichess</a><p class="text-sm text-slate-400">Le meilleur moyen d'apprendre par la pratique interactive.</p></li></ul></div><div id="panel-openings" class="tab-panel"><ul class="space-y-4"><li><a href="https://www.chessable.com" target="_blank" class="font-semibold hover:text-cyan-400">Chessable</a><p class="text-sm text-slate-400">La meilleure plateforme pour apprendre un répertoire via la répétition espacée.</p></li></ul></div><div id="panel-youtube" class="tab-panel"><ul class="space-y-4"><li><a href="https://www.youtube.com/@Blitzstream" target="_blank" class="font-semibold hover:text-cyan-400">Blitzstream (FR)</a><p class="text-sm text-slate-400">La référence francophone par Kévin Bordi.</p></li><li><a href="https://www.youtube.com/@DanielNaroditsky" target="_blank" class="font-semibold hover:text-cyan-400">Daniel Naroditsky (EN)</a><p class="text-sm text-slate-400">Probablement le meilleur contenu pédagogique gratuit sur YouTube.</p></li></ul></div></div>`;
  createModal(
    "modal-resources",
    "Bibliothèque de Ressources",
    "text-cyan-400",
    resourcesContent,
    true
  );

  console.log("main.js: Toutes les modales ont été créées.");

  // 3. Attach event listeners
  // This part is now handled by page-specific scripts (like dashboard.js)
  // to ensure elements exist before attaching listeners.

  // Global Escape key handler
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const openModalEl = document.querySelector(
        ".fixed.inset-0:not(.modal-hidden)"
      );
      if (openModalEl) closeModal(openModalEl.id);
    }
  });

  setupTabs();
  console.log("main.js: Initialisation terminée.");
});

function updateHeaderState() {
  const token = localStorage.getItem("jwt_token");
  const userData = JSON.parse(localStorage.getItem("userData"));
  const userInfoHeader = document.getElementById("user-info-header");
  const loginLinkHeader = document.getElementById("login-link-header");
  const userNameHeader = document.getElementById("user-name-header");

  if (
    token &&
    userData &&
    userInfoHeader &&
    loginLinkHeader &&
    userNameHeader
  ) {
    userNameHeader.textContent = userData.name;
    userInfoHeader.style.display = "flex";
    loginLinkHeader.style.display = "none";
  } else if (userInfoHeader && loginLinkHeader) {
    userInfoHeader.style.display = "none";
    loginLinkHeader.style.display = "flex";
  }
}
