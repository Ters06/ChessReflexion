// Ce script est le cœur de l'UI. Il gère les composants réutilisables comme le footer et les modales.

// --- MODAL & UI FUNCTIONS (GLOBAL) ---
function createModal(id, title, color, content, isResourceModal = false) {
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;

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
  // 1. Inject Footer
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

  // 2. Create ALL modals for the entire application

  // New Game Modal (for dashboard)
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

  // ... (All other modal creations are identical to the previous full version)
  // Export Modal, Dojo Modals (Step 1, 2, 3), Resources Modal
  createModal("modal-export", "Exporter la Partie", "text-cyan-400", `...`);
  createModal(
    "modal-step1",
    "ÉTAPE 1 : Le Radar Tactique",
    "text-red-400",
    `...`
  );
  createModal(
    "modal-step2",
    "ÉTAPE 2 : L'Évaluation Stratégique",
    "text-amber-400",
    `...`
  );
  createModal(
    "modal-step3",
    "ÉTAPE 3 : La Synthèse et l'Action",
    "text-green-400",
    `...`
  );
  const resourcesContent = `...`; // Placeholder for brevity
  createModal(
    "modal-resources",
    "Bibliothèque de Ressources",
    "text-cyan-400",
    resourcesContent,
    true
  );

  // 3. Attach event listeners for elements that are now guaranteed to exist

  // This listener is for the "Start Game" button inside the modal we just created
  const startGameBtn = document.getElementById("start-game-btn");
  if (startGameBtn) {
    startGameBtn.addEventListener("click", async () => {
      const selectedColor = document.querySelector(
        'input[name="player-color"]:checked'
      ).value;
      try {
        const token = localStorage.getItem("jwt_token");
        const response = await fetch("/.netlify/functions/create-game", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ played_as: selectedColor }),
        });
        if (!response.ok) throw new Error("La création de la partie a échoué.");
        const newGame = await response.json();
        window.location.href = `/review.html?id=${newGame.id}`;
      } catch (error) {
        console.error("Erreur:", error);
        alert("Impossible de créer une nouvelle partie. Veuillez réessayer.");
      }
    });
  }

  // This handles the Escape key globally for all modals
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const openModalEl = document.querySelector(
        ".fixed.inset-0:not(.modal-hidden)"
      );
      if (openModalEl) {
        closeModal(openModalEl.id);
      }
    }
  });

  setupTabs();
});
