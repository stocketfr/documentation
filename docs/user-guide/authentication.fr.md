# Authentification et récupération du compte

## Connexion

Ouvrez l'hôte de votre tenant et saisissez e-mail et mot de passe sur `/login`. Stocket signale une adresse non vérifiée et permet de renvoyer le message. Des bandeaux confirment la vérification ou la réinitialisation au retour.

Une visite non authentifiée d'une route protégée redirige vers la connexion. Le compte connecté doit également être membre de ce tenant.

## Invitation et premier accès

Les administrateurs tenant créent normalement les utilisateurs dans **Administration → Utilisateurs** et leur attribuent un ou plusieurs rôles. Un lien d'accueil/réinitialisation permet de définir le mot de passe. Les liens de vérification expirent après 24 heures et ne connectent pas automatiquement l'utilisateur.

La page publique `/signup` crée un compte d'authentification mais aucune appartenance. Aucune UI admin tenant ne permet ensuite de rattacher ce compte, et recréer le même e-mail échoue. Le rattachement est donc une opération hors bande de plateforme/opérateur, pas l'onboarding normal.

## Mot de passe oublié

1. Choisissez **Mot de passe oublié** depuis la connexion.
2. Envoyez l'adresse du compte. La réponse reste volontairement identique que l'adresse existe ou non.
3. Suivez le lien reçu vers `/reset-password` et définissez un nouveau mot de passe.

La réinitialisation révoque les sessions existantes. Reconnectez chaque appareil.

## Actions de sécurité

Ban/réactivation s'applique au compte global dans tous les tenants. La révocation ferme aussi toutes les sessions globalement. La suppression depuis un tenant retire ses rôles/appartenance et ne supprime le compte global qu'après sa dernière appartenance. L'utilisateur se déconnecte depuis **Paramètres → Compte**.
