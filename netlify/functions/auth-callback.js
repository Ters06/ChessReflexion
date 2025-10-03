// Cette fonction est le cœur de notre authentification.
// Elle est appelée par Google après que l'utilisateur a donné son consentement.

const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const { Pool } = require("@neondatabase/serverless");

exports.handler = async function (event, context) {
  // 1. Extraire le code d'autorisation de Google depuis l'URL
  const { code } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Code d'autorisation manquant." }),
    };
  }

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectURL = `${process.env.URL}/.netlify/functions/auth-callback`;

  const oauth2Client = new OAuth2Client(clientID, clientSecret, redirectURL);

  try {
    // 2. Échanger le code contre des tokens d'accès
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 3. Utiliser les tokens pour récupérer les informations de l'utilisateur
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientID,
    });
    const payload = ticket.getPayload();

    const googleId = payload["sub"];
    const email = payload["email"];
    const name = payload["name"];

    // 4. Se connecter à la base de données Neon
    const pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
    });

    // 5. Vérifier si l'utilisateur existe, sinon le créer (UPSERT)
    const userQuery = `
            INSERT INTO users (google_id, email, name)
            VALUES ($1, $2, $3)
            ON CONFLICT (google_id) 
            DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
            RETURNING id, name, email;
        `;

    const { rows } = await pool.query(userQuery, [googleId, email, name]);
    const user = rows[0];

    await pool.end(); // Fermer la connexion à la DB

    // 6. Créer un jeton de session (JWT)
    const jwtToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Le token expirera dans 7 jours
    );

    // 7. Placer le jeton dans un cookie sécurisé
    const sessionCookie = cookie.serialize("jwt_token", jwtToken, {
      httpOnly: true, // Le cookie n'est pas accessible par JavaScript côté client (sécurité XSS)
      secure: true, // Le cookie ne sera envoyé que sur une connexion HTTPS
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours en secondes
      sameSite: "Lax", // Protection CSRF
    });

    // 8. Rediriger l'utilisateur vers le tableau de bord
    return {
      statusCode: 302,
      headers: {
        "Set-Cookie": sessionCookie,
        Location: "/app.html",
      },
    };
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Une erreur est survenue lors de l'authentification.",
      }),
    };
  }
};
