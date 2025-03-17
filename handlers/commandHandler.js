/**
 * Gestionnaire de commandes
 * Charge et gère toutes les commandes du bot
 * Détecte automatiquement les modifications, ajouts et suppressions de commandes
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const logHandler = require('./logHandler');

// Collection des chemins de fichiers de commandes
const commandPaths = new Map();

/**
 * Initialise le gestionnaire de commandes
 * @param {Client} client - Instance du client Discord
 */
function init(client) {
    const commandsDir = path.join(process.cwd(), 'commands');

    // S'assurer que le dossier des commandes existe
    if (!fs.existsSync(commandsDir)) {
        fs.mkdirSync(commandsDir, { recursive: true });
    }

    // Vider les collections existantes pour éviter les doublons
    client.commands.clear();
    client.aliases.clear();

    // Charger toutes les commandes
    loadCommands(client, commandsDir);

    // Configurer le watcher pour détecter les changements de fichiers
    const watcher = chokidar.watch(commandsDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });

    // Événement lorsqu'un fichier est ajouté
    watcher.on('add', filePath => {
        if (filePath.endsWith('.js')) {
            loadCommand(client, filePath);
            logHandler.log('info', 'Commandes', `Commande ajoutée: ${path.basename(filePath)}`);
        }
    });

    // Événement lorsqu'un fichier est modifié
    watcher.on('change', filePath => {
        if (filePath.endsWith('.js')) {
            reloadCommand(client, filePath);
            logHandler.log('info', 'Commandes', `Commande mise à jour: ${path.basename(filePath)}`);
        }
    });

    // Événement lorsqu'un fichier est supprimé
    watcher.on('unlink', filePath => {
        if (filePath.endsWith('.js')) {
            unloadCommand(client, filePath);
            logHandler.log('info', 'Commandes', `Commande supprimée: ${path.basename(filePath)}`);
        }
    });

    logHandler.log('info', 'Commandes', 'Gestionnaire de commandes initialisé');
}

/**
 * Charge toutes les commandes à partir du répertoire spécifié
 * @param {Client} client - Instance du client Discord
 * @param {string} dir - Répertoire des commandes
 */
function loadCommands(client, dir) {
    const files = getAllFiles(dir);

    for (const filePath of files) {
        if (filePath.endsWith('.js')) {
            loadCommand(client, filePath);
        }
    }

    logHandler.log('info', 'Commandes', `${client.commands.size} commandes chargées`);
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
 * Charge une commande spécifique
 * @param {Client} client - Instance du client Discord
 * @param {string} filePath - Chemin du fichier de commande
 */
function loadCommand(client, filePath) {
    try {
        // Supprimer le cache du module pour recharger les modifications
        delete require.cache[require.resolve(filePath)];

        // Charger la commande
        const command = require(filePath);

        // Vérifier que la commande a toutes les propriétés requises
        if (!command.name || !command.run) {
            logHandler.log('error', 'Commandes', `La commande ${filePath} est invalide (il manque le nom ou la fonction run)`);
            return;
        }

        // Définir la catégorie basée sur le répertoire si non spécifiée
        if (!command.category) {
            const relativeDir = path.relative(process.cwd(), path.dirname(filePath));
            const categoryDir = relativeDir.split(path.sep).pop();

            if (categoryDir && categoryDir !== 'commands') {
                command.category = categoryDir.charAt(0).toUpperCase() + categoryDir.slice(1);
            } else {
                command.category = 'Divers';
            }
        }

        // Vérifier si la commande existe déjà
        if (client.commands.has(command.name)) {
            // Si la commande existe déjà, la décharger d'abord
            const existingCommand = client.commands.get(command.name);

            // Supprimer les alias existants
            if (existingCommand.aliases && Array.isArray(existingCommand.aliases)) {
                existingCommand.aliases.forEach(alias => {
                    client.aliases.delete(alias);
                });
            }
        }

        // Enregistrer la commande dans les collections
        client.commands.set(command.name, command);
        commandPaths.set(command.name, filePath);

        // Enregistrer les alias de la commande
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
                client.aliases.set(alias, command.name);
            });
        }

        logHandler.log('debug', 'Commandes', `Commande chargée: ${command.name}`);
    } catch (error) {
        logHandler.log('error', 'Commandes', `Erreur lors du chargement de la commande ${filePath}: ${error.message}`);
    }
}

/**
 * Recharge une commande spécifique
 * @param {Client} client - Instance du client Discord
 * @param {string} filePath - Chemin du fichier de commande
 */
function reloadCommand(client, filePath) {
    try {
        // Trouver le nom de la commande associée à ce chemin
        let commandName = null;
        for (const [name, path] of commandPaths.entries()) {
            if (path === filePath) {
                commandName = name;
                break;
            }
        }

        // Si la commande existe déjà, la décharger d'abord
        if (commandName && client.commands.has(commandName)) {
            unloadCommand(client, filePath);
        }

        // Charger la commande mise à jour
        loadCommand(client, filePath);
    } catch (error) {
        logHandler.log('error', 'Commandes', `Erreur lors du rechargement de la commande ${filePath}: ${error.message}`);
    }
}

/**
 * Décharge une commande spécifique
 * @param {Client} client - Instance du client Discord
 * @param {string} filePath - Chemin du fichier de commande
 */
function unloadCommand(client, filePath) {
    try {
        // Trouver le nom de la commande associée à ce chemin
        let commandName = null;
        for (const [name, path] of commandPaths.entries()) {
            if (path === filePath) {
                commandName = name;
                break;
            }
        }

        // Si la commande n'existe pas, rien à faire
        if (!commandName || !client.commands.has(commandName)) {
            return;
        }

        const command = client.commands.get(commandName);

        // Supprimer les alias
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
                client.aliases.delete(alias);
            });
        }

        // Supprimer la commande
        client.commands.delete(commandName);
        commandPaths.delete(commandName);

        // Supprimer du cache
        delete require.cache[require.resolve(filePath)];

        logHandler.log('debug', 'Commandes', `Commande déchargée: ${commandName}`);
    } catch (error) {
        logHandler.log('error', 'Commandes', `Erreur lors du déchargement de la commande ${filePath}: ${error.message}`);
    }
}

module.exports = {
    init,
    loadCommand,
    reloadCommand,
    unloadCommand
};