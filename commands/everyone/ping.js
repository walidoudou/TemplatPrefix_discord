/**
 * Commande ping
 * Permet de vérifier la latence du bot et l'état de la connexion
 */

const { EmbedBuilder, version: discordVersion } = require('discord.js');
const os = require('os');

module.exports = {
    name: 'ping',
    description: 'Affiche la latence du bot et diverses informations système',
    category: 'Utilitaires',
    usage: 'ping',
    aliases: ['latence', 'pong'],
    cooldown: 5, // Cooldown en secondes

    /**
     * Exécute la commande ping
     * @param {Client} client - Instance du client Discord
     * @param {Message} message - Message de l'utilisateur
     * @param {Array} args - Arguments de la commande
     */
    async run(client, message, args) {
        try {
            // Message initial pour mesurer la latence
            const loadingEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setDescription("🔍 **Calcul des latences en cours...**")
                .setFooter({
                    text: client.config.embed.footer,
                    iconURL: client.user.displayAvatarURL()
                });

            const initialTime = Date.now();
            const sentMessage = await message.reply({ embeds: [loadingEmbed] });

            // Calcul des différentes latences
            const botLatency = Date.now() - initialTime;
            const apiLatency = Math.round(client.ws.ping);

            // Classement des performances
            const getPerformanceInfo = (ms) => {
                if (ms < 50) {
                    return { emoji: '🟢', color: '#2ecc71', text: 'Excellente' };
                } else if (ms < 100) {
                    return { emoji: '🟡', color: '#f1c40f', text: 'Bonne' };
                } else if (ms < 200) {
                    return { emoji: '🟠', color: '#e67e22', text: 'Moyenne' };
                } else {
                    return { emoji: '🔴', color: '#e74c3c', text: 'Élevée' };
                }
            };

            const botPerformance = getPerformanceInfo(botLatency);
            const apiPerformance = getPerformanceInfo(apiLatency);

            // Informations système
            const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const cpuUsage = (os.loadavg()[0]).toFixed(2);
            const osInfo = `${os.platform()} ${os.arch()}`;

            // Mise à jour de l'embed
            const pingEmbed = new EmbedBuilder()
                .setAuthor({
                    name: 'Informations de latence',
                    iconURL: client.user.displayAvatarURL()
                })
                .setColor(apiPerformance.color)
                .setTitle(`${apiPerformance.emoji} Pong! - Latence globale: ${botLatency}ms`)
                .addFields(
                    {
                        name: "📡 Latence du bot",
                        value: `${botPerformance.emoji} **${botLatency}ms** - ${botPerformance.text}`,
                        inline: true
                    },
                    {
                        name: "⚡ Latence de l'API",
                        value: `${apiPerformance.emoji} **${apiLatency}ms** - ${apiPerformance.text}`,
                        inline: true
                    },
                    { name: '\u200B', value: '\u200B', inline: true }, // Séparateur
                    {
                        name: "⏱️ Uptime",
                        value: `\`${client.getUptime()}\``,
                        inline: true
                    },
                    {
                        name: "💾 Mémoire",
                        value: `\`${memoryUsage} MB\``,
                        inline: true
                    },
                    {
                        name: "🖥️ CPU",
                        value: `\`${cpuUsage}%\``,
                        inline: true
                    }
                )
                .setFooter({
                    text: `Discord.js v${discordVersion} | Node ${process.version} | ${osInfo}`,
                })
                .setTimestamp();

            // Mise à jour du message temporaire avec l'embed
            await sentMessage.edit({ embeds: [pingEmbed] });

        } catch (error) {
            console.error('Erreur dans la commande ping:', error);
            message.reply('Une erreur est survenue lors de l\'exécution de cette commande.');
        }
    }
};