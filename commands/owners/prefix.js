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
    aliases: ['setprefix'],
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
            // Si un développeur ou propriétaire utilise la commande, ignorer la vérification des permissions
            const bypassPermissions = client.isDeveloper(message.author.id) || client.isOwner(message.author.id);

            // Vérifier les permissions si l'utilisateur n'est pas un développeur ou propriétaire
            if (!bypassPermissions && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription('❌ Vous devez être administrateur pour utiliser cette commande.')
                    ]
                });
            }

            // Récupérer le préfixe actuel
            const currentPrefix = await client.getPrefix(message.guild.id);

            // Si aucun argument n'est fourni, afficher le préfixe actuel
            if (!args[0]) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setTitle('Préfixe actuel')
                            .setDescription(`Le préfixe actuel sur ce serveur est \`${currentPrefix}\``)
                            .setFooter({ text: `Pour le modifier, utilisez ${currentPrefix}prefix <nouveau préfixe>` })
                    ]
                });
            }

            // Récupérer le nouveau préfixe
            const newPrefix = args[0];

            // Vérifier que le préfixe n'est pas trop long
            if (newPrefix.length > 5) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription('❌ Le préfixe ne peut pas dépasser 5 caractères.')
                    ]
                });
            }

            // Si le nouveau préfixe est identique à l'actuel, ne rien faire
            if (newPrefix === currentPrefix) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription(`Le préfixe \`${newPrefix}\` est déjà défini sur ce serveur.`)
                    ]
                });
            }

            // Modifier le préfixe dans la base de données
            const success = await databaseHandler.changeGuildPrefix(message.guild.id, newPrefix);

            if (!success) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription('❌ Une erreur est survenue lors de la modification du préfixe.')
                    ]
                });
            }

            // Logger l'action
            logHandler.log('info', 'Prefix', `Préfixe modifié sur ${message.guild.name} (${message.guild.id}) de "${currentPrefix}" à "${newPrefix}" par ${message.author.tag}`);

            // Envoyer la confirmation
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embed.color)
                        .setTitle('✅ Préfixe modifié')
                        .setDescription(`Le préfixe a été changé de \`${currentPrefix}\` à \`${newPrefix}\``)
                        .setFooter({ text: client.config.embed.footer })
                ]
            });

        } catch (error) {
            logHandler.log('error', 'Prefix', `Erreur: ${error.message}`);
            message.reply('Une erreur est survenue lors de l\'exécution de cette commande.');
        }
    }
};