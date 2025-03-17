/**
 * Gestionnaire de base de données MongoDB
 * Gère la connexion et les opérations avec la base de données
 */

const mongoose = require('mongoose');
const logHandler = require('./logHandler');
const crypto = require('crypto');

// Variable pour stocker la connexion à la base de données
let connection = null;

/**
 * Se connecte à la base de données MongoDB
 * @returns {Promise<mongoose.Connection>} - La connexion à la base de données
 */
async function connect() {
    try {
        if (connection) {
            return connection;
        }
        
        // Configuration des options de connexion
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };
        
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI, options);
        connection = mongoose.connection;
        
        // Événements de connexion
        connection.on('connected', () => {
            logHandler.log('info', 'Base de données', 'Connecté à MongoDB');
        });
        
        connection.on('error', (err) => {
            logHandler.log('error', 'Base de données', `Erreur de connexion MongoDB: ${err.message}`);
        });
        
        connection.on('disconnected', () => {
            logHandler.log('info', 'Base de données', 'Déconnecté de MongoDB');
            connection = null;
        });
        
        // Initialiser les modèles et données par défaut
        await initializeModels();
        
        return connection;
    } catch (error) {
        logHandler.log('error', 'Base de données', `Erreur lors de la connexion à MongoDB: ${error.message}`);
        throw error;
    }
}

/**
 * Se déconnecte de la base de données MongoDB
 * @returns {Promise<void>}
 */
async function disconnect() {
    try {
        if (connection) {
            await mongoose.disconnect();
            connection = null;
            logHandler.log('info', 'Base de données', 'Déconnexion de MongoDB réussie');
        }
    } catch (error) {
        logHandler.log('error', 'Base de données', `Erreur lors de la déconnexion de MongoDB: ${error.message}`);
        throw error;
    }
}

/**
 * Initialise les modèles et les données par défaut
 * @returns {Promise<void>}
 */
async function initializeModels() {
    try {
        const Bot = require('../models/Bot');
        const botCount = await Bot.countDocuments();
        
        // Si aucune configuration du bot n'existe, en créer une
        if (botCount === 0) {
            // Hacher le token pour le stockage sécurisé
            const hashedToken = hashToken(process.env.TOKEN);
            
            const config = require('../config.json');
            
            const newBot = new Bot({
                token: hashedToken,
                prefix: config.bot.mainPrefix,
                name: config.bot.name,
                developers: config.developers,
                owners: config.owners
            });
            
            await newBot.save();
            logHandler.log('info', 'Base de données', 'Configuration initiale du bot créée');
        }
    } catch (error) {
        logHandler.log('error', 'Base de données', `Erreur lors de l'initialisation des modèles: ${error.message}`);
    }
}

/**
 * Hache un token pour un stockage sécurisé
 * @param {string} token - Token à hacher
 * @returns {string} - Token haché
 */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Vérifie si un token correspond au token haché stocké
 * @param {string} inputToken - Token à vérifier
 * @returns {Promise<boolean>} - True si le token est valide, false sinon
 */
async function verifyToken(inputToken) {
    try {
        const Bot = require('../models/Bot');
        const botConfig = await Bot.findOne();
        
        if (!botConfig) {
            return false;
        }
        
        const hashedInput = hashToken(inputToken);
        return hashedInput === botConfig.token;
    } catch (error) {
        logHandler.log('error', 'Base de données', `Erreur lors de la vérification du token: ${error.message}`);
        return false;
    }
}

/**
 * Met à jour les informations du serveur dans la base de données
 * @param {Guild} guild - Objet guild Discord
 * @returns {Promise<void>}
 */
async function updateGuildInfo(guild) {
    try {
        const Guild = require('../models/Guild');
        
        // Rechercher ou créer une entrée pour ce serveur
        let guildData = await Guild.findOne({ guildId: guild.id });
        
        if (!guildData) {
            guildData = new Guild({ guildId: guild.id });
        }
        
        // Mettre à jour les informations
        guildData.name = guild.name;
        guildData.memberCount = guild.memberCount;
        guildData.botCount = guild.members.cache.filter(member => member.user.bot).size;
        guildData.channelCount = guild.channels.cache.size;
        guildData.roleCount = guild.roles.cache.size;
        
        // Owner du serveur
        if (guild.ownerId) {
            guildData.ownerId = guild.ownerId;
        }
        
        // Position et nom du bot sur le serveur
        const botMember = guild.members.cache.get(guild.client.user.id);
        if (botMember) {
            guildData.botNickname = botMember.nickname || guild.client.user.username;
            
            // Calculer la position du bot (basée sur le rôle le plus élevé)
            const botHighestRole = botMember.roles.highest;
            guildData.botPosition = botHighestRole ? botHighestRole.position : 0;
        }
        
        await guildData.save();
    } catch (error) {
        logHandler.log('error', 'Base de données', `Erreur lors de la mise à jour des informations du serveur: ${error.message}`);
    }
}

/**
 * Change le préfixe d'un serveur
 * @param {string} guildId - ID du serveur
 * @param {string} newPrefix - Nouveau préfixe
 * @returns {Promise<boolean>} - True si le préfixe a été changé, false sinon
 */
async function changeGuildPrefix(guildId, newPrefix) {
    try {
        const Guild = require('../models/Guild');
        
        // Rechercher ou créer une entrée pour ce serveur
        let guildData = await Guild.findOne({ guildId: guildId });
        
        if (!guildData) {
            guildData = new Guild({ guildId: guildId });
        }
        
        // Mettre à jour le préfixe
        guildData.prefix = newPrefix;
        await guildData.save();
        
        return true;
    } catch (error) {
        logHandler.log('error', 'Base de données', `Erreur lors du changement de préfixe: ${error.message}`);
        return false;
    }
}

module.exports = {
    connect,
    disconnect,
    updateGuildInfo,
    changeGuildPrefix,
    verifyToken
};