/**
 * Point d'entrée principal du bot Discord
 * Ce fichier initialise tous les composants nécessaires au fonctionnement du bot
 */

// Chargement des variables d'environnement
require('dotenv').config();

// Importation des modules nécessaires
const { Client } = require('./client');
const logHandler = require('./handlers/logHandler');
const antiCrashHandler = require('./handlers/antiCrashHandler');
const databaseHandler = require('./handlers/databaseHandler');
const { initConsole } = require('./handlers/init');

// Création d'une instance du client Discord
const client = new Client();

// Initialisation du système de logs
logHandler.init();

// Configuration du gestionnaire anti-crash
antiCrashHandler.init(client);

// Fonction principale d'initialisation
async function init() {
    try {
        // Initialisation de la console interactive
        initConsole(client);
        
        // Connexion à la base de données MongoDB
        await databaseHandler.connect();
        
        // Connexion du bot à Discord
        await client.login(process.env.TOKEN);
        
        logHandler.log('info', 'Bot', 'Bot démarré avec succès');
    } catch (error) {
        logHandler.log('error', 'Initialisation', `Erreur lors du démarrage du bot: ${error.message}`);
        process.exit(1);
    }
}

// Lancement du bot
init();

// Gestion de l'arrêt propre du bot
process.on('SIGINT', async () => {
    logHandler.log('info', 'Système', 'Arrêt du bot en cours...');
    
    // Déconnexion de la base de données
    await databaseHandler.disconnect();
    
    // Déconnexion du client Discord
    client.destroy();
    
    logHandler.log('info', 'Système', 'Bot arrêté avec succès');
    process.exit(0);
});