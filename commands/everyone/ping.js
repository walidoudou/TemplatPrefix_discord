/**
 * Commande ping
 * Permet de vérifier la latence du bot et l'état de la connexion
 */

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Affiche la latence du bot',
    category: 'Utilitaires',
    usage: 'ping',
    aliases: ['latence'],
    cooldown: 5, // Cooldown en secondes

    /**
     * Exécute la commande ping
     * @param {Client} client - Instance du client Discord
     * @param {Message} message - Message de l'utilisateur
     * @param {Array} args - Arguments de la commande
     */
    async run(client, message, args) {
        try {
            // Mesure du temps de réponse
            const initialTime = Date.now();

            // Envoi d'un message temporaire
            const sentMessage = await message.channel.send('Calcul de la latence...');

            // Calcul des différentes latences
            const botLatency = Date.now() - initialTime;
            const apiLatency = Math.round(client.ws.ping);

            // Classement des performances
            let performanceEmoji, performanceColor;

            if (apiLatency < 50) {
                performanceEmoji = '🟢';
                performanceColor = '#00FF00';
            } else if (apiLatency < 100) {
                performanceEmoji = '🟡';
                performanceColor = '#FFFF00';
            } else if (apiLatency < 200) {
                performanceEmoji = '🟠';
                performanceColor = '#FFA500';
            } else {
                performanceEmoji = '🔴';
                performanceColor = '#FF0000';
            }

            // Création de l'embed
            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .setColor(performanceColor)
                .addFields(
                    { name: 'Latence du bot', value: `${botLatency}ms`, inline: true },
                    { name: 'Latence de l\'API', value: `${apiLatency}ms ${performanceEmoji}`, inline: true },
                    { name: 'Uptime', value: client.getUptime(), inline: false }
                )
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();

            // Mise à jour du message temporaire avec l'embed
            await sentMessage.edit({ content: null, embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande ping:', error);
            message.reply('Une erreur est survenue lors de l\'exécution de cette commande.');
        }
    }
};