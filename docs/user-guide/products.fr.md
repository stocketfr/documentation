# Produits

Les produits sont des fiches catalogue propres au tenant. Ouvrez **Inventaire → Produits** (`/products`) pour parcourir, filtrer, créer, modifier et supprimer logiquement. Une carte ouvre le détail.

## Parcourir et filtrer

La grille affiche miniature, nom, SKU, catégorie, état actif, seuil de réapprovisionnement et caractère périssable. La recherche et l'arbre de catégories réduisent la liste ; le filtre catégorie inclut ses descendants.

La liste ne propose pas encore de filtre des produits supprimés. Une suppression logique individuelle affiche brièvement **Annuler** ; aucune suppression définitive n'est disponible. Le mode lot change le statut ou supprime les lignes de la page. Une action de restauration existe mais les lignes supprimées ne peuvent actuellement pas être sélectionnées.

## Créer ou modifier

Le formulaire actuel gère :

- SKU, nom et catégorie obligatoires ;
- unité et code-barres ;
- coût et prix standards ;
- seuil de réapprovisionnement ;
- états actif et périssable ;
- notes ;
- plusieurs photos.

Le SKU est unique dans le tenant. Le changer ne casse pas les références fondées sur l'ID. Les images JPEG, PNG, WebP et GIF jusqu'à 10 Mio sont validées par contenu et peuvent être supprimées ; l'overhead partage la même limite HTTP de 10 Mio.

Certains produits créés par import/API affichent des métadonnées supplémentaires dans le détail, par exemple une description ou des attributs physiques. Le formulaire web actuel ne les modifie pas et ne gère ni fournisseur principal ni SKU fournisseur.

La vue `/products/:id` réunit les champs catalogue, statut, prix, seuil/périssable, notes et galerie photo lorsque ces valeurs existent.

## Scan QR

Le scanner remplit le SKU depuis un QR lorsque le navigateur fournit la caméra et `BarcodeDetector`. Il ne s'agit pas actuellement d'un décodeur général de codes-barres.

## Réapprovisionnement et inventaire

Le seuil est comparé à la quantité d'inventaire pour signaler le stock faible. Créer un produit ne crée pas de stock ; ajoutez des lignes dans [Inventaire](inventory.md). Désactiver un produit conserve ses données.

## Smart Import

**Importer des produits** n'apparaît que si le tenant possède `SMART_IMPORT` (par défaut Growth/Enterprise ou surcharge plateforme).

1. Chargez un CSV normalisé ou un export Sortly.
2. Ajoutez éventuellement jusqu'à 4 000 caractères d'instructions.
3. Examinez la proposition structurée. Une couche IA peut participer ; sans clé fournisseur, des règles déterministes prennent le relais.
4. Résolvez catégories, emplacements, zones/bacs, SKU de variantes dupliqués, photos, emplacements manquants et lignes à revoir.
5. Ajustez les décisions déverrouillées, levez les blocages et envoyez.
6. Gardez le worker backend séparé actif pendant le suivi de progression.

La revue affiche confiance, suggestions, blocages, décisions créer/existant/défaut et photos. Le traitement est une tâche PostgreSQL durable et idempotente. Le résultat fournit les nombres créés, mis à jour, ignorés, en erreur et de photos, et peut produire un CSV des erreurs par ligne.

Il n'existe pas de modèle CSV téléchargeable dans l'interface actuelle. Conservez le CSV source et le résultat : un import ne se restaure pas en une seule opération.

## Permissions

La consultation exige `PRODUCTS.READ`, les mutations `PRODUCTS.WRITE`. Smart Import exige aussi `LOCATIONS.WRITE`, `INVENTORY.WRITE` et la fonctionnalité tenant. La création de catégorie est intégrée à cette page et suit l'autorisation catalogue correspondante.
