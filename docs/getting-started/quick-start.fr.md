# Démarrage rapide

Ce parcours suppose une base locale neuve : le seed sans cible crée donc le
tenant par défaut. Sur une base existante, il choisit l'unique tenant ou demande
parmi plusieurs ; utilisez alors l'hôte choisi. Un utilisateur tenant ne se
connecte pas sur l'hôte plateforme.

## 1. Créer les données et se connecter

```bash
cd backend
pnpm tenant:seed:workspace
```

Sur une base neuve, ouvrez `http://stocket.localhost:3000` ; sinon remplacez
`stocket` par le slug/hôte choisi. Connectez-vous avec :

- e-mail : `tenant-admin@stocket.fr`
- mot de passe : `admin1234`

`http://localhost:3000` est l'hôte séparé des superadmins plateforme.

## 2. Examiner le tableau de bord

Le tableau de bord résume produits, emplacements, quantité, stock faible et
activité récente. L'accès dépend des permissions résolues de l'utilisateur.

## 3. Créer un produit

1. Ouvrez **Produits** puis **Créer un produit**.
2. Saisissez un SKU unique et un nom.
3. Sélectionnez une catégorie existante ou créez-en une depuis ce flux.
4. Ajoutez éventuellement unité, code-barres, coût, prix, seuil, état
   périssable, notes et photos.
5. Enregistrez.

L'action QR remplit le SKU si le navigateur prend en charge `BarcodeDetector`
et si l'accès caméra est autorisé.

## 4. Créer un emplacement et une zone

1. Ouvrez **Emplacements** et créez un entrepôt, fournisseur, client ou transit.
2. Ouvrez le détail de l'emplacement.
3. Ajoutez une zone, étagère ou bac ; les zones peuvent être imbriquées.

Évitez de supprimer une zone parent contenant des enfants. La suppression
actuelle enlève uniquement la ligne sélectionnée et peut rendre les descendants
inaccessibles.

## 5. Ajouter et ajuster l'inventaire

1. Ouvrez **Inventaire** puis **Ajouter**.
2. Choisissez produit, emplacement et éventuellement zone.
3. Saisissez la quantité et les données de lot/expiration éventuelles.
4. Utilisez **Ajuster** pour appliquer ensuite un delta positif ou négatif.

Les ajustements et le registre des mouvements sont indépendants : l'un ne crée
ni ne met automatiquement à jour l'autre.

## 6. Tester un import CSV guidé (optionnel)

Smart Import exige le droit fonctionnel `smartImport` du tenant et un worker
actif.

1. Ouvrez **Produits** puis **Importer**.
2. Chargez un CSV normalisé ou un export Sortly pris en charge.
3. Examinez le preview et les suggestions déterministes/IA.
4. Résolvez catégories, emplacements/zones, doublons SKU et photos.
5. Approuvez le plan et suivez la tâche durable.
6. Examinez les compteurs et téléchargez le CSV d'incidents proposé.

Voir [Produits](../user-guide/products.md) pour le workflow complet.

## Suite

- [Emplacements et zones](../user-guide/locations.md)
- [Inventaire](../user-guide/inventory.md)
- [Utilisateurs et rôles](../user-guide/users-roles.md)
- [Configuration](configuration.md)
