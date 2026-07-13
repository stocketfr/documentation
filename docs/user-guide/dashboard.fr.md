# Tableau de bord

La racine du tenant (`/`) fournit un résumé opérationnel :

- nombres de produits, emplacements, lignes d'inventaire et stocks faibles ;
- produits en stock faible ;
- mouvements de stock récents ;
- liste limitée des commandes actives/en attente ;
- graphique du stock par emplacement.

Le tableau exige `DASHBOARD.READ`. Ses cartes dépendent aussi des API Produits, Emplacements, Inventaire, Mouvements et Commandes. Selon les permissions du rôle et l'activation des Commandes, certaines données peuvent être indisponibles. La carte filtre les 10 premières commandes renvoyées selon les statuts actifs et en affiche au plus cinq : ce n'est pas un total de commandes.

Un stock est faible lorsque la quantité est inférieure ou égale au seuil de réapprovisionnement du produit. Le graphique actuel s'appuie sur le résultat limité des stocks faibles : ce n'est ni une valorisation ni un rapport exhaustif.

Utilisez les pages de chaque module pour les listes et filtres de référence ; le tableau est une vue de signal rapide.
