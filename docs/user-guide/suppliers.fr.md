# Fournisseurs

Les fournisseurs sont les contacts d'achat du tenant. Ouvrez **Opérations → Fournisseurs** (`/suppliers`).

## Parcourir

Recherchez par nom et filtrez actif/inactif. Les cartes proposent modification et suppression. L'état actif se change dans le formulaire ; il n'existe pas d'interrupteur rapide sur la carte.

## Créer ou modifier

Le nom est obligatoire. Contact, e-mail, téléphone, adresse, site HTTP(S), notes et état actif sont facultatifs.

L'application actuelle n'expose ni lien fournisseur-produit, ni fournisseur principal, SKU fournisseur, historique de prix, commande d'achat ou performance fournisseur. Une modification ici ne met pas à jour un produit.

## Supprimer ou désactiver

La suppression retire la fiche après validation serveur. Désactivez-la si vous devez conserver son contexte opérationnel. Les produits n'ont actuellement pas de relation fournisseur manipulable dans cette interface.

La lecture exige `SUPPLIERS.READ`, les modifications `SUPPLIERS.WRITE`.
