/**
 * Configuration et extension du client Discord
 * Ce fichier étend le client Discord.js avec des fonctionnalités personnalisées
 */

// Importation des modules nécessaires
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const logHandler = require('./handlers/logHandler');
const config = require('./config.json');

// Définition des intents nécessaires pour le bot
const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions
];

// Définition des partials pour traiter les événements partiels
const partials = [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember
];

/**
 * Extension du client Discord.js avec des fonctionnalités supplémentaires
 */
class ExtendedClient extends Client {
    constructor() {
        // Initialisation du client avec les options nécessaires
        super({
            intents: intents,
            partials: partials,
            allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
        });
        
        // Création des collections pour stocker les commandes et les cooldowns
        this.commands = new Collection();
        this.aliases = new Collection();
        this.cooldowns = new Collection();
        
        // Configuration du client
        this.config = config;
        
        // Statistiques du bot
        this.stats = {
            commandsUsed: 0,
            messagesReceived: 0,
            uptime: 0,
            guildCount: 0,
            userCount: 0
        };
        
        // Initialisation du gestionnaire de commandes et d'événements
        this.loadHandlers();
        
        // Timestamp de démarrage
        this.startTimestamp = Date.now();
    }
    
    /**
     * Charge tous les gestionnaires (handlers) nécessaires
     */
    loadHandlers() {
        try {
            // Chargement du gestionnaire de commandes
            commandHandler.init(this);
            
            // Chargement du gestionnaire d'événements
            eventHandler.init(this);
            
            logHandler.log('info', 'Client', 'Handlers chargés avec succès');
        } catch (error) {
            logHandler.log('error', 'Client', `Erreur lors du chargement des handlers: ${error.message}`);
        }
    }
    
    /**
     * Vérifie si un utilisateur est développeur du bot
     * @param {string} userId - ID de l'utilisateur à vérifier
     * @returns {boolean} - True si l'utilisateur est développeur, false sinon
     */
    isDeveloper(userId) {
        return this.config.developers.includes(userId);
    }
    
    /**
     * Vérifie si un utilisateur est propriétaire du bot
     * @param {string} userId - ID de l'utilisateur à vérifier
     * @returns {boolean} - True si l'utilisateur est propriétaire, false sinon
     */
    isOwner(userId) {
        return this.config.owners.includes(userId);
    }
    
    /**
     * Obtient le préfixe du bot pour un serveur spécifique
     * @param {string} guildId - ID du serveur
     * @returns {Promise<string>} - Le préfixe du serveur ou le préfixe par défaut
     */
    async getPrefix(guildId) {
        try {
            const Guild = require('./models/Guild');
            const guildData = await Guild.findOne({ guildId: guildId });
            
            if (guildData && guildData.prefix) {
                return guildData.prefix;
            }
            
            return this.config.bot.mainPrefix;
        } catch (error) {
            logHandler.log('error', 'Client', `Erreur lors de la récupération du préfixe: ${error.message}`);
            return this.config.bot.mainPrefix;
        }
    }
    
    /**
     * Calcule le temps d'activité du bot
     * @returns {string} - Temps d'activité formaté
     */
    getUptime() {
        const uptime = Date.now() - this.startTimestamp;
        const seconds = Math.floor(uptime / 1000) % 60;
        const minutes = Math.floor(uptime / (1000 * 60)) % 60;
        const hours = Math.floor(uptime / (1000 * 60 * 60)) % 24;
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        
        return `${days}j ${hours}h ${minutes}m ${seconds}s`;
    }
    
    /**
     * Mise à jour des statistiques du bot
     */
    updateStats() {
        this.stats.uptime = this.getUptime();
        this.stats.guildCount = this.guilds.cache.size;
        this.stats.userCount = this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    }
}

module.exports = { Client: ExtendedClient };