# Paramètres

Ouvrez **Paramètres** pour gérer votre apparence et votre compte, ainsi que la marque du tenant si vous y êtes autorisé.

## Apparence et langue

Les cinq choix sont Stocket clair, Stocket sombre, Clair, Sombre et Système. Système suit la préférence de l'OS avec les thèmes neutres. L'application propose anglais, allemand et français.

## Compte

La section actuelle permet la déconnexion ; elle n'affiche ni ne modifie le profil.

## Personnalisation du tenant

`SETTINGS.READ` permet la consultation ; `SETTINGS.WRITE` est requis pour enregistrer.

| Champ | Effet visible actuel |
| --- | --- |
| Nom de l'application | Identité de la barre latérale et titre du document. |
| Slogan | Description des métadonnées, pas sous-titre visible. |
| URL du logo | Logo du tenant dans la barre latérale. Les pages d'auth utilisent encore le logo Stocket intégré. |
| URL du favicon | Icône du navigateur. |
| Couleur principale | Enregistrée, mais pas encore appliquée au thème visible. |

Les lectures de la marque peuvent rester en cache jusqu'à cinq minutes. Réessayez plus tard si un autre utilisateur ne voit pas immédiatement le changement. Le formulaire semble actuellement modifiable pour un utilisateur en lecture seule, mais le serveur refuse l'enregistrement sans `SETTINGS.WRITE`.

La PWA précharge la page de secours, le manifeste et les icônes, et peut mettre en cache les ressources statiques récupérées. Les pages de navigation réussies et les données API ne sont pas disponibles hors ligne ; toute opération exige une connexion.
