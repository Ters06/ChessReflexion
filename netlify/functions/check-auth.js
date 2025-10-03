// Cette fonction vérifie la validité du jeton de session de l'utilisateur.

const jwt = require("jsonwebtoken");
const cookie = require("cookie");

exports.handler = async function (event, context) {
  // 1. Essayer de récupérer le cookie de session depuis les en-têtes de la requête.
  const cookies = event.headers.cookie
    ? cookie.parse(event.headers.cookie)
    : {};
  const token = cookies.jwt_token;

  // 2. Si aucun token n'est trouvé, l'utilisateur n'est pas connecté.
  if (!token) {
    return {
      statusCode: 401, // 401 Unauthorized
      body: JSON.stringify({ message: "Non authentifié." }),
    };
  }

  try {
    // 3. Vérifier la validité du token avec notre secret.
    // jwt.verify lèvera une erreur si le token est invalide ou a expiré.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Si le token est valide, renvoyer les informations de l'utilisateur.
    // On ne renvoie que les informations non sensibles.
    return {
      statusCode: 200,
      body: JSON.stringify({
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
      }),
    };
  } catch (error) {
    // 5. Si le token est invalide (falsifié, expiré, etc.), renvoyer une erreur.
    console.error("Erreur de vérification du JWT:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Token invalide ou expiré." }),
    };
  }
};
