/**
 * Événement messageCreate
 * Se déclenche à chaque message reçu par le bot
 */

const { Collection } = require('discord.js');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const logHandler = require('../handlers/logHandler');
const databaseHandler = require('../handlers/databaseHandler');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(client, message) {
        try {
            // Ignorer les messages des bots ou webhooks
            if (message.author.bot || message.webhookId) return;

            // Incrémenter le compteur de messages
            client.stats.messagesReceived++;

            // Récupérer le préfixe du serveur
            const prefix = await client.getPrefix(message.guild?.id);

            // Vérifier si le message commence par le préfixe ou mentionne le bot
            const mentionRegex = new RegExp(`^<@!?${client.user.id}>\\s*`);

            let usedPrefix = '';

            if (message.content.startsWith(prefix)) {
                usedPrefix = prefix;
            } else if (mentionRegex.test(message.content)) {
                usedPrefix = message.content.match(mentionRegex)[0];
            } else {
                // Ce n'est pas une commande, ignorer
                return;
            }

            // Extraire les arguments et le nom de la commande
            const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Si le message ne contient que la mention du bot, envoyer une aide rapide
            if (!commandName && usedPrefix.includes(`<@!?${client.user.id}>`)) {
                return sendQuickHelp(client, message);
            }

            // Rechercher la commande
            const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));

            // Si la commande n'existe pas, ignorer
            if (!command) return;

            // Vérifier si la commande est désactivée
            if (command.disabled) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription('🚫 Cette commande est actuellement désactivée.')
                    ]
                });
            }

            // Vérifier si la commande est réservée aux développeurs
            if (command.developerOnly && !client.isDeveloper(message.author.id)) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription('⛔ Cette commande est réservée aux développeurs du bot.')
                    ]
                });
            }

            // Vérifier si la commande est réservée aux propriétaires
            if (command.ownerOnly && !client.isOwner(message.author.id)) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription('⛔ Cette commande est réservée aux propriétaires du bot.')
                    ]
                });
            }

            // Vérifier si la commande est utilisable uniquement dans un serveur
            if (command.guildOnly && !message.guild) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription('❌ Cette commande ne peut être utilisée que dans un serveur.')
                    ]
                });
            }

            // Vérifier si la commande est utilisable uniquement en messages privés
            if (command.dmOnly && message.guild) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setDescription('❌ Cette commande ne peut être utilisée qu\'en message privé.')
                    ]
                });
            }

            // Vérifier les permissions nécessaires pour l'utilisateur
            if (message.guild && command.userPermissions && command.userPermissions.length > 0) {
                // Ignorer la vérification si l'utilisateur est développeur ou propriétaire
                if (!client.isDeveloper(message.author.id) && !client.isOwner(message.author.id)) {
                    const missingPermissions = command.userPermissions.filter(perm =>
                        !message.member.permissions.has(PermissionsBitField.Flags[perm])
                    );

                    if (missingPermissions.length > 0) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.config.embed.color)
                                    .setDescription(`❌ Vous avez besoin des permissions suivantes pour utiliser cette commande : \`${missingPermissions.join(', ')}\``)
                            ]
                        });
                    }
                }
            }

            // Vérifier les permissions nécessaires pour le bot
            if (message.guild && command.botPermissions && command.botPermissions.length > 0) {
                const me = message.guild.members.cache.get(client.user.id);
                const missingPermissions = command.botPermissions.filter(perm =>
                    !me.permissions.has(PermissionsBitField.Flags[perm])
                );

                if (missingPermissions.length > 0) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.embed.color)
                                .setDescription(`❌ J'ai besoin des permissions suivantes pour exécuter cette commande : \`${missingPermissions.join(', ')}\``)
                        ]
                    });
                }
            }

            // Vérifier le cooldown
            if (command.cooldown) {
                if (!client.cooldowns.has(command.name)) {
                    client.cooldowns.set(command.name, new Collection());
                }

                const now = Date.now();
                const timestamps = client.cooldowns.get(command.name);
                const cooldownAmount = command.cooldown * 1000;

                if (timestamps.has(message.author.id)) {
                    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000;

                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.config.embed.color)
                                    .setDescription(`⏱️ Veuillez attendre \`${timeLeft.toFixed(1)}\` secondes avant de réutiliser la commande \`${command.name}\`.`)
                            ]
                        });
                    }
                }

                timestamps.set(message.author.id, now);
                setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
            }

            // Exécuter la commande
            try {
                await command.run(client, message, args);

                // Incrémenter le compteur de commandes utilisées
                client.stats.commandsUsed++;

                // Logger l'utilisation de la commande
                logHandler.log('info', 'Commandes', `${message.author.tag} a utilisé la commande ${command.name} dans ${message.guild ? message.guild.name : 'MP'}`);
            } catch (error) {
                logHandler.log('error', 'Commandes', `Erreur lors de l'exécution de la commande ${command.name}: ${error.message}`);

                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embed.color)
                            .setTitle(client.config.messages.error.title)
                            .setDescription(client.config.messages.error.description)
                    ]
                }).catch(err => {
                    logHandler.log('error', 'Commandes', `Impossible de répondre à l'utilisateur: ${err.message}`);
                });
            }
        } catch (error) {
            logHandler.log('error', 'MessageCreate Event', `Erreur lors du traitement du message: ${error.message}`);
        }
    }
};

/**
 * Envoie une aide rapide lorsque le bot est mentionné
 * @param {Client} client - Instance du client Discord
 * @param {Message} message - Message de l'utilisateur
 */
async function sendQuickHelp(client, message) {
    try {
        const prefix = await client.getPrefix(message.guild?.id);

        const embed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setTitle(`Salut ${message.author.username} !`)
            .setDescription(`Mon préfixe sur ce serveur est \`${prefix}\`\nUtilisez \`${prefix}help\` pour voir mes commandes.`)
            .setFooter({ text: client.config.embed.footer });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        logHandler.log('error', 'MessageCreate Event', `Erreur lors de l'envoi de l'aide rapide: ${error.message}`);
    }
}