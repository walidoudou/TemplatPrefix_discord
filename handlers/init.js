/**
 * Initialisation de la console interactive
 * Gère l'interface utilisateur dans la console pour administrer le bot
 */

const readline = require('readline');
const colors = require('colors');
const logHandler = require('./logHandler');
const commandHandler = require('./commandHandler');
const databaseHandler = require('./databaseHandler');
const { exec } = require('child_process');
const config = require('../config.json');
// Fonction simple pour remplacer boxen
function createBox(content, options = {}) {
    const borderColor = options.borderColor || 'white';
    const width = options.width || 60;
    
    // Créer la bordure supérieure
    const topBorder = '┌' + '─'.repeat(width - 2) + '┐';
    // Créer la bordure inférieure
    const bottomBorder = '└' + '─'.repeat(width - 2) + '┘';
    
    // Diviser le contenu en lignes
    const lines = content.split('\n');
    
    // Formater chaque ligne avec des bordures
    const formattedLines = lines.map(line => {
        // Ajuster la longueur de la ligne pour qu'elle corresponde à la largeur
        const paddedLine = line.padEnd(width - 4);
        return '│ ' + paddedLine + ' │';
    });
    
    // Assembler la boîte
    return [
        colors[borderColor](topBorder),
        ...formattedLines.map(line => colors[borderColor](line)),
        colors[borderColor](bottomBorder)
    ].join('\n');
}
const os = require('os');

// Instance readline pour l'interface interactive
let rl;

// Référence au client Discord
let clientRef;

/**
 * Initialise la console interactive
 * @param {Client} client - Instance du client Discord
 */
function initConsole(client) {
    clientRef = client;
    
    // Configuration de l'interface readline
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: colors.cyan('Console > ')
    });
    
    // Afficher le panneau de bienvenue
    displayWelcomePanel();
    
    // Définir le gestionnaire pour les commandes de console
    rl.on('line', async (input) => {
        const command = input.trim();
        
        if (command) {
            await processCommand(command);
        }
        
        rl.prompt();
    });
    
    // Afficher le prompt
    rl.prompt();
    
    // Programmer la mise à jour régulière du panneau d'uptime
    scheduleUptimeUpdates();
}

/**
 * Affiche le panneau de bienvenue
 */
function displayWelcomePanel() {
    logHandler.clearConsole();
    
    const botName = config.bot.name;
    const botVersion = "1.0.0";
    
    const welcomeBox = createBox(
        colors.cyan.bold(`Bienvenue sur la console de ${botName} v${botVersion}`) + '\n\n' +
        colors.white('Tapez ') + colors.yellow('help') + colors.white(' pour afficher la liste des commandes disponibles'),
        {
            borderColor: 'cyan',
            width: 70
        }
    );
    
    console.log(welcomeBox);
    displayCommandsPanel();
}

/**
 * Affiche le panneau des commandes disponibles
 */
function displayCommandsPanel() {
    const commandsBox = createBox(
        colors.yellow.bold('Commandes disponibles:') + '\n\n' +
        colors.white('help') + ' - ' + colors.gray('Affiche cette aide') + '\n' +
        colors.white('clear') + ' - ' + colors.gray('Efface la console') + '\n' +
        colors.white('stats') + ' - ' + colors.gray('Affiche les statistiques du bot') + '\n' +
        colors.white('uptime') + ' - ' + colors.gray('Affiche le temps de fonctionnement du bot') + '\n' +
        colors.white('reload') + ' - ' + colors.gray('Recharge les commandes') + '\n' +
        colors.white('restart') + ' - ' + colors.gray('Redémarre le bot (peut ne pas fonctionner)') + '\n' +
        colors.white('exit') + ' - ' + colors.gray('Arrête proprement le bot'),
        {
            borderColor: 'yellow',
            width: 70
        }
    );
    
    console.log(commandsBox);
}

/**
 * Traite une commande de console
 * @param {string} command - Commande à traiter
 */
async function processCommand(command) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
        case 'help':
            displayCommandsPanel();
            break;
            
        case 'clear':
            logHandler.clearConsole();
            displayWelcomePanel();
            break;
            
        case 'stats':
            displayStats();
            break;
            
        case 'uptime':
            displayUptime();
            break;
            
        case 'reload':
            reloadCommands();
            break;
            
        case 'restart':
            restartBot();
            break;
            
        case 'exit':
            await exitBot();
            break;
            
        default:
            console.log(colors.red(`Commande inconnue: ${command}`));
            console.log(colors.yellow('Tapez "help" pour voir les commandes disponibles'));
    }
}

/**
 * Affiche les statistiques du bot
 */
function displayStats() {
    // Mettre à jour les statistiques
    clientRef.updateStats();
    
    const statsBox = createBox(
        colors.cyan.bold('Statistiques du Bot') + '\n\n' +
        colors.white('Serveurs: ') + colors.green(clientRef.stats.guildCount) + '\n' +
        colors.white('Utilisateurs: ') + colors.green(clientRef.stats.userCount) + '\n' +
        colors.white('Commandes utilisées: ') + colors.green(clientRef.stats.commandsUsed) + '\n' +
        colors.white('Messages reçus: ') + colors.green(clientRef.stats.messagesReceived) + '\n' +
        colors.white('Temps d\'activité: ') + colors.green(clientRef.getUptime()) + '\n\n' +
        colors.white('Utilisation mémoire: ') + colors.yellow(Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB') + '\n' +
        colors.white('CPU: ') + colors.yellow(os.loadavg()[0].toFixed(2) + '%') + '\n' +
        colors.white('Platform: ') + colors.yellow(os.platform() + ' ' + os.arch()),
        {
            borderColor: 'cyan',
            width: 70
        }
    );
    
    console.log(statsBox);
}

/**
 * Affiche le temps d'activité du bot
 */
function displayUptime() {
    const uptimeBox = createBox(
        colors.green.bold('Uptime du Bot') + '\n\n' +
        colors.white('En ligne depuis: ') + colors.green(clientRef.getUptime()),
        {
            borderColor: 'green',
            width: 60
        }
    );
    
    console.log(uptimeBox);
}

/**
 * Recharge toutes les commandes
 */
function reloadCommands() {
    console.log(colors.yellow('Rechargement des commandes...'));
    
    try {
        // Vider la collection des commandes
        clientRef.commands.clear();
        clientRef.aliases.clear();
        
        // Recharger les commandes
        commandHandler.init(clientRef);
        
        console.log(colors.green('Commandes rechargées avec succès !'));
    } catch (error) {
        console.log(colors.red(`Erreur lors du rechargement des commandes: ${error.message}`));
    }
}

/**
 * Tente de redémarrer le bot
 */
function restartBot() {
    console.log(colors.yellow('Tentative de redémarrage du bot...'));
    
    exec('npm restart', (error, stdout, stderr) => {
        if (error) {
            console.log(colors.red(`Erreur lors du redémarrage: ${error.message}`));
            console.log(colors.red('Le redémarrage automatique n\'est peut-être pas configuré.'));
            return;
        }
        
        console.log(colors.green('Bot redémarré avec succès !'));
    });
}

/**
 * Quitte proprement le bot
 */
async function exitBot() {
    console.log(colors.yellow('Arrêt du bot en cours...'));
    
    try {
        // Déconnexion de la base de données
        await databaseHandler.disconnect();
        
        // Déconnexion du client Discord
        clientRef.destroy();
        
        console.log(colors.green('Bot arrêté avec succès !'));
        
        // Fermeture de l'interface readline
        rl.close();
        
        // Sortie du processus
        process.exit(0);
    } catch (error) {
        console.log(colors.red(`Erreur lors de l'arrêt du bot: ${error.message}`));
        process.exit(1);
    }
}

/**
 * Programme la mise à jour régulière du panneau d'uptime
 */
function scheduleUptimeUpdates() {
    // Intervalle défini dans la configuration
    const interval = config.console.updateInterval; // 15 minutes en millisecondes
    
    setInterval(() => {
        logHandler.clearConsole();
        displayWelcomePanel();
        displayUptime();
        rl.prompt();
    }, interval);
}

module.exports = {
    initConsole
};