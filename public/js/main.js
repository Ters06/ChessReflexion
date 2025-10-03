// Ce script est le cœur de l'UI. Il gère les composants réutilisables.
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

  // Resources Modal
  const resourcesContent = `<div class="sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10"><h3 class="text-2xl font-bold text-cyan-400 p-8 pb-0">Bibliothèque de Ressources</h3><div class="px-8 border-b border-slate-700 text-sm font-medium text-slate-400"><div class="flex -mb-px"><button data-target="panel-tactics" class="tab-button active">Tactique</button><button data-target="panel-strategy" class="tab-button">Stratégie</button><button data-target="panel-endgames" class="tab-button">Finales</button><button data-target="panel-openings" class="tab-button">Ouvertures</button><button data-target="panel-youtube" class="tab-button">YouTube</button></div></div></div><div class="p-8"><div id="panel-tactics" class="tab-panel active"><ul class="space-y-4"><li><a href="https://lichess.org/training" target="_blank" class="font-semibold hover:text-cyan-400">Lichess Puzzles</a><p class="text-sm text-slate-400">Le meilleur pour un entraînement quotidien, gratuit et illimité.</p></li></ul></div><div id="panel-strategy" class="tab-panel">...</div><div id="panel-endgames" class="tab-panel">...</div><div id="panel-openings" class="tab-panel">...</div><div id="panel-youtube" class="tab-panel">...</div></div>`;
  createModal(
    "modal-resources",
    "Bibliothèque de Ressources",
    "text-cyan-400",
    resourcesContent,
    true
  );

  console.log("main.js: Toutes les modales ont été créées.");

  // 3. Attach global event listeners
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
  const userData = JSON.parse(localStorage.getItem("userData"));
  const userInfoHeader = document.getElementById("user-info-header");
  const loginLinkHeader = document.getElementById("login-link-header");
  const userNameHeader = document.getElementById("user-name-header");

  if (userData && userInfoHeader && loginLinkHeader && userNameHeader) {
    userNameHeader.textContent = userData.name;
    userInfoHeader.style.display = "flex";
    loginLinkHeader.style.display = "none";
  } else if (userInfoHeader && loginLinkHeader) {
    userInfoHeader.style.display = "none";
    loginLinkHeader.style.display = "flex";
  }
}
