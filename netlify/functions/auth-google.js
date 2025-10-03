// Cette fonction serverless gère la redirection vers la page d'authentification Google.

const { OAuth2Client } = require("google-auth-library");

exports.handler = async function (event, context) {
  // Récupère l'ID client Google depuis les variables d'environnement sécurisées de Netlify.
  const clientID = process.env.GOOGLE_CLIENT_ID;

  // L'URL de notre fonction de callback que Google doit appeler après l'authentification.
  // Netlify fournit automatiquement l'URL de base du site dans process.env.URL.
  const redirectURL = `https://chessdojo.netlify.app/.netlify/functions/auth-callback`;

  const oauth2Client = new OAuth2Client(clientID);

  // Génère l'URL d'autorisation.
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    redirect_uri: redirectURL,
  });

  // Redirige l'utilisateur vers la page de connexion de Google.
  return {
    statusCode: 302, // 302 est le code HTTP pour une redirection temporaire.
    headers: {
      Location: authorizeUrl,
      "Cache-Control": "no-cache", // Empêche la mise en cache de cette redirection.
    },
  };
};
