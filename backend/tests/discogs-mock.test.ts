import { describe, expect, it } from 'vitest';
import { MockDiscogsConnector } from '../src/integrations/discogs/discogs.mock';

describe('Mock Discogs connector', () => {
  it('returns the expected Daft Punk release', async () => {
    const connector = new MockDiscogsConnector();
    const releases = await connector.searchReleases('Daft Punk Discovery');
    expect(releases[0]).toMatchObject({ releaseId: '123456', artist: 'Daft Punk', title: 'Discovery', year: 2001 });
  });

  it('publishes a valid unit with a stable listing shape', async () => {
    const connector = new MockDiscogsConnector();
    const listing = await connector.publishListing({
      price: 35,
      currency: 'EUR',
      mediaCondition: 'Very Good+',
      sleeveCondition: 'Very Good',
      saleStatus: 'available',
      quantityAvailable: 1,
      product: { title: 'Discovery', artist: 'Daft Punk', format: '2xLP', discogsReleaseId: '123456' },
    });
    expect(listing.externalListingId).toMatch(/^discogs-listing-\d{4}$/);
    expect(listing.externalUrl).toContain('discogs.com/sell/item/');
  });
});
