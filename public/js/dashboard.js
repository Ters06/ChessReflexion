document.addEventListener("DOMContentLoaded", () => {
  // Cette fonction sera appelée par app.js une fois l'utilisateur vérifié
  window.loadDashboard = async () => {
    const gamesListContainer = document.getElementById("games-list-container");
    if (!gamesListContainer) return;

    gamesListContainer.innerHTML =
      '<p class="text-slate-400">Chargement de vos parties...</p>';

    try {
      const response = await fetch("/.netlify/functions/get-games");

      if (!response.ok) {
        if (response.status === 401) {
          // Si la session a expiré, le token n'est plus valide
          window.location.href = "/";
          return;
        }
        throw new Error(`Erreur du serveur: ${response.statusText}`);
      }

      const games = await response.json();

      if (games.length === 0) {
        gamesListContainer.innerHTML =
          '<p class="text-center text-slate-500 py-8">Vous n\'avez aucune partie enregistrée pour le moment. Lancez une nouvelle partie pour commencer !</p>';
      } else {
        gamesListContainer.innerHTML = `
                    <div class="space-y-4">
                        ${games
                          .map(
                            (game) => `
                            <div class="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p class="font-bold text-slate-300">Partie du ${new Date(
                                      game.created_at
                                    ).toLocaleDateString("fr-FR")}</p>
                                    <p class="text-sm text-slate-400">Jouée avec les ${
                                      game.played_as === "w"
                                        ? "Blancs"
                                        : "Noirs"
                                    }</p>
                                </div>
                                <button class="text-cyan-400 hover:text-cyan-300 font-semibold">Voir</button>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                `;
      }
    } catch (error) {
      console.error("Erreur lors du chargement des parties:", error);
      gamesListContainer.innerHTML =
        '<p class="text-red-400">Impossible de charger vos parties. Veuillez réessayer.</p>';
    }
  };
});
