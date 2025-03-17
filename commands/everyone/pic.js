/**
 * Commande pic
 * Affiche la photo de profil d'un utilisateur
 */

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pic',
    description: 'Affiche la photo de profil d\'un utilisateur',
    category: 'Utilitaires',
    usage: 'pic [utilisateur]',
    aliases: ['avatar', 'pdp'],
    cooldown: 5,
    
    /**
     * Exécute la commande pic
     * @param {Client} client - Instance du client Discord
     * @param {Message} message - Message de l'utilisateur
     * @param {Array} args - Arguments de la commande
     */
    async run(client, message, args) {
        try {
            // Obtenir l'utilisateur cible (mentionné, ID, ou l'auteur du message)
            let target = message.mentions.users.first() 
                || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) 
                || message.author;
            
            if (!target) {
                return message.reply('Utilisateur introuvable. Veuillez mentionner un utilisateur valide ou fournir un ID valide.');
            }
            
            // Obtenir le membre s'il est dans le serveur
            let member = message.guild ? message.guild.members.cache.get(target.id) : null;
            
            // Déterminer le format d'avatar (serveur ou global)
            const guildAvatar = member?.displayAvatarURL({ dynamic: true, size: 4096 });
            const globalAvatar = target.displayAvatarURL({ dynamic: true, size: 4096 });
            
            // Créer l'embed
            const embed = new EmbedBuilder()
                .setTitle(`Photo de profil de ${target.username}`)
                .setColor(client.config.embed.color)
                .setImage(globalAvatar)
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp();
            
            // Si l'utilisateur a un avatar spécifique au serveur, l'ajouter à la description
            if (member && guildAvatar !== globalAvatar) {
                embed.setDescription(`[Avatar global](${globalAvatar}) | [Avatar serveur](${guildAvatar})`);
                embed.setThumbnail(guildAvatar);
            } else {
                embed.setDescription(`[Lien direct](${globalAvatar})`);
            }
            
            // Envoyer l'embed
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Erreur dans la commande pic:', error);
            message.reply('Une erreur est survenue lors de l\'exécution de cette commande.');
        }
    }
};