// Cette fonction crée une nouvelle partie dans la base de données pour l'utilisateur authentifié.

const jwt = require("jsonwebtoken");
const { Pool } = require("@neondatabase/serverless");
const cookie = require("cookie");

// FONCTION HELPER MISE À JOUR : Lit le token depuis les cookies
function getUserId(event) {
  const cookies = event.headers.cookie
    ? cookie.parse(event.headers.cookie)
    : {};
  const token = cookies.jwt_token;

  if (!token) {
    return null;
  }

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
    const { played_as } = JSON.parse(event.body);
    if (played_as !== "w" && played_as !== "b") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Couleur invalide." }),
      };
    }

    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
    });

    const query = `
            INSERT INTO games (user_id, pgn, played_as, status, updated_at)
            VALUES ($1, '', $2, 'in_progress', CURRENT_TIMESTAMP)
            RETURNING id;
        `;

    const { rows } = await pool.query(query, [userId, played_as]);
    const newGame = rows[0];

    await pool.end();

    return {
      statusCode: 201, // 201 Created
      body: JSON.stringify(newGame),
    };
  } catch (error) {
    console.error("Erreur lors de la création de la partie:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Une erreur est survenue lors de la création de la partie.",
      }),
    };
  }
};
