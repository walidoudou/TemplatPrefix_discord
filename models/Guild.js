/**
 * Modèle de données pour les serveurs Discord
 * Stocke les configurations et informations spécifiques à chaque serveur
 */

const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
    // ID du serveur (clé primaire)
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    
    // Informations générales du serveur
    name: {
        type: String,
        required: false
    },
    ownerId: {
        type: String,
        required: false
    },
    
    // Préfixe personnalisé pour ce serveur
    prefix: {
        type: String,
        required: false
    },
    
    // Statistiques du serveur
    memberCount: {
        type: Number,
        default: 0
    },
    botCount: {
        type: Number,
        default: 0
    },
    channelCount: {
        type: Number,
        default: 0
    },
    roleCount: {
        type: Number,
        default: 0
    },
    
    // Informations sur le bot dans ce serveur
    botNickname: {
        type: String,
        required: false
    },
    botPosition: {
        type: Number,
        default: 0
    },
    
    // Canaux spéciaux
    welcomeChannel: {
        type: String,
        required: false
    },
    logChannel: {
        type: String,
        required: false
    },
    
    // Configurations des fonctionnalités
    features: {
        welcome: {
            enabled: {
                type: Boolean,
                default: false
            },
            message: {
                type: String,
                default: "Bienvenue {user} sur {server} !"
            }
        },
        logs: {
            enabled: {
                type: Boolean,
                default: false
            },
            events: {
                memberJoin: {
                    type: Boolean,
                    default: true
                },
                memberLeave: {
                    type: Boolean,
                    default: true
                },
                messageDelete: {
                    type: Boolean,
                    default: true
                },
                messageEdit: {
                    type: Boolean,
                    default: true
                },
                channelCreate: {
                    type: Boolean,
                    default: true
                },
                channelDelete: {
                    type: Boolean,
                    default: true
                },
                roleCreate: {
                    type: Boolean,
                    default: true
                },
                roleDelete: {
                    type: Boolean,
                    default: true
                }
            }
        },
        automod: {
            enabled: {
                type: Boolean,
                default: false
            },
            filters: {
                spam: {
                    type: Boolean,
                    default: false
                },
                invites: {
                    type: Boolean,
                    default: false
                },
                links: {
                    type: Boolean,
                    default: false
                },
                caps: {
                    type: Boolean,
                    default: false
                },
                badWords: {
                    type: Boolean,
                    default: false
                }
            },
            exempt: {
                roles: {
                    type: [String],
                    default: []
                },
                channels: {
                    type: [String],
                    default: []
                },
                users: {
                    type: [String],
                    default: []
                }
            }
        }
    },
    
    // Liste des utilisateurs avec des permissions spéciales sur le bot dans ce serveur
    specialPermissions: {
        admins: {
            type: [String],
            default: []
        },
        moderators: {
            type: [String],
            default: []
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
}, {
    // Ajouter les champs virtuals au JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware pour mettre à jour la date de dernière modification
GuildSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual pour l'URL de l'icône du serveur
GuildSchema.virtual('iconURL').get(function() {
    // Cette fonction n'est pas implémentée ici car nous n'avons pas accès à l'API Discord directement
    // Elle serait utilisée dans le code du bot pour obtenir l'URL de l'icône
    return null;
});

module.exports = mongoose.model('Guild', GuildSchema);