# Mouvements de stock

Mouvements (`/stock-movements`) est un registre manuel de traçabilité. Il note pourquoi une quantité s'est déplacée entre emplacements, mais ne représente pas le solde actuel.

## Enregistrer un mouvement

Le formulaire accepte :

- produit et quantité entière positive ;
- motif ;
- emplacements source et destination facultatifs ;
- coût unitaire, référence et notes facultatifs.

L'interface actuelle n'expose pas le lien de commande pourtant prévu dans le DTO.

Motifs : Réception achat, Vente, Perte, Endommagé, Expiré, Correction de comptage, Retour client, Retour fournisseur et Transfert interne.

## Parcourir

Le tableau affiche date, produit/SKU, source → destination, quantité, motif et référence. Filtrez par un motif, produit ou emplacement. Coût, utilisateur, notes, commande et vue détaillée ne sont pas affichés ; aucune exportation/rapport n'est disponible.

## Relation avec l'inventaire

!!! warning
    Insérer un mouvement n'ajuste pas l'inventaire. Ajuster l'inventaire n'ajoute pas de mouvement.

Pour réception, vente, correction, retour ou transfert, modifiez explicitement les lignes d'inventaire. Un transfert décrémente normalement la source, crée/incrémente la destination, puis ajoute éventuellement un mouvement. Ces étapes ne sont pas atomiques : vérifiez le résultat.

La lecture exige `STOCK_MOVEMENTS.READ`, l'enregistrement `STOCK_MOVEMENTS.WRITE`.
