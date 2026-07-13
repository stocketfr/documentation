# Guide utilisateur

Stocket est une application d'inventaire multi-tenant fondée sur les hôtes. Ouvrez `https://<tenant>.stocket.fr` pour un espace tenant ; les administrateurs plateforme utilisent l'hôte dédié. En local : `http://<slug>.localhost:3000` et `http://localhost:3000`.

## Navigation principale

- **Tableau de bord** — compteurs, stock faible, mouvements, commandes et graphique par emplacement.
- **Inventaire** — Produits, Emplacements et lignes d'Inventaire actuelles.
- **Opérations** — Clients, Fournisseurs, Commandes et registre des Mouvements.
- **Administration** — Journaux d'audit, Utilisateurs et Rôles selon vos permissions.
- **Paramètres** — apparence, langue, compte et personnalisation du tenant.

La plupart des liens groupés suivent permissions et fonctionnalités. Paramètres reste toujours visible, et le fallback sans rôle peut montrer Dashboard/Paramètres alors que la garde stricte redirige ; la visibilité n'est pas une garantie d'autorisation. `Ctrl+B` ou `Cmd+B` masque/affiche la barre. Il n'existe pas de recherche globale.

## Ordre de configuration conseillé

1. Un administrateur plateforme crée le tenant et son premier administrateur.
2. L'administrateur tenant configure les [utilisateurs et rôles](users-roles.md) et les [paramètres](settings.md).
3. Créez les [catégories et produits](products.md), puis les [emplacements et zones](locations.md).
4. Ajoutez l'[inventaire](inventory.md), les clients et fournisseurs.
5. Utilisez les [commandes](orders.md) et le [registre des mouvements](stock-movements.md) selon votre flux.

## Frontière importante du modèle

Inventaire et mouvements sont actuellement séparés. Ajouter ou ajuster une ligne d'inventaire ne crée pas de mouvement, et enregistrer un mouvement ne modifie pas l'inventaire. Un transfert exige donc des mises à jour explicites à la source et à la destination, plus éventuellement une écriture de registre.

## Navigateur et fonctionnement hors ligne

Stocket peut être installé comme PWA. Le service worker précharge page de secours, manifeste et icônes et peut mettre en cache les ressources statiques récupérées. Les pages applicatives réussies et les données API ne sont ni stockées ni synchronisées pour un usage hors ligne. Toute opération exige une connexion.

Le scanner utilise `BarcodeDetector` natif et n'accepte actuellement que les résultats QR. Sa disponibilité dépend du navigateur, de l'appareil, des permissions et d'un contexte sécurisé.

## Aide par tâche

- [Authentification et récupération](authentication.md)
- [Tableau de bord](dashboard.md)
- [Produits et Smart Import](products.md)
- [Emplacements, zones et inventaire](locations.md)
- [Clients](clients.md) et [fournisseurs](suppliers.md)
- [Commandes](orders.md) et [mouvements](stock-movements.md)
- [Utilisateurs et rôles](users-roles.md), [audit](audit-logs.md) et [paramètres](settings.md)
- [Administration plateforme](platform-administration.md)
