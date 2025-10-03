// netlify/functions/check-auth.js

const { Pool } = require("@neondatabase/serverless");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

exports.handler = async function (event, context) {
  // 1. Récupérer le cookie de la requête
  const cookies = event.headers.cookie
    ? cookie.parse(event.headers.cookie)
    : {};
  const sessionToken = cookies.dojo_session;

  if (!sessionToken) {
    // Pas de token = non autorisé
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Non autorisé" }),
    };
  }

  try {
    // 2. Vérifier le JWT
    const decodedToken = jwt.verify(sessionToken, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    // 3. Récupérer les informations de l'utilisateur dans la base de données
    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
    });
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );
    await pool.end();

    if (result.rows.length === 0) {
      // L'utilisateur n'existe pas dans la DB, le token est invalide
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Utilisateur non trouvé" }),
      };
    }

    const user = result.rows[0];

    // 4. Renvoyer les informations de l'utilisateur (sans données sensibles)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, name: user.name, email: user.email }),
    };
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    // Token invalide ou expiré
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Session invalide ou expirée" }),
    };
  }
};
