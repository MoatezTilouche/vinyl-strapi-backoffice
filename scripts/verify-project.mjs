import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const ok = [];

function check(condition, label) {
  if (condition) ok.push(label);
  else failures.push(label);
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function json(rel) {
  return JSON.parse(read(rel));
}

const requiredFiles = [
  'README.md',
  '.env.example',
  'docker-compose.yml',
  'backend/.env.example',
  'frontend/.env.example',
  'backend/src/integrations/discogs/discogs.types.ts',
  'backend/src/integrations/discogs/discogs.mock.ts',
  'backend/tests/sku.test.ts',
  'backend/tests/discogs-validation.test.ts',
  'backend/tests/discogs-mock.test.ts',
  'backend/tests/workflow.e2e.test.ts',
];
for (const file of requiredFiles) check(exists(file), `file: ${file}`);

const schemas = {
  tenant: ['name', 'slug', 'active'],
  product: ['tenant', 'productType', 'title', 'artist', 'description', 'label', 'year', 'country', 'format', 'catalogReference', 'discogsReleaseId', 'discogsMasterId'],
  'sellable-unit': ['tenant', 'product', 'sku', 'price', 'currency', 'mediaCondition', 'sleeveCondition', 'sellerComment', 'saleStatus', 'quantityAvailable', 'internalLocation'],
  'channel-listing': ['tenant', 'sellableUnit', 'channel', 'externalListingId', 'externalUrl', 'status', 'publishedPrice', 'lastSyncAt', 'lastError'],
  'marketplace-sync-event': ['tenant', 'channel', 'action', 'status', 'product', 'sellableUnit', 'channelListing', 'message', 'payload', 'eventDate'],
};

for (const [name, fields] of Object.entries(schemas)) {
  const rel = `backend/src/api/${name}/content-types/${name}/schema.json`;
  check(exists(rel), `schema: ${name}`);
  if (!exists(rel)) continue;
  const attrs = json(rel).attributes ?? {};
  for (const field of fields) check(Object.hasOwn(attrs, field), `${name}.${field}`);
}

const sellable = json('backend/src/api/sellable-unit/content-types/sellable-unit/schema.json').attributes;
check(sellable.sku?.unique === true, 'SKU unique');
check(sellable.currency?.default === 'EUR', 'currency defaults to EUR');
check(sellable.quantityAvailable?.default === 1, 'quantity defaults to 1');
check(sellable.saleStatus?.enum?.includes('sold'), 'sale statuses include sold');

const listing = json('backend/src/api/channel-listing/content-types/channel-listing/schema.json').attributes;
for (const status of ['not_published', 'pending', 'published', 'failed', 'removed', 'sync_error']) {
  check(listing.status?.enum?.includes(status), `listing status: ${status}`);
}

const sync = json('backend/src/api/marketplace-sync-event/content-types/marketplace-sync-event/schema.json').attributes;
for (const action of ['search_release', 'check_completeness', 'publish_listing', 'mark_local_out_of_stock']) {
  check(sync.action?.enum?.includes(action), `sync action: ${action}`);
}

const lifecycle = read('backend/src/api/sellable-unit/content-types/sellable-unit/lifecycles.ts');
check(lifecycle.includes('generateNextSku'), 'SKU generated backend-side');

const types = read('backend/src/integrations/discogs/discogs.types.ts');
for (const method of ['searchReleases', 'getRelease', 'validateListingPayload', 'publishListing', 'markLocalSoldOrOutOfStock']) {
  check(types.includes(method), `DiscogsConnector.${method}`);
}

const mock = read('backend/src/integrations/discogs/discogs.mock.ts');
for (const expected of ['Daft Punk', 'Discovery', "releaseId: '123456'", 'discogs-listing-']) {
  check(mock.includes(expected), `Discogs mock contains ${expected}`);
}

const routes = [
  read('backend/src/api/discogs/routes/discogs.ts'),
  read('backend/src/api/product/routes/01-custom-product.ts'),
  read('backend/src/api/sellable-unit/routes/01-custom-sellable-unit.ts'),
].join('\n');
for (const route of ['/discogs/search', '/products/:id/attach-discogs-release', '/sellable-units/:id/check-discogs-completeness', '/sellable-units/:id/publish-discogs', '/sellable-units/:id/simulate-discogs-sale']) {
  check(routes.includes(route), `route: ${route}`);
}

const controllers = [
  read('backend/src/api/backoffice/controllers/backoffice.ts'),
  read('backend/src/api/product/controllers/product.ts'),
  read('backend/src/api/sellable-unit/controllers/sellable-unit.ts'),
].join('\n');
check(controllers.includes("tenant: { id: tenantId }"), 'business queries are tenant-scoped');
check(controllers.includes('active: true'), 'active tenant guard exists');

const backendEnv = read('backend/.env.example');
check(!/DISCOGS_TOKEN=\S+/.test(backendEnv), 'Discogs token not hardcoded');
check(!backendEnv.includes('dev-admin-jwt-secret'), 'application secret placeholder is not a real-looking dev secret');

console.log(`Verified ${ok.length} checks.`);
if (failures.length) {
  console.error(`\n${failures.length} failed check(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Project structure matches the technical-test checklist.');
