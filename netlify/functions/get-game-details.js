// Cette fonction récupère toutes les données d'une partie spécifique, y compris les réflexions.

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

  const { id: gameId } = event.queryStringParameters;
  if (!gameId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "ID de partie manquant." }),
    };
  }

  try {
    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
    });

    const gameQuery = `
            SELECT id, user_id, pgn, played_as, status, result, termination, updated_at
            FROM games
            WHERE id = $1 AND user_id = $2;
        `;
    const gameResult = await pool.query(gameQuery, [gameId, userId]);

    if (gameResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Partie non trouvée ou accès non autorisé.",
        }),
      };
    }

    const gameDetails = gameResult.rows[0];

    const reflectionsQuery = `
            SELECT ply_number, reflection_step1, reflection_step2, reflection_step3
            FROM move_reflections
            WHERE game_id = $1;
        `;
    const reflectionsResult = await pool.query(reflectionsQuery, [gameId]);

    await pool.end();

    const responsePayload = {
      ...gameDetails,
      reflections: reflectionsResult.rows,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responsePayload),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des détails:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Une erreur est survenue lors de la récupération des données.",
      }),
    };
  }
};
