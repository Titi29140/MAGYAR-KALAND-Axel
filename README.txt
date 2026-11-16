MAGYAR KALAND — première version installable
================================================

CONTENU
- Application web progressive (PWA), adaptée à Android, tablette et ordinateur.
- 10 missions de vocabulaire progressives.
- Cartes de mots, illustrations emoji, prononciation par synthèse vocale du navigateur.
- Quiz, étoiles, badges et suivi local.
- Export/import manuel de la progression pour la transférer entre tablette et ordinateur.
- Mise en cache pour une utilisation hors connexion après la première visite.

IMPORTANT — INSTALLATION
Une PWA doit être servie depuis une adresse HTTPS (ou localhost). Ouvrir simplement index.html depuis le dossier ne permet pas l'installation PWA ni le service worker.

Pour la rendre accessible :
1. Décompresser le ZIP.
2. Publier tous les fichiers du dossier sur un hébergement HTTPS statique (par exemple GitHub Pages ou un hébergement web personnel).
3. Ouvrir l'adresse HTTPS dans Chrome sur la tablette Samsung.
4. Menu ⋮ > Installer l'application (ou Ajouter à l'écran d'accueil).
5. Sur le PC, ouvrir la même adresse dans Chrome ou Edge puis utiliser l'icône Installer.

SYNCHRONISATION
La V1 enregistre les données dans le stockage local du navigateur. Pour transférer la progression :
- Sur le premier appareil : onglet Parents > Exporter ma sauvegarde.
- Transférer le fichier JSON sur le second appareil.
- Sur le second appareil : onglet Parents > Importer une sauvegarde.

La synchronisation automatique entre appareils n'est pas encore incluse : elle nécessite un backend sécurisé, une authentification et un hébergement de données. Aucun mot de passe ni donnée personnelle n'est demandé dans cette V1.

VOIX
La lecture utilise les voix disponibles sur l'appareil via SpeechSynthesis. Il faut que le navigateur et le système disposent d'une voix hongroise (hu-HU) pour obtenir une prononciation hongroise de bonne qualité. La disponibilité varie selon le matériel et les voix installées.

PÉDAGOGIE
Le contenu est une base débutant à faire évoluer. Les transcriptions phonétiques ne sont pas affichées partout car les sons hongrois doivent être appris à l'écoute. Certaines traductions de vocabulaire sont volontairement simplifiées pour un enfant.

CONFIDENTIALITÉ
La progression reste dans le navigateur de l'appareil. La police Google est chargée depuis Google Fonts si Internet est disponible ; le reste de l'application est prévu pour fonctionner hors connexion après mise en cache.
