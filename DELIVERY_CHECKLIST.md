# Checklist de livraison — Test technique Vinyle + Discogs

## Obligatoire

- [x] TypeScript
- [x] Strapi
- [x] PostgreSQL
- [x] README d'installation et de démonstration
- [x] `.env.example` documenté, sans token Discogs ni secret réel
- [x] Docker Compose PostgreSQL
- [x] seed simple d'un tenant de test
- [x] `Tenant` : nom, slug, actif/inactif
- [x] `Product` catalogue vinyle, rattaché au tenant
- [x] `SellableUnit` séparée, rattachée au tenant et au produit
- [x] SKU backend automatique `VIN-000001`
- [x] prix / EUR par défaut / états disque et pochette / commentaire / statut / quantité / localisation
- [x] `ChannelListing` Discogs séparé
- [x] `MarketplaceSyncEvent` persistant
- [x] logs recherche release
- [x] logs vérification complétude
- [x] logs publication listing
- [x] logs mise hors stock locale
- [x] connecteur Discogs isolé derrière une interface
- [x] `searchReleases`
- [x] `getRelease`
- [x] `validateListingPayload`
- [x] `publishListing`
- [x] `markLocalSoldOrOutOfStock`
- [x] mode mock par défaut
- [x] mock Daft Punk / Discovery / release `123456`
- [x] publication mock avec `externalListingId`
- [x] endpoints custom du workflow
- [x] scoping métier par `tenantId`
- [x] refus d'un tenant inactif sur les actions métier
- [x] simulation vente => `sold`, quantité `0`
- [x] listing Discogs => `removed` après vente simulée
- [x] route health-check

## Recommandé / qualité

- [x] tests unitaires SKU
- [x] tests unitaires complétude
- [x] tests prix invalide
- [x] tests connecteur Discogs mock
- [x] test HTTP E2E du workflow critique
- [x] aucune logique Discogs dans les controllers métier
- [x] erreurs explicites et validation basique des entrées
- [x] README avec limites assumées

## Bonus

- [x] interface web React/Vite
- [x] dashboard
- [x] catalogue produits
- [x] inventaire unités vendables
- [x] listings Discogs
- [x] logs de synchronisation
- [x] workflow utilisable sans Postman

## Hors scope volontairement non implémenté

- [x] Fnac
- [x] Amazon
- [x] Stripe
- [x] commandes / livraison
- [x] email
- [x] CMS custom
- [x] multi-rôle avancé
- [x] BullMQ
- [x] S3
- [x] fiscalité
- [x] documents
- [x] règles de prix avancées

## Avant remise

1. Copier les fichiers `.env.example` vers `.env`.
2. Remplacer les `CHANGE_ME` par des valeurs aléatoires locales.
3. `docker compose up -d`.
4. `npm run install:all`.
5. `npm test`.
6. `npm run dev`.
7. Vérifier `GET /api/backoffice/health`.
8. Exécuter `cd backend && npm run test:e2e`.
9. Rejouer le scénario depuis le frontend.
10. Ne jamais committer les vrais fichiers `.env`.
