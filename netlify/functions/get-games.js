// Cette fonction récupère toutes les parties associées à l'utilisateur authentifié.

const jwt = require("jsonwebtoken");
const { Pool } = require("@neondatabase/serverless");
const cookie = require("cookie");

// FONCTION HELPER MISE À JOUR : Lit le token depuis les cookies
function getUserId(event) {
  // 1. Parser les cookies depuis les en-têtes de la requête
  const cookies = event.headers.cookie
    ? cookie.parse(event.headers.cookie)
    : {};
  const token = cookies.jwt_token;

  if (!token) {
    return null;
  }

  try {
    // 2. Vérifier le token et extraire l'ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== "GET") {
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

    const query = `
            SELECT id, pgn, played_as, status, result, termination, updated_at
            FROM games
            WHERE user_id = $1
            ORDER BY updated_at DESC;
        `;

    const { rows } = await pool.query(query, [userId]);

    await pool.end();

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des parties:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Une erreur est survenue lors de la récupération des parties.",
      }),
    };
  }
};
