const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    // 1. Vérifier la présence du cookie de session
    const token = event.headers.cookie?.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];

    if (!token) {
        return {
            statusCode: 401, // Non autorisé
            body: JSON.stringify({ message: 'Authentification requise.' }),
        };
    }

    try {
        // 2. Vérifier la validité du token et extraire l'ID de l'utilisateur
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user_id;

        // 3. Se connecter à la base de données Neon
        const pool = new Pool({
            connectionString: process.env.NETLIFY_DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Requis pour la connexion à Neon
            }
        });

        // 4. Récupérer les parties de l'utilisateur
        const { rows } = await pool.query(
            'SELECT id, pgn, played_as, created_at FROM games WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        
        await pool.end();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rows),
        };

    } catch (error) {
        console.error('Erreur lors de la vérification du token ou de la récupération des parties:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
             return { statusCode: 401, body: JSON.stringify({ message: 'Token invalide ou expiré.' }) };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erreur interne du serveur.' }),
        };
    }
};
