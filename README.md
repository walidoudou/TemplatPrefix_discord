# Discord Bot Template

Un template complet de bot Discord avec système de commandes modulaire, gestion d'événements, et intégration de base de données MongoDB.

## Fonctionnalités

- **Architecture modulaire**: Système de commandes et d'événements organisé et extensible
- **Rechargement à chaud**: Détection automatique des modifications de fichiers pour un développement continu
- **Console interactive**: Interface de gestion du bot directement depuis la console
- **Base de données MongoDB**: Stockage des configurations et données du bot
- **Système de permissions**: Gestion des rôles développeur, propriétaire, et utilisateur
- **Système de préfixe**: Préfixe personnalisable par serveur
- **Interface d'aide avancée**: Commande d'aide interactive avec pagination et catégories
- **Gestion des erreurs**: Système anti-crash pour une stabilité optimale

## Prérequis

- Node.js (v16.11.0 ou supérieur)
- MongoDB
- Un compte Discord Developer pour créer un bot

## Installation

1. Clonez ce dépôt:

   ```bash
   git clone https://github.com/votre-utilisateur/discord-bot-template.git
   cd discord-bot-template
   ```

2. Installez les dépendances:

   ```bash
   npm install
   ```

3. Créez un fichier `.env` à la racine du projet avec les informations suivantes:

   ```
   TOKEN=votre_token_discord_bot
   MONGODB_URI=votre_uri_mongodb
   ```

4. Lancez le bot:
   ```bash
   npm start
   ```

Pour le développement avec rechargement automatique:

```bash
npm run dev
```

## Configuration

La configuration principale du bot se trouve dans le fichier `config.json`:

```json
{
  "bot": {
    "name": "TemplatePrefix",
    "mainPrefix": "+",
    "activity": "TemplatePrefix",
    "status": "online"
  },
  "developers": ["ID_DÉVELOPPEUR"],
  "owners": ["ID_PROPRIÉTAIRE"],
  "embed": {
    "color": "#3498db",
    "footer": "TemplatePrefix - Créé avec ❤️",
    "thumbnail": ""
  }
}
```

Vous devez remplacer `ID_DÉVELOPPEUR` et `ID_PROPRIÉTAIRE` par vos propres identifiants Discord.

## Commandes disponibles

### Commandes générales

- `+help` - Affiche la liste des commandes disponibles
- `+ping` - Affiche la latence du bot
- `+pic` - Affiche l'avatar d'un utilisateur

### Commandes administratives

- `+prefix` - Modifie le préfixe du bot pour le serveur actuel
- `+owners` - Gère les propriétaires du bot (ajouter/supprimer)

## Structure du projet

```
discord-bot-template/
├── commands/             # Commandes du bot organisées par catégorie
│   ├── everyone/         # Commandes accessibles à tous les utilisateurs
│   └── owners/           # Commandes réservées aux propriétaires
├── events/               # Gestionnaires d'événements Discord
├── handlers/             # Gestionnaires de fonctionnalités
├── models/               # Modèles de données MongoDB
├── client.js             # Extension du client Discord.js
├── config.json           # Configuration du bot
├── index.js              # Point d'entrée du bot
└── .env                  # Variables d'environnement (à créer)
```

## Créer une nouvelle commande

Pour créer une nouvelle commande, ajoutez un fichier JavaScript dans le dossier `commands/` approprié:

```javascript
module.exports = {
  name: "ma-commande",
  description: "Description de ma commande",
  category: "Catégorie",
  usage: "ma-commande [arguments]",
  aliases: ["alias1", "alias2"],
  cooldown: 5, // Cooldown en secondes

  async run(client, message, args) {
    // Code de votre commande ici
  },
};
```

## Créer un nouvel événement

Pour créer un nouvel événement, ajoutez un fichier JavaScript dans le dossier `events/`:

```javascript
module.exports = {
  name: "nomDeLEventDiscord",
  once: false, // true si l'événement ne doit être exécuté qu'une seule fois
  async execute(client, ...args) {
    // Code de votre événement ici
  },
};
```

## Console interactive

La console interactive offre plusieurs commandes pour administrer le bot:

- `help` - Affiche l'aide de la console
- `clear` - Efface la console
- `stats` - Affiche les statistiques du bot
- `uptime` - Affiche le temps de fonctionnement du bot
- `reload` - Recharge les commandes
- `restart` - Redémarre le bot
- `exit` - Arrête proprement le bot

## Déploiement

Pour déployer en production:

1. Configurez un serveur avec Node.js et MongoDB
2. Clonez le dépôt sur votre serveur
3. Installez les dépendances avec `npm install --production`
4. Configurez les variables d'environnement
5. Lancez le bot avec `npm start` ou un gestionnaire de processus comme PM2:
   ```bash
   npm install -g pm2
   pm2 start index.js --name discord-bot
   ```

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus d'informations.

## Auteur

walidoudou

---

Créé avec ❤️ pour la communauté Discord
