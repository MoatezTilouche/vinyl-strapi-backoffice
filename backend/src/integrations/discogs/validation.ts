import type { ListingCandidate, ListingValidationResult } from './discogs.types';

export function validateListingInput(unit: ListingCandidate): ListingValidationResult {
  const required: Array<[string, unknown]> = [
    ['product.title', unit.product?.title],
    ['product.artist', unit.product?.artist],
    ['product.format', unit.product?.format],
    ['product.discogsReleaseId', unit.product?.discogsReleaseId],
    ['price', unit.price],
    ['currency', unit.currency],
    ['mediaCondition', unit.mediaCondition],
    ['sleeveCondition', unit.sleeveCondition],
  ];
  const missingFields = required.filter(([, value]) => value === undefined || value === null || value === '').map(([field]) => field);
  const numericPrice = Number(unit.price);
  if (unit.price !== undefined && unit.price !== null && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
    missingFields.push('price(>0 required)');
  }
  if (unit.saleStatus && unit.saleStatus !== 'available') missingFields.push('saleStatus(available required)');
  if (unit.quantityAvailable !== undefined && unit.quantityAvailable < 1) missingFields.push('quantityAvailable(>=1 required)');
  return { valid: missingFields.length === 0, missingFields };
}
