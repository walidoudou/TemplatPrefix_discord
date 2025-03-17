/**
 * Événement ready
 * Se déclenche une fois que le bot est connecté à Discord
 */

const logHandler = require('../handlers/logHandler');
const databaseHandler = require('../handlers/databaseHandler');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            // Afficher un message indiquant que le bot est en ligne
            logHandler.log('success', 'Client', `Connecté en tant que ${client.user.tag}!`);

            // Définir l'activité du bot selon la configuration
            client.user.setPresence({
                activities: [{
                    name: client.config.bot.activity,
                    type: 0 // 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 5 = Competing
                }],
                status: client.config.bot.status // online, idle, dnd, invisible
            });

            // Mettre à jour les informations des serveurs dans la base de données
            await updateGuildsInfo(client);

            // Mettre à jour les statistiques du bot
            client.updateStats();

            // Afficher un résumé des informations du bot
            displayBotSummary(client);
        } catch (error) {
            logHandler.log('error', 'Ready Event', `Erreur lors de l'initialisation du bot: ${error.message}`);
        }
    }
};

/**
 * Met à jour les informations de tous les serveurs dans la base de données
 * @param {Client} client - Instance du client Discord
 */
async function updateGuildsInfo(client) {
    try {
        const guilds = client.guilds.cache.values();

        for (const guild of guilds) {
            await databaseHandler.updateGuildInfo(guild);
        }

        logHandler.log('info', 'Ready Event', `Informations mises à jour pour ${client.guilds.cache.size} serveurs`);
    } catch (error) {
        logHandler.log('error', 'Ready Event', `Erreur lors de la mise à jour des informations des serveurs: ${error.message}`);
    }
}

/**
 * Affiche un résumé des informations du bot
 * @param {Client} client - Instance du client Discord
 */
function displayBotSummary(client) {
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const channelCount = client.channels.cache.size;

    logHandler.log('info', 'Ready Event', `Bot prêt sur ${guildCount} serveurs`);
    logHandler.log('info', 'Ready Event', `Servant ${userCount} utilisateurs`);
    logHandler.log('info', 'Ready Event', `Accès à ${channelCount} canaux`);
    logHandler.log('info', 'Ready Event', `Préfixe principal: ${client.config.bot.mainPrefix}`);
}