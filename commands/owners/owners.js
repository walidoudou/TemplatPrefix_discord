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
            const Bot = require('../../models/Bot');
            const botConfig = await Bot.findOne();

            if (!botConfig) {
                return message.reply('Configuration du bot introuvable dans la base de données.');
            }

            // Si aucun argument n'est fourni, afficher la liste des propriétaires
            if (!args[0] || args[0].toLowerCase() === 'list') {
                return listOwners(client, message, botConfig);
            }

            // Si l'action est "add" ou "del", vérifier qu'un ID est fourni
            if ((args[0].toLowerCase() === 'add' || args[0].toLowerCase() === 'del') && !args[1]) {
                return message.reply(`Veuillez fournir l'ID de l'utilisateur à ${args[0].toLowerCase() === 'add' ? 'ajouter' : 'supprimer'}.`);
            }

            // Traiter l'action demandée
            switch (args[0].toLowerCase()) {
                case 'add':
                    return addOwner(client, message, args[1], botConfig);
                case 'del':
                case 'delete':
                case 'remove':
                    return removeOwner(client, message, args[1], botConfig);
                default:
                    return message.reply('Action invalide. Utilisez `list`, `add` ou `del`.');
            }

        } catch (error) {
            logHandler.log('error', 'Commande Owners', `Erreur: ${error.message}`);
            message.reply('Une erreur est survenue lors de l\'exécution de cette commande.');
        }
    }
};

/**
 * Affiche la liste des propriétaires
 * @param {Client} client - Instance du client Discord
 * @param {Message} message - Message de l'utilisateur
 * @param {Object} botConfig - Configuration du bot depuis la base de données
 */
async function listOwners(client, message, botConfig) {
    try {
        const owners = botConfig.owners || [];

        // Créer la liste des propriétaires avec leurs noms si possible
        let ownersList = '';

        for (const ownerId of owners) {
            let ownerName = 'Inconnu';
            try {
                const user = await client.users.fetch(ownerId);
                ownerName = user.tag;
            } catch (error) {
                // Ignorer les erreurs si l'utilisateur n'est pas trouvable
            }

            ownersList += `• **${ownerName}** (${ownerId})\n`;
        }

        // Si aucun propriétaire n'est trouvé
        if (!ownersList) {
            ownersList = 'Aucun propriétaire défini.';
        }

        // Créer l'embed
        const embed = new EmbedBuilder()
            .setTitle('👑 Propriétaires du Bot')
            .setColor(client.config.embed.color)
            .setDescription(ownersList)
            .setFooter({ text: client.config.embed.footer })
            .setTimestamp();

        // Envoyer l'embed
        await message.reply({ embeds: [embed] });

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
 */
async function addOwner(client, message, userId, botConfig) {
    try {
        // Vérifier si l'ID est valide
        try {
            await client.users.fetch(userId);
        } catch (error) {
            return message.reply('ID utilisateur invalide. Veuillez fournir un ID valide.');
        }

        // Vérifier si l'utilisateur est déjà propriétaire
        if (botConfig.owners.includes(userId)) {
            return message.reply('Cet utilisateur est déjà propriétaire du bot.');
        }

        // Ajouter l'utilisateur à la liste des propriétaires
        botConfig.owners.push(userId);
        await botConfig.save();

        // Mettre à jour la liste des propriétaires dans le client
        client.config.owners = botConfig.owners;

        // Logger l'action
        logHandler.log('info', 'Commande Owners', `${message.author.tag} a ajouté ${userId} comme propriétaire`);

        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setTitle('👑 Propriétaire ajouté')
            .setColor(client.config.embed.color)
            .setDescription(`L'utilisateur avec l'ID \`${userId}\` a été ajouté aux propriétaires du bot.`)
            .setFooter({ text: client.config.embed.footer })
            .setTimestamp();

        // Envoyer l'embed
        await message.reply({ embeds: [embed] });

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
 */
async function removeOwner(client, message, userId, botConfig) {
    try {
        // Vérifier si l'utilisateur est dans la liste des propriétaires
        if (!botConfig.owners.includes(userId)) {
            return message.reply('Cet utilisateur n\'est pas propriétaire du bot.');
        }

        // Supprimer l'utilisateur de la liste des propriétaires
        botConfig.owners = botConfig.owners.filter(id => id !== userId);
        await botConfig.save();

        // Mettre à jour la liste des propriétaires dans le client
        client.config.owners = botConfig.owners;

        // Logger l'action
        logHandler.log('info', 'Commande Owners', `${message.author.tag} a supprimé ${userId} des propriétaires`);

        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setTitle('👑 Propriétaire supprimé')
            .setColor(client.config.embed.color)
            .setDescription(`L'utilisateur avec l'ID \`${userId}\` a été supprimé des propriétaires du bot.`)
            .setFooter({ text: client.config.embed.footer })
            .setTimestamp();

        // Envoyer l'embed
        await message.reply({ embeds: [embed] });

    } catch (error) {
        throw error;
    }
}