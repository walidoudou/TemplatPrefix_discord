/**
 * Commande prefix
 * Permet de visualiser ou modifier le préfixe du bot sur un serveur
 */

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const databaseHandler = require('../../handlers/databaseHandler');
const logHandler = require('../../handlers/logHandler');

module.exports = {
    name: 'prefix',
    description: 'Affiche ou modifie le préfixe du bot',
    category: 'Configuration',
    usage: 'prefix [nouveau préfixe]',
    examples: ['prefix', 'prefix !', 'prefix ?'],
    aliases: ['setprefix', 'changeprefix'],
    cooldown: 10,
    guildOnly: true, // Cette commande ne peut être utilisée que dans un serveur
    userPermissions: ['Administrator'], // Nécessite la permission Administrateur

    /**
     * Exécute la commande prefix
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

            // Si un développeur ou propriétaire utilise la commande, ignorer la vérification des permissions
            const bypassPermissions = client.isDeveloper(message.author.id) || client.isOwner(message.author.id);

            // Vérifier les permissions si l'utilisateur n'est pas un développeur ou propriétaire
            if (!bypassPermissions && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return loadingMsg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#e74c3c")
                            .setTitle("❌ Permissions insuffisantes")
                            .setDescription("Vous devez être administrateur pour utiliser cette commande.")
                            .setFooter({
                                text: client.config.embed.footer,
                                iconURL: client.user.displayAvatarURL()
                            })
                    ]
                });
            }

            // Récupérer le préfixe actuel
            const currentPrefix = await client.getPrefix(message.guild.id);

            // Si aucun argument n'est fourni, afficher le préfixe actuel
            if (!args[0]) {
                return loadingMsg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setAuthor({
                                name: `${message.guild.name} - Configuration du préfixe`,
                                iconURL: message.guild.iconURL({ dynamic: true })
                            })
                            .setTitle("📋 Préfixe actuel")
                            .setDescription(`Le préfixe actuel sur ce serveur est \`${currentPrefix}\``)
                            .addFields(
                                {
                                    name: "ℹ️ Information",
                                    value: `Pour modifier le préfixe, utilisez \`${currentPrefix}prefix <nouveau préfixe>\`\nExemple: \`${currentPrefix}prefix !\``
                                },
                                {
                                    name: "📝 Exemples d'utilisation",
                                    value: `\`${currentPrefix}help\` - Afficher l'aide\n\`${currentPrefix}ping\` - Afficher la latence`
                                }
                            )
                            .setFooter({
                                text: `Demandé par ${message.author.tag} | ${client.config.embed.footer}`,
                                iconURL: message.author.displayAvatarURL({ dynamic: true })
                            })
                            .setTimestamp()
                    ]
                });
            }

            // Récupérer le nouveau préfixe
            const newPrefix = args[0];

            // Vérifier que le préfixe n'est pas trop long
            if (newPrefix.length > 5) {
                return loadingMsg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#e67e22")
                            .setTitle("⚠️ Préfixe trop long")
                            .setDescription("Le préfixe ne peut pas dépasser 5 caractères.")
                            .setFooter({
                                text: client.config.embed.footer,
                                iconURL: client.user.displayAvatarURL()
                            })
                    ]
                });
            }

            // Si le nouveau préfixe est identique à l'actuel, ne rien faire
            if (newPrefix === currentPrefix) {
                return loadingMsg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#e67e22")
                            .setTitle("⚠️ Préfixe identique")
                            .setDescription(`Le préfixe \`${newPrefix}\` est déjà défini sur ce serveur.`)
                            .setFooter({
                                text: client.config.embed.footer,
                                iconURL: client.user.displayAvatarURL()
                            })
                    ]
                });
            }

            // Modifier le préfixe dans la base de données
            const success = await databaseHandler.changeGuildPrefix(message.guild.id, newPrefix);

            if (!success) {
                return loadingMsg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#e74c3c")
                            .setTitle("❌ Erreur")
                            .setDescription("Une erreur est survenue lors de la modification du préfixe.")
                            .setFooter({
                                text: client.config.embed.footer,
                                iconURL: client.user.displayAvatarURL()
                            })
                    ]
                });
            }

            // Logger l'action
            logHandler.log('info', 'Prefix', `Préfixe modifié sur ${message.guild.name} (${message.guild.id}) de "${currentPrefix}" à "${newPrefix}" par ${message.author.tag}`);

            // Envoyer la confirmation
            return loadingMsg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#2ecc71")
                        .setAuthor({
                            name: `${message.guild.name} - Configuration du préfixe`,
                            iconURL: message.guild.iconURL({ dynamic: true })
                        })
                        .setTitle("✅ Préfixe modifié")
                        .setDescription(`Le préfixe a été changé de \`${currentPrefix}\` à \`${newPrefix}\``)
                        .addFields(
                            { name: "Ancien préfixe", value: `\`${currentPrefix}\``, inline: true },
                            { name: "Nouveau préfixe", value: `\`${newPrefix}\``, inline: true },
                            { name: "Modifié par", value: `${message.author}`, inline: true },
                            {
                                name: "📝 Exemples d'utilisation",
                                value: `\`${newPrefix}help\` - Afficher l'aide\n\`${newPrefix}ping\` - Afficher la latence`
                            }
                        )
                        .setFooter({
                            text: `${message.author.tag} | ${client.config.embed.footer}`,
                            iconURL: message.author.displayAvatarURL({ dynamic: true })
                        })
                        .setTimestamp()
                ]
            });

        } catch (error) {
            logHandler.log('error', 'Prefix', `Erreur: ${error.message}`);
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