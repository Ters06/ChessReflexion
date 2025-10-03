// Cette fonction sauvegarde l'analyse (les 3 étapes de réflexion) pour un coup donné.

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
    const {
      gameId,
      plyNumber,
      reflection_step1,
      reflection_step2,
      reflection_step3,
    } = JSON.parse(event.body);

    if (!gameId || !plyNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Données de réflexion manquantes." }),
      };
    }

    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
    });

    // ÉTAPE DE SÉCURITÉ CRUCIALE :
    // Avant d'insérer, on vérifie que la partie appartient bien à l'utilisateur connecté.
    const ownershipCheckQuery =
      "SELECT id FROM games WHERE id = $1 AND user_id = $2";
    const ownershipResult = await pool.query(ownershipCheckQuery, [
      gameId,
      userId,
    ]);

    if (ownershipResult.rows.length === 0) {
      await pool.end();
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Accès non autorisé à cette partie." }),
      };
    }

    // Utilisation de INSERT ... ON CONFLICT (UPSERT) pour créer ou mettre à jour la réflexion.
    const upsertQuery = `
            INSERT INTO move_reflections (game_id, ply_number, reflection_step1, reflection_step2, reflection_step3)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (game_id, ply_number)
            DO UPDATE SET
                reflection_step1 = EXCLUDED.reflection_step1,
                reflection_step2 = EXCLUDED.reflection_step2,
                reflection_step3 = EXCLUDED.reflection_step3;
        `;

    await pool.query(upsertQuery, [
      gameId,
      plyNumber,
      reflection_step1,
      reflection_step2,
      reflection_step3,
    ]);

    await pool.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Réflexion sauvegardée avec succès." }),
    };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la réflexion:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          "Une erreur est survenue lors de la sauvegarde de la réflexion.",
      }),
    };
  }
};
