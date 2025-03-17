/**
 * Commande owners
 * Gère les propriétaires du bot (lister, ajouter, supprimer)
 * Seuls les développeurs peuvent modifier la liste des propriétaires
 */

const { EmbedBuilder } = require('discord.js');
const logHandler = require('../../handlers/logHandler');

module.exports = {
    name: 'owners',
    description: 'Gère les propriétaires du bot',
    category: 'Administration',
    usage: 'owners [list/add/del] [userID]',
    examples: [
        'owners list', 
        'owners add 123456789012345678', 
        'owners del 123456789012345678'
    ],
    aliases: ['owner'],
    cooldown: 5,
    developerOnly: true, // Seuls les développeurs peuvent utiliser cette commande

    /**
     * Exécute la commande owners
     * @param {Client} client - Instance du client Discord
     * @param {Message} message - Message de l'utilisateur
     * @param {Array} args - Arguments de la commande
     */
    async run(client, message, args) {
        try {
            // Message de chargement
            const loadingEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setDescription("⌛ **Traitement de la demande en cours...**");
                
            const loadingMsg = await message.reply({ embeds: [loadingEmbed] });
            
            const Bot = require('../../models/Bot');
            const botConfig = await Bot.findOne();
            
            if (!botConfig) {
                return loadingMsg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#e74c3c")
                            .setTitle("❌ Erreur")
                            .setDescription("Configuration du bot introuvable dans la base de données.")
                            .setFooter({ 
                                text: client.config.embed.footer,
                                iconURL: client.user.displayAvatarURL()
                            })
                    ]
                });
            }
            
            // Si aucun argument n'est fourni, afficher la liste des propriétaires
            if (!args[0] || args[0].toLowerCase() === 'list') {
                return listOwners(client, message, botConfig, loadingMsg);
            }
            
            // Si l'action est "add" ou "del", vérifier qu'un ID est fourni
            if ((args[0].toLowerCase() === 'add' || args[0].toLowerCase() === 'del') && !args[1]) {
                return loadingMsg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#e67e22")
                            .setTitle("⚠️ Paramètre manquant")
                            .setDescription(`Veuillez fournir l'ID de l'utilisateur à ${args[0].toLowerCase() === 'add' ? 'ajouter' : 'supprimer'}.\n\nUtilisation: \`${client.config.bot.mainPrefix}owners ${args[0]} <userID>\``)
                            .setFooter({ 
                                text: client.config.embed.footer,
                                iconURL: client.user.displayAvatarURL()
                            })
                    ]
                });
            }
            
            // Traiter l'action demandée
            switch (args[0].toLowerCase()) {
                case 'add':
                    return addOwner(client, message, args[1], botConfig, loadingMsg);
                case 'del':
                case 'delete':
                case 'remove':
                    return removeOwner(client, message, args[1], botConfig, loadingMsg);
                default:
                    return loadingMsg.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#e67e22")
                                .setTitle("⚠️ Action inconnue")
                                .setDescription("Action invalide. Utilisez `list`, `add` ou `del`.")
                                .addFields({
                                    name: "📋 Exemples d'utilisation",
                                    value: `\`${client.config.bot.mainPrefix}owners list\` - Afficher la liste des propriétaires\n\`${client.config.bot.mainPrefix}owners add <ID>\` - Ajouter un propriétaire\n\`${client.config.bot.mainPrefix}owners del <ID>\` - Supprimer un propriétaire`
                                })
                                .setFooter({ 
                                    text: client.config.embed.footer,
                                    iconURL: client.user.displayAvatarURL()
                                })
                        ]
                    });
            }
            
        } catch (error) {
            logHandler.log('error', 'Commande Owners', `Erreur: ${error.message}`);
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#e74c3c")
                        .setTitle("❌ Erreur")
                        .setDescription("Une erreur est survenue lors de l'exécution de cette commande.")
                        .setFooter({ 
                            text: client.config.embed.footer,
                            iconURL: client.user.displayAvatarURL()
                        })
                ]
            });
        }
    }
};

/**
 * Affiche la liste des propriétaires
 * @param {Client} client - Instance du client Discord
 * @param {Message} message - Message de l'utilisateur
 * @param {Object} botConfig - Configuration du bot depuis la base de données
 * @param {Message} loadingMsg - Message de chargement à éditer
 */
async function listOwners(client, message, botConfig, loadingMsg) {
    try {
        const owners = botConfig.owners || [];
        
        // Créer la liste des propriétaires avec leurs noms si possible
        let ownersList = '';
        let ownersCount = 0;
        
        for (const ownerId of owners) {
            let ownerInfo = '';
            
            try {
                // Tenter de récupérer l'utilisateur
                const user = await client.users.fetch(ownerId);
                ownerInfo = `• <@${ownerId}> (${ownerId})\n`;
                ownersCount++;
            } catch (error) {
                // Si l'utilisateur n'est pas trouvable, afficher l'ID uniquement
                ownerInfo = `• ID Inconnu <@${ownerId}> (${ownerId})\n`;
                ownersCount++;
            }
            
            ownersList += ownerInfo;
        }
        
        // Si aucun propriétaire n'est trouvé
        if (!ownersList) {
            ownersList = 'Aucun propriétaire défini.';
        }
        
        // Créer l'embed
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${client.config.bot.name} - Gestion des propriétaires`,
                iconURL: client.user.displayAvatarURL()
            })
            .setColor(client.config.embed.color)
            .setTitle(`👑 Propriétaires du Bot (${ownersCount})`)
            .setDescription(ownersList)
            .addFields({
                name: "ℹ️ Information",
                value: "Les propriétaires ont un accès complet aux commandes du bot, même sans permissions sur le serveur."
            })
            .setFooter({ 
                text: `${message.author.tag} | ${client.config.embed.footer}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();
        
        // Envoyer l'embed
        await loadingMsg.edit({ embeds: [embed] });
        
    } catch (error) {
        throw error;
    }
}

/**
 * Ajoute un propriétaire
 * @param {Client} client - Instance du client Discord
 * @param {Message} message - Message de l'utilisateur
 * @param {string} userId - ID de l'utilisateur à ajouter
 * @param {Object} botConfig - Configuration du bot depuis la base de données
 * @param {Message} loadingMsg - Message de chargement à éditer
 */
async function addOwner(client, message, userId, botConfig, loadingMsg) {
    try {
        // Vérifier si l'ID est valide
        let targetUser;
        try {
            targetUser = await client.users.fetch(userId);
        } catch (error) {
            return loadingMsg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#e74c3c")
                        .setTitle("❌ Utilisateur introuvable")
                        .setDescription("ID utilisateur invalide. Veuillez fournir un ID valide.")
                        .setFooter({ 
                            text: client.config.embed.footer,
                            iconURL: client.user.displayAvatarURL()
                        })
                ]
            });
        }
        
        // Vérifier si l'utilisateur est déjà propriétaire
        if (botConfig.owners.includes(userId)) {
            return loadingMsg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#e67e22")
                        .setTitle("⚠️ Déjà propriétaire")
                        .setDescription(`**${targetUser.tag}** est déjà propriétaire du bot.`)
                        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                        .setFooter({ 
                            text: client.config.embed.footer,
                            iconURL: client.user.displayAvatarURL()
                        })
                ]
            });
        }
        
        // Ajouter l'utilisateur à la liste des propriétaires
        botConfig.owners.push(userId);
        await botConfig.save();
        
        // Mettre à jour la liste des propriétaires dans le client
        client.config.owners = botConfig.owners;
        
        // Logger l'action
        logHandler.log('info', 'Commande Owners', `${message.author.tag} a ajouté ${targetUser.tag} (${userId}) comme propriétaire`);
        
        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setColor("#2ecc71")
            .setAuthor({
                name: `${client.config.bot.name} - Gestion des propriétaires`,
                iconURL: client.user.displayAvatarURL()
            })
            .setTitle("✅ Propriétaire ajouté")
            .setDescription(`L'utilisateur **${targetUser.tag}** a été ajouté aux propriétaires du bot.`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "👤 Utilisateur", value: `${targetUser.tag} (${userId})`, inline: true },
                { name: "👮 Ajouté par", value: `${message.author.tag}`, inline: true }
            )
            .setFooter({ 
                text: `${message.author.tag} | ${client.config.embed.footer}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();
        
        // Envoyer l'embed
        await loadingMsg.edit({ embeds: [embed] });
        
    } catch (error) {
        throw error;
    }
}

/**
 * Supprime un propriétaire
 * @param {Client} client - Instance du client Discord
 * @param {Message} message - Message de l'utilisateur
 * @param {string} userId - ID de l'utilisateur à supprimer
 * @param {Object} botConfig - Configuration du bot depuis la base de données
 * @param {Message} loadingMsg - Message de chargement à éditer
 */
async function removeOwner(client, message, userId, botConfig, loadingMsg) {
    try {
        // Vérifier si l'utilisateur est dans la liste des propriétaires
        if (!botConfig.owners.includes(userId)) {
            return loadingMsg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#e74c3c")
                        .setTitle("❌ Non propriétaire")
                        .setDescription("Cet utilisateur n'est pas propriétaire du bot.")
                        .setFooter({ 
                            text: client.config.embed.footer,
                            iconURL: client.user.displayAvatarURL()
                        })
                ]
            });
        }
        
        // Récupérer les informations de l'utilisateur si possible
        let targetUser;
        try {
            targetUser = await client.users.fetch(userId);
        } catch (error) {
            // Continuer même si l'utilisateur n'est pas trouvable
            targetUser = { tag: 'Utilisateur inconnu', displayAvatarURL: () => null };
        }
        
        // Supprimer l'utilisateur de la liste des propriétaires
        botConfig.owners = botConfig.owners.filter(id => id !== userId);
        await botConfig.save();
        
        // Mettre à jour la liste des propriétaires dans le client
        client.config.owners = botConfig.owners;
        
        // Logger l'action
        logHandler.log('info', 'Commande Owners', `${message.author.tag} a supprimé ${targetUser.tag || userId} des propriétaires`);
        
        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setColor("#3498db")
            .setAuthor({
                name: `${client.config.bot.name} - Gestion des propriétaires`,
                iconURL: client.user.displayAvatarURL()
            })
            .setTitle("🔄 Propriétaire supprimé")
            .setDescription(`L'utilisateur **${targetUser.tag || userId}** a été supprimé des propriétaires du bot.`)
            .addFields(
                { name: "👤 Utilisateur", value: `${targetUser.tag || 'Inconnu'} (${userId})`, inline: true },
                { name: "👮 Supprimé par", value: `${message.author.tag}`, inline: true }
            )
            .setFooter({ 
                text: `${message.author.tag} | ${client.config.embed.footer}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();
        
        // Ajouter la miniature si disponible
        if (targetUser.displayAvatarURL) {
            embed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
        }
        
        // Envoyer l'embed
        await loadingMsg.edit({ embeds: [embed] });
        
    } catch (error) {
        throw error;
    }
}