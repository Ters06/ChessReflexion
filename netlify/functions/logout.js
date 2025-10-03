// Cette fonction gère la déconnexion de l'utilisateur.

const cookie = require("cookie");

exports.handler = async function (event, context) {
  // Crée un cookie de session qui est expiré.
  // Le navigateur, en recevant ce cookie, supprimera le cookie 'jwt_token' existant.
  const expiredCookie = cookie.serialize("jwt_token", "", {
    httpOnly: true,
    secure: true,
    path: "/",
    expires: new Date(0), // Date d'expiration dans le passé.
    sameSite: "Lax",
  });

  // Redirige l'utilisateur vers la page d'accueil en lui envoyant le cookie expiré.
  return {
    statusCode: 302,
    headers: {
      "Set-Cookie": expiredCookie,
      Location: "/",
    },
  };
};
