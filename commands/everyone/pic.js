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
    aliases: ['avatar', 'pdp', 'pfp'],
    cooldown: 5,

    /**
     * Exécute la commande pic
     * @param {Client} client - Instance du client Discord
     * @param {Message} message - Message de l'utilisateur
     * @param {Array} args - Arguments de la commande
     */
    async run(client, message, args) {
        try {
            // Message de chargement
            const loadingEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setDescription("🔍 **Récupération de l'avatar en cours...**");

            const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

            // Obtenir l'utilisateur cible (mentionné, ID, ou l'auteur du message)
            let target = message.mentions.users.first()
                || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null)
                || message.author;

            if (!target) {
                return loadingMsg.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#e74c3c")
                            .setTitle("❌ Utilisateur introuvable")
                            .setDescription("Veuillez mentionner un utilisateur valide ou fournir un ID valide.")
                            .setFooter({
                                text: client.config.embed.footer,
                                iconURL: client.user.displayAvatarURL()
                            })
                    ]
                });
            }

            // Obtenir le membre s'il est dans le serveur
            let member = message.guild ? message.guild.members.cache.get(target.id) : null;

            // Déterminer le format d'avatar (serveur ou global)
            const formats = ['webp', 'png', 'jpg', 'jpeg'];
            if (target.avatar && target.avatar.startsWith('a_')) formats.unshift('gif');

            const sizes = [4096, 2048, 1024, 512, 256];
            const globalAvatar = target.displayAvatarURL({ size: 4096, dynamic: true });
            const guildAvatar = member?.displayAvatarURL({ size: 4096, dynamic: true });

            // Création des téléchargements pour chaque format
            const formatLinks = formats.map(format => {
                const url = target.displayAvatarURL({ extension: format, size: 4096 });
                return `[${format.toUpperCase()}](${url})`;
            }).join(' • ');

            // Création des téléchargements pour chaque taille
            const sizeLinks = sizes.map(size => {
                const url = target.displayAvatarURL({ size: size });
                return `[${size}px](${url})`;
            }).join(' • ');

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Avatar de ${target.username}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setColor(member?.displayHexColor || client.config.embed.color)
                .setImage(globalAvatar)
                .addFields(
                    { name: '📋 Formats disponibles', value: formatLinks, inline: false },
                    { name: '📏 Tailles disponibles', value: sizeLinks, inline: false }
                )
                .setFooter({
                    text: `ID: ${target.id} | ${client.config.embed.footer}`,
                })
                .setTimestamp();

            // Si l'utilisateur a un avatar spécifique au serveur, l'ajouter
            if (member && guildAvatar !== globalAvatar) {
                embed.setDescription(`**Avatar global** ci-dessous\n**Avatar serveur** en miniature`)
                    .setThumbnail(guildAvatar);
            } else {
                embed.setDescription(`Avatar de **${target.tag}**`);
            }

            // Envoyer l'embed
            await loadingMsg.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande pic:', error);
            message.reply('Une erreur est survenue lors de l\'exécution de cette commande.');
        }
    }
};