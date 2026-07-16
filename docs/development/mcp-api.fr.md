# Architecture IA et MCP

Stocket ajoute une frontière applicative Model Context Protocol (MCP) afin
qu'un assistant IA puisse agir sur les données d'inventaire avec les mêmes
règles métier que l'application web. La cible est MCP `2025-11-25`, exposé à
l'hôte IA propriétaire via `/api/v1/mcp`.

!!! warning "Périmètre actuel"
    L'endpoint actuel est un prototype produit authentifié et same-origin pour
    l'application Stocket intégrée. Ce n'est pas un serveur MCP distant public,
    et le système durable de change sets nécessaire aux commandes bulk sûres
    n'est pas encore implémenté. Les sections suivantes distinguent le
    comportement actuel de l'architecture cible.

## Implémentation actuelle

La première tranche valide le transport Streamable HTTP, l'intégration Effect,
l'identité attachée à la requête, les schémas typés et l'adaptateur du service
produit. Elle expose ces outils produit :

| Outil | Comportement actuel | Confirmation et récupération |
|-------|---------------------|------------------------------|
| `products_list` | Rechercher et paginer les produits | Lecture seule |
| `products_get` | Lire un produit actif ou archivé | Lecture seule |
| `products_create` | Créer un produit | Renvoie une instruction pour l'archiver |
| `products_update` | Modifier certains champs d'un produit | Renvoie les anciennes valeurs modifiables ; best-effort uniquement |
| `products_archive` | Déplacer un produit vers la corbeille | Demande une confirmation claire ; peut être restauré |
| `products_restore` | Restaurer un produit depuis la corbeille | Peut être archivé à nouveau |

Les middlewares Better Auth et de tenant habituels authentifient chaque
requête. Une session MCP est liée à l'utilisateur, au tenant, à la destination
et à l'origine vérifiés lors de sa création, et les permissions sont revérifiées
à chaque appel d'outil. Les identifiants utilisateur et tenant ne sont jamais
des arguments d'outil contrôlés par le modèle.

Les sessions vivent actuellement dans la mémoire du processus API et expirent
après 30 minutes d'inactivité. La mise à l'échelle horizontale en production
nécessite donc un routage sticky pour le transport de session complet, ou une
conception de transport partagé ou stateless.

Les instructions inverses renvoyées aujourd'hui sont des indications UI utiles,
pas une garantie durable d'annulation. Elles peuvent disparaître avec la
conversation et l'inversion d'une mise à jour pourrait écraser un travail plus
récent. Le renommage, déplacement, archivage, import et toute autre commande
bulk à fort impact doivent attendre le système transactionnel de change sets.

## Principes de conception

- MCP est un adaptateur au-dessus des services de domaine Effect propriétaires.
  Il n'est pas généré depuis les routes HTTP et n'appelle pas directement les
  repositories fonctionnels.
- Exposer des requêtes et commandes étroites et sémantiques plutôt qu'un CRUD
  générique, du SQL, des changements de statut arbitraires ou l'exécution brute
  de tâches.
- Décoder l'entrée externe une seule fois avec Effect Schema et renvoyer une
  sortie structurée concise contenant des identifiants et versions stables.
- Conserver les clôtures de tenant, permissions, fonctionnalités, transactions,
  garanties d'idempotence et invariants métier dans les services applicatifs
  afin que toutes les interfaces puissent les réutiliser.
- Traiter les annotations MCP comme des indications pour le modèle et l'UI. Le
  serveur continue d'imposer chaque règle d'autorisation et de sécurité.
- Ne jamais exposer la suppression définitive, les secrets, les jetons de
  session, l'accès brut à la base ou les contrôles superadmin de la plateforme
  à l'assistant du tenant.

## Architecture du protocole

```mermaid
flowchart LR
  Client["Hôte IA Stocket / client MCP"] --> Transport["Adaptateur Streamable HTTP"]
  Transport --> Scope["Acteur, tenant, locale et capacités vérifiés"]
  Scope --> Registry["Registre de capacités filtré par permissions"]
  Registry --> Query["Requête typée"]
  Registry --> Command["Commande typée"]
  Query --> Domain["Service de domaine Effect propriétaire"]
  Command --> Changes["Service d'exécution des changements"]
  Changes --> Proposal["Proposition immuable"]
  Proposal --> Policy["Politique d'approbation"]
  Policy --> Apply["Application transactionnelle"]
  Apply --> Domain
  Apply --> History["Historique et annulation"]
```

Le module MCP possède le cycle de vie du protocole, le transport, la négociation
des capacités, les codecs de schéma, l'enregistrement filtré, l'elicitation et
le rendu sûr des erreurs de protocole. Les modules de domaine possèdent la
correction métier, la persistance, les transactions et les compensations. Le
service de change sets est une capacité applicative partagée avec les actions
UI normales, pas du code de rollback propre à MCP.

L'adaptateur actuel conserve Tool, Toolkit, Schema et le runtime Effect de
`@effect/ai` comme modèle applicatif, tout en utilisant le SDK TypeScript MCP
officiel pour le transport et les contrôles de sécurité du protocole plus
récent. Ce pont pourra être réévalué lorsque le transport Effect natif installé
offrira un comportement équivalent.

## Modèle de capacités MCP

| Primitive | Propriétaire de l'interaction | Usage Stocket |
|-----------|-------------------------------|---------------|
| Outils | Contrôlés par le modèle | Recherches, calculs et commandes métier nommées |
| Ressources | Contrôlées par l'application | Snapshots stables d'entité, proposition, change set et opération |
| Prompts | Contrôlés par l'utilisateur | Workflows optionnels sélectionnés par l'utilisateur |
| Elicitation | UI demandée par le serveur | Approbation claire et configuration sécurisée d'intégration |
| Tâches | Contrôlées par le demandeur, expérimentales | Vue optionnelle des opérations durables Stocket |
| Progression | Liée à la requête | Retour borné pour validation, imports et travaux bulk |

Les opérations applicatives restent la source de vérité du travail reprenable.
Les tâches MCP pourront plus tard adapter ces opérations pour les clients
compatibles, mais ne sont ni une file d'exécution, ni un historique, ni un
registre d'annulation.

## Définitions de capacités typées

Chaque capacité doit avoir une définition réutilisable unique qui dérive ses
schémas Effect d'entrée et de sortie, son descripteur MCP, ses annotations, sa
politique d'accès, sa politique de sécurité, son handler et ses tests de
conformité. Les registres fonctionnels se composent ensuite dans le registre du
serveur.

```ts
const updateProduct = defineMcpCommand({
  name: "products_update",
  input: UpdateProductInput,
  output: ProductCommandResult,
  access: productWriteAccess,
  safety: reversibleWrite,
  execute: ({ input }) => ProductsService.update(input),
})

const productsMcp = defineMcpFeature({
  domain: "products",
  capabilities: [searchProducts, getProduct, updateProduct],
})
```

Les schémas MCP sont des contrats de frontière JSON-native. Les parseurs de
requêtes HTTP et les formes de lignes de base ne doivent pas être réutilisés si
leur représentation filaire ne convient pas. Les handlers appellent le service
propriétaire, tandis que la traduction pure des représentations reste dans les
mappers locaux à la fonctionnalité.

## Nommage, découverte et toolkits

Les noms d'outils utilisent `<domaine_pluriel>_<intention>` en snake case, par
exemple `products_search`, `products_update_many`, `inventory_transfer` et
`change_sets_undo`. La cardinalité apparaît dans le nom lorsqu'elle modifie le
contrat ou la politique de sécurité. Un contrat cassant reçoit une version
parallèle plutôt qu'une modification incompatible sur place.

`products_list` est le nom actuel du prototype et doit devenir
`products_search` avant la release externe. Un manifeste de contrat généré
rendra visibles dans la CI les changements accidentels de nom et de schéma.

Le catalogue est filtré selon l'acteur authentifié, les permissions du tenant,
les fonctionnalités activées, les scopes distants le cas échéant, le toolkit
sélectionné et la maturité du workflow sous-jacent :

| Toolkit | Surface prévue |
|---------|----------------|
| Par défaut | Contexte du workspace, données catalogue, lecture d'inventaire et historique des changements |
| Opérations | Commandes d'inventaire, commandes client, fulfillment, imports et opérations longues |
| Administration | Utilisateurs, rôles et workflows de sécurité du tenant dans une expérience admin dédiée |
| Opérateur | Opérations superadmin de plateforme sur un serveur distinct, s'il est un jour créé |

Le filtrage améliore la sélection du modèle ; ce n'est pas une autorisation. Le
serveur réautorise chaque invocation et contrôle les commandes à nouveau juste
avant une écriture. Une session ou un toolkit peut réduire l'accès, mais ne peut
pas accorder de nouveaux privilèges. L'hôte IA propriétaire peut sélectionner
progressivement les schémas pertinents pour le modèle, tandis que le serveur
conserve des outils directs et typés plutôt qu'une échappatoire générique
`call_tool`.

## Confirmation et changements durables

La confirmation évite une action involontaire. L'annulation permet de récupérer
après qu'une action voulue a produit un résultat inattendu. Les workflows à fort
impact ont besoin des deux.

Toute commande IA qui modifie l'état métier utilisera ce cycle de vie :

1. **Planifier :** résoudre une cible déterministe et persister une proposition
   immuable et expirante avec ses entrées, données avant/après, versions, compte
   et hash.
2. **Autoriser :** évaluer les permissions actuelles du tenant, les
   fonctionnalités, le scope client et la politique propre à l'opération.
3. **Approuver si nécessaire :** lier un grant d'approbation à usage unique à
   l'acteur, au tenant, au hash de proposition, au client et à l'expiration. Une
   valeur `confirmed: true` fournie par le modèle ne suffit jamais.
4. **Appliquer :** réautoriser et consommer atomiquement le grant, vérifier les
   versions de lignes, appliquer les écritures métier dans une transaction et
   persister les éléments de changement et leurs résultats.
5. **Rapporter :** renvoyer les nombres réellement affectés, les conflits,
   l'identifiant durable du change set et l'action de récupération disponible.

Les écritures à faible risque peuvent passer directement de la planification à
l'application lorsque la politique le permet. Les commandes destructrices,
sensibles, externes ou bulk exigent une approbation explicite. La cible confirmée
n'est jamais recalculée silencieusement ; une proposition obsolète expire ou
renvoie un conflit afin que l'utilisateur examine une nouvelle prévisualisation.

### Approbation présentée à l'utilisateur

Les utilisateurs non techniques doivent approuver des effets métier, pas des
appels d'outils ou des identifiants de base. Une confirmation doit indiquer :

- l'action et le type d'objet affecté dans la langue de l'utilisateur ;
- le compte exact, le périmètre, les filtres, la destination et les exceptions
  importantes ;
- des exemples représentatifs avec des détails dépliables pour les grands
  ensembles ;
- le résultat visible, le comportement atomique ou par lots et les effets
  externes ;
- si l'action peut être annulée, sous quelles conditions et pendant combien de
  temps ; et
- un libellé affirmatif précis, comme **Déplacer 84 produits vers Lyon**.

Dans l'application intégrée, l'elicitation de formulaire MCP peut afficher des
prompts simples. Pour les flux distants ou plus riches, l'acceptation doit avoir
lieu sur une page Stocket authentifiée qui émet le grant durable à usage unique.
Un client distant peut automatiser ou déformer l'elicitation de formulaire ;
elle ne constitue donc pas à elle seule une preuve fiable d'approbation.

### Annulation et concurrence

L'annulation crée un nouveau change set d'inversion ; elle ne modifie jamais
l'historique et ne restaure pas une sauvegarde de base. L'inversion traite les
éléments d'origine dans un ordre sûr pour les dépendances et emploie des versions
de lignes monotones avec des contrôles compare-and-swap. Si un travail humain ou
IA plus récent a modifié une entité, le comportement par défaut est un conflit
atomique plutôt que l'écrasement de ce travail.

Les mises à jour et déplacements restaurent les anciennes valeurs capturées.
Les archivages restaurent l'état d'archive précédent. Inverser une création
effectue un archivage compensatoire, pas une suppression définitive, et des
identifiants comme un SKU peuvent rester réservés. Certains effets externes ne
peuvent pas être inversés ; cela doit être annoncé avant l'approbation.
L'annulation n'est donc disponible que si l'opération définit une compensation
sûre, si la durée de rétention reste ouverte et si les versions produites sont
toujours actuelles.

Le journal d'audit, l'état de conversation, la session MCP et l'état d'une tâche
MCP ne stockent pas le rollback. Les enregistrements transactionnels de change
set et de ses éléments sont la source de vérité durable.

## Barrières de sécurité par domaine

| Domaine | Capacités prévues | Barrière avant l'exposition des écritures |
|---------|-------------------|-------------------------------------------|
| Produits et catalogue | Rechercher, créer, modifier, archiver, restaurer et organiser en masse | Change sets durables et versionnés avant toute mutation bulk ; aucune suppression définitive |
| Inventaire | Réceptionner, ajuster, compter, réserver, libérer et transférer le stock | Une opération stock atomique doit mettre à jour les positions et l'historique des mouvements ensemble |
| Commandes | Lire et exécuter des transitions de fulfillment nommées | Validation propre à l'état, compensation et transitions compare-and-swap ; aucun setter de statut arbitraire |
| Imports | Prévisualiser, valider, mapper et appliquer de grands jeux de données | Opération persistée, contrat explicite de lots/atomicité, checkpoints et lien vers le change set |
| Enrichissement externe | Trouver des adresses, fournisseurs ou données catalogue | Prévisualisation open-world avec provenance, puis patch closed-world vérifié |
| Administration tenant | Rôles, invitations, sessions et workflows de sécurité | Toolkit admin dédié et frontières de services sûres pour le tenant |
| Opérations plateforme | Workflows inter-tenants et superadmin | Exclus du serveur tenant ; frontière opérateur séparée si elle est un jour créée |

Les mutations d'inventaire et la création de l'historique des mouvements sont
actuellement des chemins séparés ; aucun des deux ne peut donc être exposé
directement en sécurité. Un workflow `StockOperations` et des contraintes de
position/version en base doivent d'abord en faire une transaction unique. Les
commandes client exposent de même uniquement des commandes nommées comme mettre
en attente, reprendre, annuler, préparer et expédier après création des
invariants et comportements de récupération de chaque transition.

Les informations externes n'écrivent jamais directement dans Stocket.
L'assistant renvoie d'abord des candidats avec source, date et confiance, puis
propose un patch typé normal à vérifier. Les secrets fournisseur et la
configuration OAuth passent par une elicitation URL sécurisée, et le jeton
Bearer MCP n'est jamais transmis à un fournisseur externe.

## Identité, tenancy et accès distant

L'endpoint intégré s'appuie sur l'acteur vérifié de la requête applicative, le
middleware tenant, les contrôles same-origin et des sessions liées à
l'utilisateur et au tenant. Les entrées d'outil ne peuvent pas choisir le
workspace ni usurper un autre utilisateur. L'autorisation est évaluée lors de
la découverte, de l'invocation, au démarrage d'un worker et avant chaque
checkpoint d'écriture repris.

Les clients distants arbitraires relèvent d'un travail futur. Un endpoint public
nécessite les métadonnées OAuth de ressource protégée, OAuth 2.1 avec PKCE, des
indicateurs de ressource et la validation d'audience, des grants à scopes, une
politique d'enregistrement des clients, la révocation des jetons, des limites de
débit et le suivi des abus. Jusqu'à la fin de ce travail et d'une revue de
sécurité, `/api/v1/mcp` doit rester un endpoint applicatif propriétaire.

## Ressources et opérations longues

Des ressources stables donneront aux clients des snapshots référençables tels
que `stocket://workspace/context`, les produits et emplacements, les positions
d'inventaire, les commandes, les change sets et les opérations. Les lectures
restent disponibles comme outils pour les clients centrés sur les outils ; les
ressources sont les liens canoniques vers les détails d'entité et de workflow.

Les grands imports ou opérations peuvent s'exécuter en lots persistés. Leur
prévisualisation et leur résultat doivent annoncer une atomicité plus faible
lorsqu'une transaction unique est impraticable. Les workers reconstruisent
l'acteur de confiance et réautorisent avant le travail et chaque checkpoint
d'écriture. Les tâches MCP et la progression optionnelles peuvent représenter
ce cycle sans remplacer l'opération applicative ou sa politique de rétention.

## Séquence de livraison

1. Consolider la tranche produit actuelle derrière des factories de requêtes et
   commandes typées, un registre filtré par permissions et un manifeste de
   contrat généré.
2. Renommer `products_list` en `products_search`, ajouter les contrats de curseur
   et conserver le comportement mono-produit couvert par les tests de conformité.
3. Implémenter les change sets versionnés et transactionnels, les propositions
   immuables, les grants d'approbation à usage unique et les change sets
   d'inversion.
4. Migrer les écritures produit vers le pipeline durable, puis activer les
   commandes bulk produit vérifiées.
5. Ajouter les surfaces de lecture sûres pour catégories, emplacements, zones,
   fournisseurs, clients, inventaire, commandes, activité et opérations.
6. Construire les opérations stock atomiques, les transitions de commande
   nommées, les imports durables et l'enrichissement externe en deux étapes avant
   d'exposer leurs commandes.
7. Ajouter les ressources, abonnements et tâches MCP optionnelles uniquement
   lorsque leur cycle de vie complet est implémenté.
8. Ajouter les scopes OAuth et le durcissement des clients distants avant de
   publier une intégration MCP distante.

## Attentes de test

- Les tests du registre imposent l'unicité des noms, la stabilité des schémas,
  les annotations explicites, les métadonnées de permission et l'appartenance
  aux toolkits.
- Les tests de l'adaptateur couvrent le décodage, la validation de sortie, la
  neutralisation des erreurs, le scope d'invocation, l'échec de confirmation et
  les capacités client non prises en charge.
- Chaque fonctionnalité passe une suite de conformité partagée pour l'isolation
  des tenants, l'autorisation, l'idempotence, les versions obsolètes et la sortie
  structurée.
- Les tests d'intégration des change sets utilisent une vraie base pour prouver
  l'application atomique, les retries, la consommation d'approbation, les
  conflits concurrents et le comportement d'inversion.
- Les évaluations de sélection par le modèle vérifient que les demandes en
  langage courant sélectionnent l'outil étroit prévu et ne contournent pas la
  confirmation.

Voir [Architecture](architecture.md), [Développement API](api-development.md) et
[Tests](testing.md) pour les conventions plus larges de la plateforme.

## Références du protocole

- [Outils MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [Ressources MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/resources)
- [Elicitation MCP](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)
- [Tâches MCP](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks)
- [Autorisation MCP](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [Transport Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
