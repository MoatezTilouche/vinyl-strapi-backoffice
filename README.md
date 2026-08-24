# Vinyl Ops — Test technique Strapi + Discogs

Implémentation complète de la tranche verticale demandée : **Strapi 5 + TypeScript + PostgreSQL + connecteur Discogs mockable**, avec une petite interface React/Vite en bonus.

## 1. Architecture

```text
React/Vite bonus (localhost:5173)
        |
        | REST
        v
Strapi 5 / TypeScript (localhost:1337)
        |
        +-- Tenant
        +-- Product (fiche catalogue)
        +-- SellableUnit (exemplaire vendable, SKU automatique)
        +-- ChannelListing (publication Discogs)
        +-- MarketplaceSyncEvent (journal persistant)
        |
        +-- integrations/discogs/
                DiscogsConnector
                MockDiscogsConnector
        |
        v
PostgreSQL 16 (Docker)
```

Le projet garde volontairement **Product** et **SellableUnit** séparés. Un listing marketplace est également un objet indépendant. Chaque objet métier est rattaché à un tenant et les opérations custom sont filtrées par `tenantId`.

## 2. Prérequis

- Node.js **22+**
- npm 10+
- Docker + Docker Compose

## 3. Installation

Depuis la racine :

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Remplacer les CHANGE_ME du backend/.env par des valeurs aléatoires.
# Exemple Linux/macOS : openssl rand -hex 32

docker compose up -d
npm run install:all
```

On Windows PowerShell, use these equivalent commands:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env

docker compose up -d
npm run install:all
```

Before starting Strapi, open `backend/.env` and replace every `CHANGE_ME` value
with a locally generated random value. Keep `DISCOGS_MODE=mock` and leave
`DISCOGS_TOKEN` empty for the offline test workflow. Make sure Docker is running
and PostgreSQL is healthy before launching the applications.

### Générer les secrets Strapi

Depuis PowerShell, exécuter cette commande à la racine du projet :

```powershell
node -e "const c=require('crypto'); console.log('APP_KEYS='+[1,2,3,4].map(()=>c.randomBytes(32).toString('base64')).join(',')); console.log('API_TOKEN_SALT='+c.randomBytes(32).toString('base64')); console.log('ADMIN_JWT_SECRET='+c.randomBytes(32).toString('base64')); console.log('TRANSFER_TOKEN_SALT='+c.randomBytes(32).toString('base64')); console.log('ENCRYPTION_KEY='+c.randomBytes(32).toString('base64')); console.log('JWT_SECRET='+c.randomBytes(32).toString('base64'));"
```

The command prints six lines. Copy the generated values into the matching
variables in `backend/.env`, replacing the existing values:

```env
APP_KEYS=<four comma-separated generated values>
API_TOKEN_SALT=<generated value>
ADMIN_JWT_SECRET=<generated value>
TRANSFER_TOKEN_SALT=<generated value>
ENCRYPTION_KEY=<generated value>
JWT_SECRET=<generated value>
```

Do not commit `backend/.env` or share these values. Generate a fresh set for
each environment. `DATABASE_PASSWORD` must match the PostgreSQL password in
the root `.env` or the default value in `docker-compose.yml`.

Puis lancer les deux applications :

```bash
npm run dev
```

- Interface bonus : http://localhost:5173
- Strapi : http://localhost:1337
- Admin Strapi : http://localhost:1337/admin

Au premier démarrage de Strapi, créer le compte administrateur demandé par l'interface Strapi.

Avec `SEED_DEMO=true`, un tenant **Demo Records** est créé automatiquement s'il n'existe pas.

## 4. Parcours de test recommandé

L'interface bonus permet de reproduire le workflow sans Postman :

1. ouvrir `http://localhost:5173` ;
2. sélectionner le tenant **Demo Records** ;
3. créer `Daft Punk — Discovery` ;
4. rechercher `Daft Punk Discovery` dans Discogs ;
5. associer la release mock `123456` à la fiche produit ;
6. aller dans **Inventaire** et créer une unité à 35 EUR ;
7. vérifier que le SKU est généré côté backend (`VIN-000001`, puis `VIN-000002`, ...) ;
8. cliquer sur **Vérifier** ;
9. cliquer sur **Publier** ;
10. vérifier le `ChannelListing` avec un id de type `discogs-listing-0001` ;
11. cliquer sur **Simuler vente** ;
12. vérifier que l'unité passe en `sold`, quantité `0`, et que le listing passe en `removed` ;
13. ouvrir **Sync logs** pour voir les `MarketplaceSyncEvent` persistés.

Les mêmes données sont consultables dans l'admin Strapi.

## 5. Endpoints métier

### Recherche release Discogs

```http
GET /api/discogs/search?tenantId=1&q=Daft%20Punk%20Discovery
```

### Associer une release à un produit

```http
POST /api/products/:id/attach-discogs-release
Content-Type: application/json

{
  "tenantId": 1,
  "releaseId": "123456"
}
```

### Vérifier la complétude

```http
POST /api/sellable-units/:id/check-discogs-completeness
Content-Type: application/json

{
  "tenantId": 1
}
```

### Publier sur Discogs (mock)

```http
POST /api/sellable-units/:id/publish-discogs
Content-Type: application/json

{
  "tenantId": 1
}
```

### Simuler une vente Discogs

```http
POST /api/sellable-units/:id/simulate-discogs-sale
Content-Type: application/json

{
  "tenantId": 1
}
```

### Endpoints utilisés par l'interface bonus

```text
GET  /api/backoffice/tenants
POST /api/backoffice/tenants
GET  /api/backoffice/dashboard?tenantId=1
GET  /api/backoffice/products?tenantId=1
POST /api/backoffice/products
GET  /api/backoffice/units?tenantId=1
POST /api/backoffice/products/:productId/units
GET  /api/backoffice/listings?tenantId=1
GET  /api/backoffice/sync-events?tenantId=1
```

## 6. Données Discogs mock

Le connecteur mock renvoie :

```json
{
  "releaseId": "123456",
  "masterId": "999001",
  "artist": "Daft Punk",
  "title": "Discovery",
  "year": 2001,
  "country": "France",
  "format": "2xLP",
  "label": "Virgin"
}
```

Une publication retourne un listing du type :

```json
{
  "externalListingId": "discogs-listing-0001",
  "externalUrl": "https://www.discogs.com/sell/item/discogs-listing-0001"
}
```

`DISCOGS_MODE=mock` est le mode par défaut. Le brief rend l'intégration réseau réelle optionnelle ; elle n'est donc pas activée dans cette version afin de garder le test déterministe et sans secret.

## 7. Modèles

### Tenant

`name`, `slug`, `active`.

### Product

`tenant`, `productType=vinyl`, `title`, `artist`, `description`, `label`, `year`, `country`, `format`, `catalogReference`, `discogsReleaseId`, `discogsMasterId`.

### SellableUnit

`tenant`, `product`, `sku`, `price`, `currency`, `mediaCondition`, `sleeveCondition`, `sellerComment`, `saleStatus`, `quantityAvailable`, `internalLocation`.

Le client ne fournit jamais le SKU : un lifecycle Strapi le remplace systématiquement par le prochain `VIN-XXXXXX`.

### ChannelListing

`tenant`, `sellableUnit`, `channel=discogs`, `externalListingId`, `externalUrl`, `status`, `publishedPrice`, `lastSyncAt`, `lastError`.

### MarketplaceSyncEvent

`tenant`, `channel`, `action`, `status`, relations optionnelles, `message`, `payload`, `eventDate`.

## 8. Tests

Tests unitaires rapides :

```bash
npm test
```

Couverture ciblée :

- génération SKU ;
- validation de complétude Discogs ;
- prix invalide ;
- recherche mock Discogs ;
- publication mock Discogs.

Un **test HTTP E2E du workflow critique** est également fourni. Après avoir lancé PostgreSQL + Strapi :

```bash
cd backend
npm run test:e2e
```

Il crée ses propres données et vérifie : création tenant/produit/unité, recherche Discogs, association de la release, complétude, publication, `externalListingId`, vente simulée, listing retiré et présence des quatre événements métier obligatoires.

## 9. Choix multi-tenant

Pour cette tranche technique, l'isolation est simple mais explicite : les queries métier custom utilisent systématiquement le couple `resource id + tenantId`, par exemple :

```ts
where: {
  id: unitId,
  tenant: { id: tenantId }
}
```

Une ressource d'un tenant ne doit donc pas être trouvée depuis un autre tenant dans le workflow custom.

## 10. Health-check

Une route de diagnostic minimale permet de confirmer que Strapi et PostgreSQL sont joignables :

```http
GET /api/backoffice/health
```

Réponse attendue : `status=ok` et `database=reachable`.

## 11. Sécurité / limite assumée du test

Les routes du **workflow de démonstration** sont déclarées avec `auth: false` afin que le front bonus fonctionne immédiatement sans implémenter un système de rôles hors scope. Ce choix est volontaire pour le test de 8 h.

En production, ces routes seraient protégées par l'authentification Strapi et une policy de tenant basée sur l'utilisateur authentifié ; `tenantId` ne serait pas considéré comme une preuve d'autorisation.

## 12. Limite connue du SKU

Le générateur `VIN-000001` lit le dernier SKU et l'incrémente. C'est simple et lisible pour ce test. En environnement fortement concurrent, il faudrait utiliser une séquence PostgreSQL ou un compteur transactionnel pour garantir l'atomicité.

## 13. Hors scope respecté

Aucun Fnac, Amazon, Stripe, commande, livraison, email, CMS custom, BullMQ, S3, fiscalité ou règles de prix avancées n'a été ajouté.
