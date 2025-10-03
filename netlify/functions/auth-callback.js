// netlify/functions/auth-callback.js

const { OAuth2Client } = require("google-auth-library");
const { Pool } = require("@neondatabase/serverless");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

exports.handler = async function (event, context) {
  // 1. Extraire le code d'autorisation de l'URL
  const code = event.queryStringParameters.code;

  // 2. Préparer les secrets et la configuration
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  const siteURL = process.env.URL || "http://localhost:8888";
  const redirectURL = `${siteURL}/.netlify/functions/auth-callback`;

  try {
    const oauth2Client = new OAuth2Client(clientID, clientSecret, redirectURL);

    // 3. Échanger le code contre des tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 4. Obtenir les informations du profil utilisateur depuis Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientID,
    });
    const payload = ticket.getPayload();

    const googleId = payload["sub"];
    const email = payload["email"];
    const name = payload["name"];

    // 5. Se connecter à la base de données Neon
    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
    });

    // 6. Vérifier si l'utilisateur existe, sinon le créer (UPSERT)
    // ON CONFLICT (google_id) DO UPDATE... est une manière sécurisée de gérer cela.
    // Si un utilisateur avec ce google_id existe déjà, on met juste à jour son nom.
    // Sinon, on l'insère. RETURNING id nous renvoie son ID dans tous les cas.
    const userResult = await pool.query(
      `INSERT INTO users (google_id, email, name) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (google_id) 
             DO UPDATE SET name = $3, email = $2
             RETURNING id`,
      [googleId, email, name]
    );

    const userId = userResult.rows[0].id;
    await pool.end(); // Fermer la connexion à la DB

    // 7. Créer notre propre jeton de session (JWT)
    const sessionToken = jwt.sign({ userId: userId }, jwtSecret, {
      expiresIn: "7d",
    });

    // 8. Créer un cookie sécurisé
    const sessionCookie = cookie.serialize("dojo_session", sessionToken, {
      httpOnly: true, // Le cookie n'est pas accessible par JavaScript côté client (sécurité XSS)
      secure: process.env.CONTEXT === "production", // Mettre 'secure' uniquement en production (HTTPS)
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      sameSite: "Lax", // Protection contre les attaques CSRF
    });

    // 9. Rediriger l'utilisateur vers la page principale de l'application avec le cookie de session
    return {
      statusCode: 302,
      headers: {
        Location: "/app.html", // La page où l'utilisateur atterrira après la connexion
        "Set-Cookie": sessionCookie,
        "Cache-Control": "no-cache",
      },
      body: "",
    };
  } catch (error) {
    console.error("Erreur lors de l'authentification:", error);
    // Rediriger vers une page d'erreur si quelque chose se passe mal
    return {
      statusCode: 302,
      headers: {
        Location: "/?error=auth_failed",
      },
    };
  }
};
