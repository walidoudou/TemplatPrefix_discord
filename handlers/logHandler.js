/**
 * Gestionnaire de logs
 * Centralise la gestion des logs pour éviter les duplications
 * Supporte différents niveaux de logs (info, debug, warning, error, success)
 */

const fs = require('fs');
const path = require('path');
const colors = require('colors');
const config = require('../config.json');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');

// Configuration des couleurs
colors.setTheme({
    info: config.console.colors.info,
    success: config.console.colors.success,
    warning: config.console.colors.warning,
    error: config.console.colors.error,
    debug: config.console.colors.debug
});

// Chemins des fichiers de logs
const logsDir = path.join(process.cwd(), 'logs');
let logStream = null;
let currentLogFile = '';

/**
 * Initialise le gestionnaire de logs
 */
function init() {
    // Créer le répertoire de logs s'il n'existe pas
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Créer/ouvrir le fichier de log du jour
    createLogStream();

    // Programmer la rotation des logs à minuit
    scheduleLogRotation();

    log('info', 'Logs', 'Gestionnaire de logs initialisé');
}

/**
 * Crée ou ouvre le flux d'écriture pour les logs
 */
function createLogStream() {
    const date = format(new Date(), 'yyyy-MM-dd', { locale: fr });
    const logFile = path.join(logsDir, `${date}.log`);

    // Fermer le flux précédent s'il existe
    if (logStream) {
        logStream.end();
    }

    // Créer le nouveau flux
    logStream = fs.createWriteStream(logFile, { flags: 'a' });
    currentLogFile = logFile;

    return logStream;
}

/**
 * Programme la rotation des logs à minuit
 */
function scheduleLogRotation() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
        createLogStream();
        scheduleLogRotation();
    }, timeUntilMidnight);
}

/**
 * Enregistre un message de log
 * @param {string} level - Niveau de log (info, debug, warning, error, success)
 * @param {string} category - Catégorie du log
 * @param {string} message - Message à logger
 */
function log(level, category, message) {
    // Vérifier que le niveau est valide
    if (!['info', 'debug', 'warning', 'error', 'success'].includes(level)) {
        level = 'info';
    }

    // Formater la date et l'heure
    const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: fr });

    // Formater le message de log
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;

    // Afficher dans la console avec les couleurs appropriées
    console[level === 'success' ? 'log' : level](
        colors[level](`[${timestamp}]`) +
        colors.white(` [${level.toUpperCase()}]`) +
        colors.cyan(` [${category}]`) +
        colors[level](` ${message}`)
    );

    // Écrire dans le fichier de log
    if (logStream) {
        logStream.write(logMessage + '\n');
    }
}

/**
 * Récupère le contenu du fichier de log actuel
 * @returns {Promise<string>} - Contenu du fichier de log
 */
async function getLogContent() {
    return new Promise((resolve, reject) => {
        fs.readFile(currentLogFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

/**
 * Effacer la console
 */
function clearConsole() {
    process.stdout.write('\x1Bc');
}

module.exports = {
    init,
    log,
    getLogContent,
    clearConsole
};