// public/js/app.js

// Cette fonction s'exécute dès que la page est chargée.
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // On appelle notre fonction serverless pour vérifier la session.
    const response = await fetch("/.netlify/functions/check-auth");

    if (!response.ok) {
      // Si la réponse n'est pas OK (ex: 401 Unauthorized), l'utilisateur n'est pas connecté.
      // On le redirige immédiatement vers la page d'accueil.
      window.location.href = "/?error=session_expired";
      return;
    }

    // Si la session est valide, on récupère les données de l'utilisateur.
    const userData = await response.json();

    // On affiche le message de bienvenue.
    const welcomeMessage = document.getElementById("welcome-message");
    if (welcomeMessage && userData.name) {
      welcomeMessage.textContent = `Connecté en tant que ${userData.name}`;
    }

    // On cache le loader et on affiche le contenu de l'application.
    document.getElementById("loader").style.display = "none";
    document.getElementById("app-content").style.display = "flex";
  } catch (error) {
    console.error("Erreur lors de la vérification de la session:", error);
    // En cas d'erreur réseau ou autre, on redirige par sécurité.
    window.location.href = "/?error=check_failed";
  }

  // On attache la fonctionnalité de déconnexion au bouton.
  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      // La redirection se fera côté serveur après la suppression du cookie.
      window.location.href = "/.netlify/functions/logout";
    });
  }
});
