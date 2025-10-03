// Ce script gère la logique de la page du tableau de bord (app.html).
// Il s'exécute après main.js.

document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "dashboard.js: DOMContentLoaded - Démarrage de l'initialisation du dashboard."
  );

  const userData = JSON.parse(localStorage.getItem("userData"));
  const gamesListContainer = document.getElementById("games-list");
  const newGameButton = document.getElementById("new-game-button");

  // On sélectionne le bouton "start-game-btn" qui a été créé par main.js
  const startGameBtn = document.getElementById("start-game-btn");

  // 1. Affiche le nom de l'utilisateur (déjà fait par app.js mais on peut le confirmer)
  if (userData) {
    const userNameElement = document.getElementById("user-name");
    if (userNameElement) {
      userNameElement.textContent = `Bonjour, ${userData.name}`;
    }
  }

  // 2. Fonction pour récupérer et afficher la liste des parties
  async function fetchAndDisplayGames() {
    if (!gamesListContainer) return;
    gamesListContainer.innerHTML = `<p class="text-slate-400 text-center col-span-full">Chargement de vos parties...</p>`;

    try {
      const response = await fetch("/.netlify/functions/get-games");

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }
      if (!response.ok)
        throw new Error("Impossible de récupérer la liste des parties.");

      const games = await response.json();
      gamesListContainer.innerHTML = "";

      if (games.length === 0) {
        gamesListContainer.innerHTML = `<p class="text-slate-400 text-center col-span-full">Vous n'avez pas encore de partie enregistrée.</p>`;
      } else {
        games.forEach((game) => {
          const gameElement = document.createElement("a");
          gameElement.href = `/review.html?id=${game.id}`;
          gameElement.className =
            "bg-slate-800/50 p-4 rounded-lg flex justify-between items-center border border-slate-700 hover:border-cyan-500/50 transition-colors duration-300 block";

          const playedAsText = game.played_as === "w" ? "Blancs" : "Noirs";
          const statusText =
            game.status === "in_progress"
              ? "En cours"
              : `Terminée (${game.result || "N/A"})`;
          const lastUpdate = new Date(game.updated_at).toLocaleDateString(
            "fr-FR"
          );

          gameElement.innerHTML = `
                        <div>
                            <p class="font-bold text-slate-300">Partie du ${lastUpdate} (vous jouiez les ${playedAsText})</p>
                            <p class="text-sm text-slate-400">Statut: ${statusText}</p>
                        </div>
                        <span class="text-cyan-400 font-semibold hover:text-cyan-300">${
                          game.status === "in_progress"
                            ? "Reprendre"
                            : "Analyser"
                        } →</span>
                    `;
          gamesListContainer.appendChild(gameElement);
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      gamesListContainer.innerHTML = `<p class="text-red-400 text-center col-span-full">Une erreur est survenue.</p>`;
    }
  }

  // 3. Attacher les écouteurs d'événements spécifiques au dashboard
  if (newGameButton) {
    newGameButton.addEventListener("click", () => {
      console.log("dashboard.js: Bouton '+ Nouvelle Partie' cliqué.");
      openModal("modal-new-game");
    });
  }

  if (startGameBtn) {
    console.log("dashboard.js: Bouton 'start-game-btn' trouvé.");
    startGameBtn.addEventListener("click", async () => {
      console.log("dashboard.js: Bouton 'start-game-btn' cliqué.");
      const selectedColor = document.querySelector(
        'input[name="player-color"]:checked'
      ).value;
      try {
        const response = await fetch("/.netlify/functions/create-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ played_as: selectedColor }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.message || "La création de la partie a échoué."
          );
        }
        const newGame = await response.json();
        window.location.href = `/review.html?id=${newGame.id}`;
      } catch (error) {
        console.error("Erreur:", error);
        alert(error.message);
      }
    });
  } else {
    console.error(
      "dashboard.js: ERREUR CRITIQUE - Le bouton 'start-game-btn' est introuvable."
    );
  }

  // Lancer la récupération des parties au chargement de la page
  fetchAndDisplayGames();
});
