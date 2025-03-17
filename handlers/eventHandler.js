/**
 * Gestionnaire d'événements
 * Charge et gère tous les événements du bot
 * Détecte automatiquement les modifications, ajouts et suppressions d'événements
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const logHandler = require('./logHandler');

// Collection des chemins de fichiers d'événements
const eventPaths = new Map();
// Collection des écouteurs d'événements pour éviter les doublons
const eventListeners = new Map();

/**
 * Initialise le gestionnaire d'événements
 * @param {Client} client - Instance du client Discord
 */
function init(client) {
    const eventsDir = path.join(process.cwd(), 'events');

    // S'assurer que le dossier des événements existe
    if (!fs.existsSync(eventsDir)) {
        fs.mkdirSync(eventsDir, { recursive: true });
    }

    // Charger tous les événements
    loadEvents(client, eventsDir);

    // Configurer le watcher pour détecter les changements de fichiers
    const watcher = chokidar.watch(eventsDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });

    // Événement lorsqu'un fichier est ajouté
    watcher.on('add', filePath => {
        if (filePath.endsWith('.js')) {
            loadEvent(client, filePath);
            logHandler.log('info', 'Événements', `Événement ajouté: ${path.basename(filePath)}`);
        }
    });

    // Événement lorsqu'un fichier est modifié
    watcher.on('change', filePath => {
        if (filePath.endsWith('.js')) {
            reloadEvent(client, filePath);
            logHandler.log('info', 'Événements', `Événement mis à jour: ${path.basename(filePath)}`);
        }
    });

    // Événement lorsqu'un fichier est supprimé
    watcher.on('unlink', filePath => {
        if (filePath.endsWith('.js')) {
            unloadEvent(client, filePath);
            logHandler.log('info', 'Événements', `Événement supprimé: ${path.basename(filePath)}`);
        }
    });

    logHandler.log('info', 'Événements', 'Gestionnaire d\'événements initialisé');
}

/**
 * Charge tous les événements à partir du répertoire spécifié
 * @param {Client} client - Instance du client Discord
 * @param {string} dir - Répertoire des événements
 */
function loadEvents(client, dir) {
    const files = getAllFiles(dir);

    for (const filePath of files) {
        if (filePath.endsWith('.js')) {
            loadEvent(client, filePath);
        }
    }

    logHandler.log('info', 'Événements', `${eventPaths.size} événements chargés`);
}

/**
 * Récupère tous les fichiers dans un répertoire et ses sous-répertoires
 * @param {string} dirPath - Chemin du répertoire
 * @param {Array} arrayOfFiles - Tableau pour stocker les fichiers
 * @returns {Array} - Tableau des chemins de fichiers
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);

        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
}

/**
 * Charge un événement spécifique
 * @param {Client} client - Instance du client Discord
 * @param {string} filePath - Chemin du fichier d'événement
 */
function loadEvent(client, filePath) {
    try {
        // Supprimer le cache du module pour recharger les modifications
        delete require.cache[require.resolve(filePath)];

        // Charger l'événement
        const event = require(filePath);

        // Vérifier que l'événement a toutes les propriétés requises
        if (!event.name || !event.execute) {
            logHandler.log('error', 'Événements', `L'événement ${filePath} est invalide (il manque le nom ou la fonction execute)`);
            return;
        }

        // Vérifier si l'événement est déjà enregistré
        if (eventListeners.has(event.name)) {
            // Si oui, le décharger d'abord pour éviter les doublons
            unloadEvent(client, filePath);
        }

        // Enregistrer le chemin de l'événement
        eventPaths.set(event.name, filePath);

        // Créer un wrapper pour la fonction execute
        const listener = (...args) => event.execute(client, ...args);

        // Enregistrer le listener
        eventListeners.set(event.name, listener);

        // Lier l'événement au client
        if (event.once) {
            client.once(event.name, listener);
        } else {
            client.on(event.name, listener);
        }

        logHandler.log('debug', 'Événements', `Événement chargé: ${event.name}`);
    } catch (error) {
        logHandler.log('error', 'Événements', `Erreur lors du chargement de l'événement ${filePath}: ${error.message}`);
    }
}

/**
 * Recharge un événement spécifique
 * @param {Client} client - Instance du client Discord
 * @param {string} filePath - Chemin du fichier d'événement
 */
function reloadEvent(client, filePath) {
    try {
        // Trouver le nom de l'événement associé à ce chemin
        let eventName = null;
        for (const [name, path] of eventPaths.entries()) {
            if (path === filePath) {
                eventName = name;
                break;
            }
        }

        // Si l'événement existe déjà, le décharger d'abord
        if (eventName) {
            unloadEvent(client, filePath);
        }

        // Charger l'événement mis à jour
        loadEvent(client, filePath);
    } catch (error) {
        logHandler.log('error', 'Événements', `Erreur lors du rechargement de l'événement ${filePath}: ${error.message}`);
    }
}

/**
 * Décharge un événement spécifique
 * @param {Client} client - Instance du client Discord
 * @param {string} filePath - Chemin du fichier d'événement
 */
function unloadEvent(client, filePath) {
    try {
        // Trouver le nom de l'événement associé à ce chemin
        let eventName = null;
        for (const [name, path] of eventPaths.entries()) {
            if (path === filePath) {
                eventName = name;
                break;
            }
        }

        // Si l'événement n'existe pas, rien à faire
        if (!eventName) {
            return;
        }

        // Récupérer le listener
        const listener = eventListeners.get(eventName);

        if (listener) {
            // Supprimer l'écouteur spécifique
            client.removeListener(eventName, listener);
            eventListeners.delete(eventName);
        }

        // Supprimer l'événement de notre map
        eventPaths.delete(eventName);

        // Supprimer du cache
        delete require.cache[require.resolve(filePath)];

        logHandler.log('debug', 'Événements', `Événement déchargé: ${eventName}`);
    } catch (error) {
        logHandler.log('error', 'Événements', `Erreur lors du déchargement de l'événement ${filePath}: ${error.message}`);
    }
}

module.exports = {
    init,
    loadEvent,
    reloadEvent,
    unloadEvent
};