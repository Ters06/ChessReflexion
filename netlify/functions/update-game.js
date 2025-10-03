// Cette fonction met à jour les données d'une partie existante (PGN, statut, etc.).

const jwt = require("jsonwebtoken");
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
    const { gameId, pgn, status, result, termination } = JSON.parse(event.body);

    if (!gameId || pgn === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Données de partie manquantes." }),
      };
    }

    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
    });

    // IMPORTANT : La clause "WHERE user_id = $2" est la protection de sécurité clé.
    // Elle garantit qu'un utilisateur ne peut mettre à jour que ses propres parties.
    const query = `
            UPDATE games
            SET 
                pgn = $1,
                status = $3,
                result = $4,
                termination = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND user_id = $2;
        `;

    await pool.query(query, [pgn, userId, status, result, termination, gameId]);

    await pool.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Partie sauvegardée avec succès." }),
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la partie:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Une erreur est survenue lors de la sauvegarde.",
      }),
    };
  }
};
