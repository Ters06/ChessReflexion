// Ce script est chargé sur la page d'accueil (index.html).
// Son rôle est de vérifier si l'utilisateur est déjà connecté.

document.addEventListener("DOMContentLoaded", () => {
  // On vérifie si un jeton de session est présent dans le stockage local du navigateur.
  const token = localStorage.getItem("jwt_token");

  // Si un jeton existe, cela signifie que l'utilisateur est probablement déjà connecté.
  // On le redirige alors directement vers son tableau de bord pour lui éviter de revoir la page de connexion.
  // La vérification finale de la validité du jeton sera faite par app.js sur la page du tableau de bord.
  if (token) {
    window.location.href = "/app.html";
  }
});
