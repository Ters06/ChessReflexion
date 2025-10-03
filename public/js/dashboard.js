// Ce script gère la logique de la page du tableau de bord (app.html).
// Il s'exécute après app.js, donc nous savons que l'utilisateur est authentifié.

document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  const gamesListContainer = document.getElementById("games-list");
  const newGameButton = document.getElementById("new-game-button");
  const startGameBtn = document.getElementById("start-game-btn");

  // 1. Affiche le nom de l'utilisateur
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
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("/.netlify/functions/get-games", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok)
        throw new Error("Impossible de récupérer la liste des parties.");

      const games = await response.json();
      gamesListContainer.innerHTML = "";

      if (games.length === 0) {
        gamesListContainer.innerHTML = `<p class="text-slate-400 text-center col-span-full">Vous n'avez pas encore de partie enregistrée. Lancez-en une nouvelle pour commencer !</p>`;
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
      gamesListContainer.innerHTML = `<p class="text-red-400 text-center col-span-full">Une erreur est survenue. Impossible d'afficher vos parties.</p>`;
    }
  }

  // 3. Gérer la création d'une nouvelle partie
  if (newGameButton) {
    newGameButton.addEventListener("click", () => {
      openModal("modal-new-game");
    });
  }

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

  // Lancer la récupération des parties au chargement de la page
  fetchAndDisplayGames();
});
