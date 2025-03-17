/**
 * Commande help
 * Affiche la liste des commandes disponibles avec pagination par catégorie
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
    ButtonStyle,
    version: discordVersion
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    name: 'help',
    description: 'Affiche la liste des commandes disponibles',
    category: 'Utilitaires',
    usage: 'help [commande/catégorie]',
    examples: ['help', 'help ping', 'help everyone'],
    aliases: ['aide', 'commands', 'cmds', 'h'],
    cooldown: 3,

    /**
     * Exécute la commande help
     * @param {Client} client - Instance du client Discord
     * @param {Message} message - Message de l'utilisateur
     * @param {Array} args - Arguments de la commande
     */
    async run(client, message, args) {
        try {
            // Message de chargement
            const loadingEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setDescription("🔍 **Chargement du menu d'aide...**");

            const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

            // Récupérer le préfixe du serveur
            const prefix = await client.getPrefix(message.guild?.id);

            // Si un argument est fourni, afficher l'aide pour cette commande ou catégorie spécifique
            if (args.length) {
                return handleSpecificHelp(client, message, args[0], loadingMsg, prefix);
            }

            // Afficher le menu d'aide général
            await displayHelpMenu(client, message, loadingMsg, prefix);
        } catch (error) {
            console.error('Erreur dans la commande help:', error);
            message.reply('Une erreur est survenue lors de l\'affichage du menu d\'aide.');
        }
    }
};

/**
 * Récupère les statistiques du bot
 * @param {Client} client - Instance du client Discord
 * @returns {Object} - Statistiques du bot
 */
function getBotStats(client) {
    const uptime = client.uptime;
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor(uptime / 3600000) % 24;
    const minutes = Math.floor(uptime / 60000) % 60;
    const seconds = Math.floor(uptime / 1000) % 60;

    return {
        servers: client.guilds.cache.size,
        users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        channels: client.channels.cache.size,
        commands: client.commands.size,
        uptime: `${days}j ${hours}h ${minutes}m ${seconds}s`,
        ping: `${client.ws.ping}ms`,
        memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
        cpu: `${os.loadavg()[0].toFixed(2)}%`,
        version: '1.0.0',
        discord: discordVersion,
        node: process.version
    };
}

/**
 * Organise les commandes par catégorie
 * @param {Client} client - Instance du client Discord
 * @returns {Object} - Commandes organisées par catégorie
 */
function organizeCommandsByCategory(client) {
    const organizedCommands = {};

    // Obtenir toutes les commandes
    client.commands.forEach(cmd => {
        // Utiliser la catégorie de la commande, ou 'Non catégorisé' si non définie
        const category = cmd.category || 'Non catégorisé';

        // Créer la catégorie si elle n'existe pas encore
        if (!organizedCommands[category]) {
            organizedCommands[category] = [];
        }

        // Ajouter la commande à sa catégorie
        organizedCommands[category].push(cmd);
    });

    return organizedCommands;
}

/**
 * Affiche le menu d'aide principal avec les catégories
 * @param {Client} client - Instance du client Discord
 * @param {Message} message - Message de l'utilisateur
 * @param {Message} loadingMsg - Message de chargement à éditer
 * @param {String} prefix - Préfixe du serveur
 */
async function displayHelpMenu(client, message, loadingMsg, prefix) {
    try {
        // Organiser les commandes par catégorie
        const commandsByCategory = organizeCommandsByCategory(client);

        // Récupérer les catégories (maintenant basées sur les catégories des commandes et non les dossiers)
        const categories = Object.keys(commandsByCategory).sort();

        // Créer un système de pagination pour naviguer entre les catégories
        let currentPage = 0;
        const embeds = [];

        // --- PAGE D'ACCUEIL ---
        const stats = getBotStats(client);
        const homeEmbed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setAuthor({
                name: `${client.user.username} • Centre d'Aide`,
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription([
                `📌 Bienvenue dans l'interface d'aide de **${client.user.username}**`,
                'Retrouvez ci-dessous toutes les informations nécessaires à l\'utilisation du bot.',
                '',
                '**📋 Navigation & Utilisation**',
                '> • Utilisez les boutons pour parcourir les pages',
                '> • Sélectionnez une catégorie via le menu déroulant',
                '> • La session expire après 2 minutes d\'inactivité',
                '',
                '**🔍 Recherche Rapide**',
                `> • \`${prefix}help <commande>\` - Détails d'une commande`,
                `> • \`${prefix}help <catégorie>\` - Liste des commandes par catégorie`,
                '',
                '**📊 Statistiques**',
                `> • Serveurs : \`${stats.servers.toLocaleString()}\``,
                `> • Utilisateurs : \`${stats.users.toLocaleString()}\``,
                `> • Commandes : \`${stats.commands}\``,
                `> • Catégories : \`${categories.length}\``,
                `> • Uptime : \`${stats.uptime}\``,
                `> • Latence : \`${stats.ping}\``,
                '',
                '**🔧 Système**',
                `> • Version : \`${stats.version}\``,
                `> • Discord.js : \`${stats.discord}\``,
                `> • Node.js : \`${stats.node}\``,
                `> • Mémoire : \`${stats.memory}\``,
                `> • CPU : \`${stats.cpu}\``,
                '',
                '**🔗 Liens Importants**',
                `> • [Inviter ${client.user.username}](https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8)`,
                '',
                '*Sélectionnez une catégorie ci-dessous pour commencer.*'
            ].join('\n'));

        embeds.push(homeEmbed);

        // --- PAGE DÉVELOPPEUR ---
        if (client.config.developers && client.config.developers.length > 0) {
            const devId = client.config.developers[0];
            const developer = await client.users.fetch(devId).catch(() => null);

            if (developer) {
                const devEmbed = new EmbedBuilder()
                    .setColor(client.config.embed.color)
                    .setAuthor({
                        name: `${client.user.username} • Développeur`,
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setDescription([
                        '**👨‍💻 Informations sur le Développeur**',
                        '',
                        '**🔧 Profil**',
                        `> • Développeur : \`${developer.tag}\``,
                        `> • ID : \`${developer.id}\``,
                        `> • Création : <t:${Math.floor(developer.createdTimestamp / 1000)}:R>`,
                        '',
                        '**🛠️ Développement**',
                        '> • Langage : `JavaScript`',
                        '> • Framework : `Discord.js v14`',
                        '> • Base de données : `MongoDB`',
                        '',
                        '*Pour toute question ou suggestion, rejoignez le serveur support.*'
                    ].join('\n'))
                    .setThumbnail(developer.displayAvatarURL({ dynamic: true }));

                embeds.push(devEmbed);
            }
        }

        // --- PAGES DES CATÉGORIES ---
        for (const category of categories) {
            const commands = commandsByCategory[category];

            // Formater le nom de la catégorie (première lettre en majuscule)
            const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);

            const categoryEmbed = new EmbedBuilder()
                .setColor(client.config.embed.color)
                .setAuthor({
                    name: `${client.user.username} • ${formattedCategory}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setDescription([
                    `**📑 Commandes de la catégorie ${formattedCategory}**`,
                    'Retrouvez ci-dessous toutes les commandes disponibles dans cette catégorie.',
                    '',
                    `*Préfixe actuel : \`${prefix}\`*`,
                    `*Tapez \`${prefix}help <commande>\` pour plus de détails sur une commande*`,
                    ''
                ].join('\n'));

            // Diviser les commandes en groupes pour une meilleure présentation
            const commandsPerGroup = 6;

            for (let i = 0; i < commands.length; i += commandsPerGroup) {
                const groupCommands = commands.slice(i, i + commandsPerGroup);
                let fieldValue = '';

                for (const cmd of groupCommands) {
                    fieldValue += `\`${prefix}${cmd.name}\`\n`;
                    fieldValue += `> ${cmd.description || "Aucune description"}\n`;
                    if (cmd.aliases && cmd.aliases.length) {
                        fieldValue += `> Aliases : \`${cmd.aliases.join('`, `')}\`\n`;
                    }
                    fieldValue += '\n';
                }

                categoryEmbed.addFields({
                    name: `📁 Groupe ${Math.floor(i / commandsPerGroup) + 1}`,
                    value: fieldValue,
                    inline: false
                });
            }

            embeds.push(categoryEmbed);
        }

        // --- CRÉATION DES COMPOSANTS D'INTERFACE ---

        // Menu de sélection
        const selectMenuOptions = [
            {
                label: 'Accueil',
                description: 'Retourner à la page d\'accueil',
                value: '0',
                emoji: '🏠',
                default: currentPage === 0
            }
        ];

        // Ajouter l'option Développeur si disponible
        if (embeds.length > 1 && client.config.developers && client.config.developers.length > 0) {
            selectMenuOptions.push({
                label: 'Développeur',
                description: 'Informations sur le développeur',
                value: '1',
                emoji: '👨‍💻',
                default: currentPage === 1
            });
        }

        // Ajouter les options pour chaque catégorie
        categories.forEach((category, index) => {
            const offset = client.config.developers && client.config.developers.length > 0 ? 2 : 1;
            selectMenuOptions.push({
                label: category.charAt(0).toUpperCase() + category.slice(1),
                description: `Voir les commandes de la catégorie ${category}`,
                value: (index + offset).toString(),
                emoji: getCategoryEmoji(category),
                default: currentPage === (index + offset)
            });
        });

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('category_select')
                .setPlaceholder('📑 Sélectionnez une page')
                .addOptions(selectMenuOptions)
        );

        // Boutons de navigation
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('first')
                .setEmoji('⏮️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('prev')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('home')
                .setEmoji('🏠')
                .setStyle(ButtonStyle.Success)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === embeds.length - 1),
            new ButtonBuilder()
                .setCustomId('last')
                .setEmoji('⏭️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === embeds.length - 1)
        );

        // Mettre à jour le message de chargement avec les embeds et composants
        await loadingMsg.edit({
            embeds: [embeds[currentPage]],
            components: [selectMenu, buttons]
        });

        // --- GESTION DES INTERACTIONS ---

        // Créer un collecteur pour les interactions avec les composants
        const collector = loadingMsg.createMessageComponentCollector({
            time: 120000 // 2 minutes
        });

        collector.on('collect', async interaction => {
            // Vérifier que c'est bien l'auteur du message qui interagit
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: 'Ces contrôles ne sont pas pour vous!',
                    ephemeral: true
                });
            }

            // Différer la mise à jour pour éviter les erreurs
            await interaction.deferUpdate();

            // Traitement différent selon le type d'interaction
            if (interaction.isButton()) {
                switch (interaction.customId) {
                    case 'first': currentPage = 0; break;
                    case 'prev': currentPage = Math.max(0, currentPage - 1); break;
                    case 'next': currentPage = Math.min(embeds.length - 1, currentPage + 1); break;
                    case 'last': currentPage = embeds.length - 1; break;
                    case 'home': currentPage = 0; break;
                }
            } else if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'category_select') {
                    currentPage = parseInt(interaction.values[0]);
                }
            }

            // Mettre à jour les boutons
            buttons.components[0].setDisabled(currentPage === 0); // First
            buttons.components[1].setDisabled(currentPage === 0); // Previous
            buttons.components[2].setDisabled(currentPage === 0); // Home
            buttons.components[3].setDisabled(currentPage === embeds.length - 1); // Next
            buttons.components[4].setDisabled(currentPage === embeds.length - 1); // Last

            // Mettre à jour le menu déroulant
            selectMenu.components[0].options.forEach((option, index) => {
                option.default = index.toString() === currentPage.toString();
            });

            // Mettre à jour le message
            await loadingMsg.edit({
                embeds: [embeds[currentPage]],
                components: [selectMenu, buttons]
            });
        });

        collector.on('end', () => {
            // Désactiver tous les composants à la fin du temps imparti
            const disabledButtons = new ActionRowBuilder().addComponents(
                buttons.components.map(button =>
                    ButtonBuilder.from(button).setDisabled(true)
                )
            );

            const disabledSelectMenu = new ActionRowBuilder().addComponents(
                StringSelectMenuBuilder.from(selectMenu.components[0])
                    .setDisabled(true)
                    .setPlaceholder('Session expirée')
            );

            loadingMsg.edit({
                components: [disabledSelectMenu, disabledButtons]
            }).catch(() => { });
        });

    } catch (error) {
        console.error('Erreur dans le menu d\'aide:', error);
        loadingMsg.edit({
            embeds: [
                new EmbedBuilder()
                    .setColor("#e74c3c")
                    .setTitle("❌ Erreur")
                    .setDescription("Une erreur est survenue lors de l'affichage du menu d'aide.")
            ]
        });
    }
}

/**
 * Gère l'affichage de l'aide pour une commande ou catégorie spécifique
 * @param {Client} client - Instance du client Discord
 * @param {Message} message - Message de l'utilisateur
 * @param {string} query - Nom de la commande ou catégorie
 * @param {Message} loadingMsg - Message de chargement à éditer
 * @param {String} prefix - Préfixe du serveur
 */
async function handleSpecificHelp(client, message, query, loadingMsg, prefix) {
    // Organiser les commandes par catégorie pour rechercher les catégories
    const commandsByCategory = organizeCommandsByCategory(client);
    const categories = Object.keys(commandsByCategory);

    // Vérifier si c'est une commande
    const command = client.commands.get(query.toLowerCase()) ||
        client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(query.toLowerCase()));

    if (command) {
        // C'est une commande, afficher son aide spécifique
        const commandEmbed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setAuthor({
                name: `📚 Aide • ${command.name}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription([
                `\`\`\`md\n# ${command.name}\n\`\`\``,
                '**📝 Informations :**',
                `> 📋 Description : ${command.description || 'Aucune description disponible'}`,
                `> 📂 Catégorie : ${command.category ? command.category.charAt(0).toUpperCase() + command.category.slice(1) : 'Non catégorisé'}`,
                `> 💭 Aliases : ${command.aliases ? `\`${command.aliases.join('`, `')}\`` : 'Aucun alias'}`,
                `> 📜 Utilisation : \`${prefix}${command.usage || command.name}\``,
                `> ⏱️ Cooldown : ${command.cooldown || '3'} secondes`,
                command.permissions ? `> 🔒 Permissions : \`${command.permissions.join('`, `')}\`` : null,
                '',
                '*Pour plus d\'informations, rejoignez le serveur support.*'
            ].filter(Boolean).join('\n'))
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

        // Bouton pour retourner au menu principal
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_to_help')
                    .setLabel('Retour au menu d\'aide')
                    .setEmoji('🔙')
                    .setStyle(ButtonStyle.Secondary)
            );

        await loadingMsg.edit({
            embeds: [commandEmbed],
            components: [row]
        });

        // Collecteur pour le bouton de retour
        const collector = loadingMsg.createMessageComponentCollector({
            time: 60000 // 1 minute
        });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: 'Ce bouton n\'est pas pour vous!',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'back_to_help') {
                collector.stop();
                await displayHelpMenu(client, message, loadingMsg, prefix);
            }
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_to_help')
                        .setLabel('Retour au menu d\'aide')
                        .setEmoji('🔙')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            loadingMsg.edit({ components: [disabledRow] }).catch(() => { });
        });

        return;
    }

    // Vérifier si c'est une catégorie
    const categoryMatch = categories.find(cat => cat.toLowerCase() === query.toLowerCase());

    if (categoryMatch) {
        const commands = commandsByCategory[categoryMatch];

        // Formater le nom de la catégorie (première lettre en majuscule)
        const formattedCategory = categoryMatch.charAt(0).toUpperCase() + categoryMatch.slice(1);

        const categoryEmbed = new EmbedBuilder()
            .setColor(client.config.embed.color)
            .setAuthor({
                name: `${client.user.username} • ${formattedCategory}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription([
                `**📑 Commandes de la catégorie ${formattedCategory}**`,
                'Retrouvez ci-dessous toutes les commandes disponibles dans cette catégorie.',
                '',
                `*Préfixe actuel : \`${prefix}\`*`,
                `*Tapez \`${prefix}help <commande>\` pour plus de détails sur une commande*`,
                ''
            ].join('\n'));

        // Diviser les commandes en groupes pour une meilleure présentation
        const commandsPerGroup = 6;

        for (let i = 0; i < commands.length; i += commandsPerGroup) {
            const groupCommands = commands.slice(i, i + commandsPerGroup);
            let fieldValue = '';

            for (const cmd of groupCommands) {
                fieldValue += `\`${prefix}${cmd.name}\`\n`;
                fieldValue += `> ${cmd.description || "Aucune description"}\n`;
                if (cmd.aliases && cmd.aliases.length) {
                    fieldValue += `> Aliases : \`${cmd.aliases.join('`, `')}\`\n`;
                }
                fieldValue += '\n';
            }

            categoryEmbed.addFields({
                name: `📁 Groupe ${Math.floor(i / commandsPerGroup) + 1}`,
                value: fieldValue,
                inline: false
            });
        }

        // Bouton pour retourner au menu principal
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_to_help')
                    .setLabel('Retour au menu d\'aide')
                    .setEmoji('🔙')
                    .setStyle(ButtonStyle.Secondary)
            );

        await loadingMsg.edit({
            embeds: [categoryEmbed],
            components: [row]
        });

        // Collecteur pour le bouton de retour
        const collector = loadingMsg.createMessageComponentCollector({
            time: 60000 // 1 minute
        });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: 'Ce bouton n\'est pas pour vous!',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'back_to_help') {
                collector.stop();
                await displayHelpMenu(client, message, loadingMsg, prefix);
            }
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_to_help')
                        .setLabel('Retour au menu d\'aide')
                        .setEmoji('🔙')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            loadingMsg.edit({ components: [disabledRow] }).catch(() => { });
        });

        return;
    }

    // Ni commande ni catégorie trouvée
    await loadingMsg.edit({
        embeds: [
            new EmbedBuilder()
                .setColor("#e67e22")
                .setAuthor({
                    name: '❌ Non trouvé',
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setDescription([
                    `\`${query}\` n'est ni une commande ni une catégorie valide.`,
                    '',
                    '**📋 Catégories disponibles :**',
                    categories.map(cat => `> • ${cat.charAt(0).toUpperCase() + cat.slice(1)}`).join('\n'),
                    '',
                    `*Tapez \`${prefix}help\` pour voir toutes les commandes.*`
                ].join('\n'))
        ]
    });

    // Attendre 5 secondes puis afficher le menu d'aide général
    setTimeout(async () => {
        await displayHelpMenu(client, message, loadingMsg, prefix);
    }, 5000);
}

/**
 * Obtient l'emoji correspondant à une catégorie
 * @param {string} category - Nom de la catégorie
 * @returns {string} - Emoji correspondant
 */
function getCategoryEmoji(category) {
    const categoryEmojis = {
        'everyone': '👥',
        'utilitaires': '🛠️',
        'utility': '🛠️',
        'moderation': '🔨',
        'fun': '🎮',
        'music': '🎵',
        'games': '🎲',
        'economy': '💰',
        'administration': '⚙️',
        'owners': '👑',
        'owner': '👑',
        'developers': '👨‍💻',
        'information': 'ℹ️',
        'giveaway': '🎉',
        'settings': '⚙️'
    };

    return categoryEmojis[category.toLowerCase()] || '📁';
}