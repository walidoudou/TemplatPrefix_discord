/**
 * Gestionnaire anti-crash
 * Capture toutes les erreurs non gérées pour éviter le crash du bot
 * Enregistre les erreurs dans les logs pour analyse ultérieure
 */

const fs = require('fs');
const path = require('path');
const logHandler = require('./logHandler');

/**
 * Initialise le gestionnaire anti-crash
 * @param {Client} client - Instance du client Discord
 */
function init(client) {
    // Capturer les exceptions non gérées
    process.on('uncaughtException', (error, origin) => {
        handleError('Exception non gérée', error, origin);
    });

    // Capturer les rejets de promesse non gérés
    process.on('unhandledRejection', (reason, promise) => {
        handleError('Promesse rejetée non gérée', reason);
    });

    // Capturer les warnings
    process.on('warning', (warning) => {
        logHandler.log('warning', 'Système', `Warning: ${warning.name} - ${warning.message}`);

        // Enregistrer les détails dans un fichier séparé pour analyse ultérieure
        const warningsDir = path.join(process.cwd(), 'logs', 'warnings');
        if (!fs.existsSync(warningsDir)) {
            fs.mkdirSync(warningsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const warningFile = path.join(warningsDir, `warning-${timestamp}.log`);

        fs.writeFileSync(warningFile, `Warning: ${warning.name}\nMessage: ${warning.message}\nStack: ${warning.stack}`);
    });

    // Gérer les erreurs spécifiques à Discord.js
    client.on('error', (error) => {
        handleError('Erreur Discord.js', error);
    });

    // Gérer la déconnexion inattendue
    client.on('disconnect', () => {
        logHandler.log('warning', 'Client', 'Bot déconnecté de Discord');
    });

    // Gérer la reconnexion
    client.on('reconnecting', () => {
        logHandler.log('info', 'Client', 'Tentative de reconnexion à Discord');
    });

    // Gestionnaire d'erreurs pour shards (si utilisé)
    if (client.shard) {
        client.shard.on('error', (error) => {
            handleError('Erreur Shard', error);
        });
    }

    logHandler.log('info', 'Système', 'Gestionnaire anti-crash initialisé');
}

/**
 * Gère une erreur en l'enregistrant et en créant un fichier de crash
 * @param {string} type - Type d'erreur
 * @param {Error} error - Objet erreur
 * @param {string} [origin] - Origine de l'erreur (facultatif)
 */
function handleError(type, error, origin = '') {
    try {
        // Formatter le message d'erreur
        const errorMessage = `${type}: ${error?.message || 'Erreur inconnue'}`;
        logHandler.log('error', 'Système', errorMessage);

        // Créer un répertoire pour les logs de crash s'il n'existe pas
        const crashDir = path.join(process.cwd(), 'logs', 'crashes');
        if (!fs.existsSync(crashDir)) {
            fs.mkdirSync(crashDir, { recursive: true });
        }

        // Créer un fichier de log pour cette erreur
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const crashFile = path.join(crashDir, `crash-${timestamp}.log`);

        // Informations détaillées sur l'erreur
        const details = [
            `Type: ${type}`,
            `Date: ${new Date().toLocaleString()}`,
            `Message: ${error?.message || 'Erreur inconnue'}`,
            `Stack: ${error?.stack || 'Pas de stack trace disponible'}`,
            origin ? `Origine: ${origin}` : '',
            '\nInformations système:',
            `Node.js: ${process.version}`,
            `OS: ${process.platform} ${process.arch}`,
            `Mémoire utilisée: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
            `PID: ${process.pid}`
        ].join('\n');

        // Écrire dans le fichier de crash
        fs.writeFileSync(crashFile, details);

        logHandler.log('info', 'Système', `Détails de l'erreur enregistrés dans ${crashFile}`);
    } catch (logError) {
        // En cas d'erreur lors de la journalisation, afficher directement dans la console
        console.error('Erreur lors de la journalisation du crash:', logError);
        console.error('Erreur originale:', error);
    }
}

module.exports = {
    init,
    handleError
};