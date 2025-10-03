// Ce script gère la redirection vers Google pour l'authentification.

// Attend que la page soit entièrement chargée.
document.addEventListener("DOMContentLoaded", () => {
  // Trouve le bouton de connexion par son ID.
  const loginButton = document.getElementById("login-btn");

  // Vérifie si le bouton existe pour éviter les erreurs.
  if (loginButton) {
    // Ajoute un écouteur d'événement pour le clic.
    loginButton.addEventListener("click", () => {
      // Affiche un message dans la console pour le débogage.
      console.log("Tentative de connexion avec Google...");

      // Redirige l'utilisateur vers le point d'entrée de notre fonction serverless d'authentification.
      // Cette fonction se chargera de la communication avec Google.
      // C'est plus sécurisé que de le faire directement depuis le client.
      window.location.href = "/.netlify/functions/auth-google";
    });
  }
});
