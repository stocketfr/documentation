# Personnalisation du tenant

La marque fait partie des **Paramètres**. La lecture exige `SETTINGS.READ`, l'enregistrement `SETTINGS.WRITE`.

L'endpoint de lecture n'est public qu'après résolution de l'hôte vers un tenant vérifié. Les changements de marque ne créent actuellement pas d'événement dans l'audit tenant.

## Champs et effets

| Champ | Comportement actuel |
| --- | --- |
| Nom de l'application | Définit le libellé/monogramme de marque et le titre du document. |
| Slogan | Définit la description des métadonnées ; il n'est pas affiché comme sous-titre. |
| URL du logo | Change le logo de la barre latérale. Connexion/inscription/récupération gardent le logo Stocket intégré. |
| URL du favicon | Change l'icône du navigateur. |
| Couleur principale | Est enregistrée, mais pas appliquée au thème visible par le provider actuel. |

En environnement déployé, utilisez des URL HTTPS publiquement accessibles. Contrôlez la barre latérale et le favicon après enregistrement. La lecture peut rester en cache jusqu'à cinq minutes ; les autres sessions ne se mettent donc pas toujours à jour immédiatement.

Le formulaire actuel ne semble pas désactivé pour un utilisateur en lecture seule, mais le serveur refuse l'enregistrement sans `SETTINGS.WRITE`.

Pour thème personnel, langue, compte et PWA, consultez [Paramètres](settings.md).
