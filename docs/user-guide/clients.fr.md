# Clients

Les clients sont les comptes sélectionnés lors de la création des commandes. Ouvrez **Opérations → Clients** (`/clients`).

## Parcourir

La recherche couvre société/e-mail et un filtre couvre le statut. Les cartes affichent société, statut, yacht, contact, e-mail, téléphone et limite de crédit, avec actions de modification, statut et suppression. Il n'existe pas de page de détail ou d'historique des commandes du client.

## Créer ou modifier

Nom de société, personne de contact et e-mail valide sont obligatoires. Sont facultatifs : yacht, téléphone, adresses de facturation/livraison par défaut, statut, conditions de paiement, limite de crédit et notes.

Actif, Suspendu et Inactif sont actuellement des métadonnées ; ils n'empêchent pas la sélection dans une nouvelle commande. Le formulaire charge au plus les 100 premiers clients et n'a pas de recherche client : vérifiez la fiche choisie.

Choisir le client d'une commande ne recopie pas actuellement son adresse de livraison ni son yacht ; saisissez-les explicitement.

## Supprimer

Un client ne peut pas être supprimé tant qu'une commande le référence, même terminée ou annulée. Changer le statut ne retire pas ce lien. Préférez Inactif si l'historique doit rester.

La lecture exige `CLIENTS.READ`, les modifications `CLIENTS.WRITE`.
