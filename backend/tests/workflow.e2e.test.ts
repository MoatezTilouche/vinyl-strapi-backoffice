import { describe, expect, it } from 'vitest';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:1337';
const RUN_E2E = process.env.RUN_E2E === 'true';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${path}: ${JSON.stringify(body)}`);
  }
  return body as T;
}

const run = RUN_E2E ? describe : describe.skip;

run('critical Discogs workflow (HTTP E2E)', () => {
  it('creates data, publishes a listing, simulates a sale and persists logs', async () => {
    const suffix = Date.now();

    const tenantRes = await api<{ data: { id: number } }>('/api/backoffice/tenants', {
      method: 'POST',
      body: JSON.stringify({ name: `E2E Records ${suffix}`, slug: `e2e-records-${suffix}` }),
    });
    const tenantId = tenantRes.data.id;

    const productRes = await api<{ data: { id: number } }>('/api/backoffice/products', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        title: 'Discovery',
        artist: 'Daft Punk',
        year: 2001,
        country: 'France',
        format: '2xLP',
        label: 'Virgin',
      }),
    });
    const productId = productRes.data.id;

    const search = await api<{ data: Array<{ releaseId: string }> }>(
      `/api/discogs/search?tenantId=${tenantId}&q=${encodeURIComponent('Daft Punk Discovery')}`,
    );
    expect(search.data.some((release) => release.releaseId === '123456')).toBe(true);

    const attached = await api<{ data: { discogsReleaseId: string } }>(
      `/api/products/${productId}/attach-discogs-release`,
      {
        method: 'POST',
        body: JSON.stringify({ tenantId, releaseId: '123456' }),
      },
    );
    expect(attached.data.discogsReleaseId).toBe('123456');

    const unitRes = await api<{ data: { id: number; sku: string } }>(
      `/api/backoffice/products/${productId}/units`,
      {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          price: 35,
          currency: 'EUR',
          mediaCondition: 'Very Good Plus (VG+)',
          sleeveCondition: 'Very Good (VG)',
          sellerComment: 'E2E technical-test unit',
        }),
      },
    );
    const unitId = unitRes.data.id;
    expect(unitRes.data.sku).toMatch(/^VIN-\d{6}$/);

    const completeness = await api<{ data: { valid: boolean; missingFields: string[] } }>(
      `/api/sellable-units/${unitId}/check-discogs-completeness`,
      { method: 'POST', body: JSON.stringify({ tenantId }) },
    );
    expect(completeness.data).toEqual({ valid: true, missingFields: [] });

    const listingRes = await api<{ data: { externalListingId: string; status: string } }>(
      `/api/sellable-units/${unitId}/publish-discogs`,
      { method: 'POST', body: JSON.stringify({ tenantId }) },
    );
    expect(listingRes.data.externalListingId).toMatch(/^discogs-listing-\d{4}$/);
    expect(listingRes.data.status).toBe('published');

    const soldRes = await api<{ data: { saleStatus: string; quantityAvailable: number } }>(
      `/api/sellable-units/${unitId}/simulate-discogs-sale`,
      { method: 'POST', body: JSON.stringify({ tenantId }) },
    );
    expect(soldRes.data.saleStatus).toBe('sold');
    expect(soldRes.data.quantityAvailable).toBe(0);

    const listings = await api<{ data: Array<{ id: number; status: string }> }>(
      `/api/backoffice/listings?tenantId=${tenantId}`,
    );
    expect(listings.data.some((listing) => listing.status === 'removed')).toBe(true);

    const logs = await api<{ data: Array<{ action: string; status: string }> }>(
      `/api/backoffice/sync-events?tenantId=${tenantId}`,
    );
    const successfulActions = new Set(
      logs.data.filter((event) => event.status === 'success').map((event) => event.action),
    );
    expect(successfulActions.has('search_release')).toBe(true);
    expect(successfulActions.has('check_completeness')).toBe(true);
    expect(successfulActions.has('publish_listing')).toBe(true);
    expect(successfulActions.has('mark_local_out_of_stock')).toBe(true);
  }, 30_000);
});
