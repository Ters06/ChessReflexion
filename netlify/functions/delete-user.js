// Cette fonction gère la suppression complète d'un utilisateur et de toutes ses données.

const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const { Pool } = require("@neondatabase/serverless");

// Fonction helper pour extraire l'ID utilisateur du token JWT
function getUserId(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const userId = getUserId(event);
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Non authentifié." }),
    };
  }

  try {
    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
    });

    // La suppression de l'utilisateur entraînera la suppression en cascade
    // de toutes ses parties et réflexions grâce à la contrainte "ON DELETE CASCADE"
    // définie dans notre schéma de base de données.
    const query = `
            DELETE FROM users WHERE id = $1;
        `;

    await pool.query(query, [userId]);

    await pool.end();

    // Crée un cookie expiré pour déconnecter l'utilisateur après la suppression.
    const expiredCookie = cookie.serialize("jwt_token", "", {
      httpOnly: true,
      secure: true,
      path: "/",
      expires: new Date(0),
      sameSite: "Lax",
    });

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": expiredCookie,
      },
      body: JSON.stringify({ message: "Compte supprimé avec succès." }),
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du compte:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Une erreur est survenue lors de la suppression du compte.",
      }),
    };
  }
};
