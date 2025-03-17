/**
 * Modèle de données pour la configuration du bot
 * Stocke les informations globales du bot
 */

const mongoose = require('mongoose');

const BotSchema = new mongoose.Schema({
    // Token haché (pour des raisons de sécurité)
    token: {
        type: String,
        required: true
    },
    
    // Préfixe global par défaut
    prefix: {
        type: String,
        default: '+'
    },
    
    // Nom du bot
    name: {
        type: String,
        required: true
    },
    
    // Liste des développeurs du bot (accès total)
    developers: {
        type: [String],
        default: []
    },
    
    // Liste des propriétaires du bot (accès élevé)
    owners: {
        type: [String],
        default: []
    },
    
    // Configuration de présence
    presence: {
        status: {
            type: String,
            enum: ['online', 'idle', 'dnd', 'invisible'],
            default: 'online'
        },
        activity: {
            type: String,
            default: 'vous surveiller'
        },
        activityType: {
            type: Number,
            enum: [0, 1, 2, 3, 5], // 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 5 = Competing
            default: 0
        }
    },
    
    // Statistiques globales
    stats: {
        totalCommands: {
            type: Number,
            default: 0
        },
        totalMessages: {
            type: Number,
            default: 0
        },
        commandsUsed: {
            type: Map,
            of: Number,
            default: new Map()
        },
        lastRestart: {
            type: Date,
            default: Date.now
        }
    },
    
    // Liste de commandes désactivées globalement
    disabledCommands: {
        type: [String],
        default: []
    },
    
    // Configuration de la console
    console: {
        logLevel: {
            type: String,
            enum: ['debug', 'info', 'warning', 'error'],
            default: 'info'
        },
        updateInterval: {
            type: Number,
            default: 900000 // 15 minutes en millisecondes
        }
    },
    
    // Configuration des backups
    backup: {
        enabled: {
            type: Boolean,
            default: false
        },
        interval: {
            type: Number,
            default: 86400000 // 24 heures en millisecondes
        },
        maxBackups: {
            type: Number,
            default: 7
        }
    },
    
    // Configuration des embeds par défaut
    embed: {
        color: {
            type: String,
            default: '#3498db'
        },
        footer: {
            type: String,
            default: 'Powered by MonBot'
        },
        thumbnail: {
            type: String,
            default: ''
        }
    },
    
    // Maintenance du bot
    maintenance: {
        enabled: {
            type: Boolean,
            default: false
        },
        message: {
            type: String,
            default: 'Le bot est actuellement en maintenance. Veuillez réessayer plus tard.'
        }
    },
    
    // Date de création et de dernière modification
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware pour mettre à jour la date de dernière modification
BotSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Méthode pour incrémenter l'utilisation d'une commande
BotSchema.methods.incrementCommandUsage = async function(commandName) {
    const currentCount = this.stats.commandsUsed.get(commandName) || 0;
    this.stats.commandsUsed.set(commandName, currentCount + 1);
    this.stats.totalCommands += 1;
    return this.save();
};

// Méthode pour vérifier si une commande est désactivée
BotSchema.methods.isCommandDisabled = function(commandName) {
    return this.disabledCommands.includes(commandName);
};

// Méthode pour vérifier si un utilisateur est développeur
BotSchema.methods.isDeveloper = function(userId) {
    return this.developers.includes(userId);
};

// Méthode pour vérifier si un utilisateur est propriétaire
BotSchema.methods.isOwner = function(userId) {
    return this.owners.includes(userId);
};

module.exports = mongoose.model('Bot', BotSchema);