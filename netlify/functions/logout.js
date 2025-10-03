// netlify/functions/logout.js

const cookie = require("cookie");

exports.handler = async function (event, context) {
  // On crée un cookie avec la même nom, mais avec une date d'expiration dans le passé.
  // Le navigateur va alors le supprimer automatiquement.
  const expiredCookie = cookie.serialize("dojo_session", "", {
    httpOnly: true,
    secure: process.env.CONTEXT === "production",
    path: "/",
    expires: new Date(0), // Date d'expiration dans le passé
  });

  // On redirige l'utilisateur vers la page d'accueil avec l'instruction de supprimer le cookie.
  return {
    statusCode: 302,
    headers: {
      Location: "/",
      "Set-Cookie": expiredCookie,
      "Cache-Control": "no-cache",
    },
    body: "",
  };
};
