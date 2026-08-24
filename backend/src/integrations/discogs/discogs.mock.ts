import { validateListingInput } from './validation';
import type { DiscogsConnector, DiscogsRelease, ListingCandidate } from './discogs.types';

const RELEASE: DiscogsRelease = {
  releaseId: '123456',
  masterId: '999001',
  artist: 'Daft Punk',
  title: 'Discovery',
  year: 2001,
  country: 'France',
  format: '2xLP',
  label: 'Virgin',
};

let listingSequence = 1;

export class MockDiscogsConnector implements DiscogsConnector {
  async searchReleases(query: string): Promise<DiscogsRelease[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const haystack = `${RELEASE.artist} ${RELEASE.title} ${RELEASE.label}`.toLowerCase();
    return normalized.split(/\s+/).some((term) => haystack.includes(term)) ? [RELEASE] : [];
  }

  async getRelease(releaseId: string): Promise<DiscogsRelease> {
    if (releaseId !== RELEASE.releaseId) throw new Error(`Mock Discogs release ${releaseId} not found`);
    return RELEASE;
  }

  validateListingPayload(unit: ListingCandidate) {
    return validateListingInput(unit);
  }

  async publishListing(unit: ListingCandidate) {
    const validation = this.validateListingPayload(unit);
    if (!validation.valid) throw new Error(`Incomplete Discogs payload: ${validation.missingFields.join(', ')}`);
    const id = `discogs-listing-${String(listingSequence++).padStart(4, '0')}`;
    return { externalListingId: id, externalUrl: `https://www.discogs.com/sell/item/${id}` };
  }

  async markLocalSoldOrOutOfStock() {
    return { saleStatus: 'sold' as const, quantityAvailable: 0 as const };
  }
}
