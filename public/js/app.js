// Ce script est le "gardien" de toutes les pages qui nécessitent une authentification.
// Il doit être appelé en premier sur app.html, review.html, profile.html, etc.

(async function checkAuthentication() {
  const token = localStorage.getItem("jwt_token");

  // S'il n'y a pas de token, pas besoin d'appeler le serveur. On redirige directement.
  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    // On appelle notre fonction serverless sécurisée pour valider le token.
    const response = await fetch("/.netlify/functions/check-auth", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Si la réponse n'est pas OK (ex: 401 Unauthorized), le token est invalide.
    if (!response.ok) {
      // On nettoie le localStorage et on redirige vers la page de connexion.
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("userData");
      window.location.href = "/";
      return;
    }

    // Si tout est OK, on récupère les données de l'utilisateur.
    const userData = await response.json();

    // On stocke les données de l'utilisateur dans le localStorage pour que d'autres scripts
    // sur la page (comme dashboard.js ou profile.js) puissent les utiliser sans refaire d'appel.
    localStorage.setItem("userData", JSON.stringify(userData));

    // On peut maintenant afficher le nom de l'utilisateur dans l'en-tête (si l'élément existe)
    const userNameElement =
      document.getElementById("user-name") ||
      document.getElementById("user-name-header");
    if (userNameElement) {
      userNameElement.textContent = userData.name;
    }
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    // En cas d'erreur réseau ou autre, on redirige par sécurité.
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("userData");
    window.location.href = "/";
  }
})();
