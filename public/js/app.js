// Ce script est le "gardien" de toutes les pages qui nécessitent une authentification.
// Il s'exécute immédiatement pour vérifier la session de l'utilisateur.

(async function checkAuthentication() {
  // Le token est dans un cookie HttpOnly, donc on ne peut pas le lire ici.
  // La seule source de vérité est notre fonction serverless check-auth.

  try {
    // On appelle notre fonction serverless. Elle aura accès au cookie.
    const response = await fetch("/.netlify/functions/check-auth");

    // Si la réponse n'est pas OK (ex: 401 Unauthorized), le token est invalide ou absent.
    if (!response.ok) {
      // On nettoie le localStorage au cas où de vieilles données y seraient.
      localStorage.removeItem("userData");
      // On redirige vers la page de connexion.
      window.location.href = "/";
      return; // Arrête l'exécution du script.
    }

    // Si tout est OK, le serveur a validé notre session.
    // On récupère les données de l'utilisateur.
    const userData = await response.json();

    // On stocke les données de l'utilisateur dans le localStorage pour que les autres scripts
    // sur la page (comme dashboard.js) puissent les utiliser sans refaire d'appel.
    localStorage.setItem("userData", JSON.stringify(userData));

    // On peut maintenant afficher le nom de l'utilisateur dans l'en-tête (si l'élément existe)
    // en utilisant un sélecteur plus robuste.
    const userNameElements = document.querySelectorAll(
      "#user-name, #user-name-header"
    );
    userNameElements.forEach((element) => {
      if (element) {
        element.textContent = userData.name;
      }
    });
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    // En cas d'erreur réseau ou autre, on redirige par sécurité.
    localStorage.removeItem("userData");
    window.location.href = "/";
  }
})();
