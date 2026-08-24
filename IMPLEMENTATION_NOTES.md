# Implementation notes

- Backend métier : `backend/src/api/*`
- Connecteur Discogs : `backend/src/integrations/discogs/*`
- Génération SKU : `backend/src/lib/sku.ts` + lifecycle `sellable-unit`
- Journalisation : `backend/src/lib/sync-log.ts`
- Frontend bonus : `frontend/src/main.tsx`
- PostgreSQL local : `docker-compose.yml`

Le code privilégie volontairement une architecture facilement lisible pendant une revue technique : controller Strapi -> connecteur/service -> persistance -> log.
