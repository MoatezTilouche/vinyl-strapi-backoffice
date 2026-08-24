export interface DiscogsRelease {
  releaseId: string;
  masterId?: string;
  artist: string;
  title: string;
  year: number;
  country: string;
  format: string;
  label: string;
}

export interface DiscogsListingResult {
  externalListingId: string;
  externalUrl: string;
}

export interface ListingValidationResult {
  valid: boolean;
  missingFields: string[];
}

export interface ListingCandidate {
  sku?: string;
  price?: number | string;
  currency?: string;
  mediaCondition?: string;
  sleeveCondition?: string;
  saleStatus?: string;
  quantityAvailable?: number;
  product?: {
    title?: string;
    artist?: string;
    format?: string;
    discogsReleaseId?: string;
  };
}

export interface DiscogsConnector {
  searchReleases(query: string): Promise<DiscogsRelease[]>;
  getRelease(releaseId: string): Promise<DiscogsRelease>;
  validateListingPayload(unit: ListingCandidate): ListingValidationResult;
  publishListing(unit: ListingCandidate): Promise<DiscogsListingResult>;
  markLocalSoldOrOutOfStock(unit: ListingCandidate): Promise<{ saleStatus: 'sold'; quantityAvailable: 0 }>;
}
