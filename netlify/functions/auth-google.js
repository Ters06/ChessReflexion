// netlify/functions/auth-google.js

// Importation de la librairie OAuth2 de Google.
const { OAuth2Client } = require("google-auth-library");

// Le "handler" est la fonction principale que Netlify exécutera.
exports.handler = async function (event, context) {
  // On récupère notre Client ID stocké de manière sécurisée dans les variables d'environnement de Netlify.
  const clientID = process.env.GOOGLE_CLIENT_ID;

  // L'URL de notre site. Essentiel pour construire l'URI de redirection.
  // Netlify fournit automatiquement cette variable.
  const siteURL = process.env.URL || "http://localhost:8888";

  // On crée une nouvelle instance du client OAuth2.
  const oauth2Client = new OAuth2Client({
    clientId: clientID,
  });

  // On définit l'URI vers lequel Google doit rediriger l'utilisateur APRES qu'il ait donné son consentement.
  // C'est l'adresse de notre *deuxième* fonction serverless que nous créerons plus tard.
  const redirectURL = `${siteURL}/.netlify/functions/auth-callback`;

  // On génère l'URL d'autorisation.
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Permet d'obtenir un refresh token si nécessaire dans le futur.
    scope: [
      // Les informations que nous demandons à l'utilisateur.
      "https://www.googleapis.com/auth/userinfo.profile", // Accès aux infos de base du profil (nom).
      "https://www.googleapis.com/auth/userinfo.email", // Accès à l'email.
    ],
    redirect_uri: redirectURL, // L'URI de redirection que nous avons défini.
    prompt: "consent", // Force l'affichage de l'écran de consentement à chaque fois.
  });

  // On renvoie une réponse de type "redirection" (code 302) au navigateur de l'utilisateur.
  // Le navigateur va alors automatiquement l'envoyer vers l'URL d'autorisation de Google.
  return {
    statusCode: 302,
    headers: {
      Location: authorizeUrl,
      "Cache-Control": "no-cache", // Ne pas mettre en cache cette redirection.
    },
    body: "",
  };
};
