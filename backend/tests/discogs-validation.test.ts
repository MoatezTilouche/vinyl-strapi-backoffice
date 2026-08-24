import { describe, expect, it } from 'vitest';
import { validateListingInput } from '../src/integrations/discogs/validation';

const validUnit = {
  sku: 'VIN-000001',
  price: 35,
  currency: 'EUR',
  mediaCondition: 'Very Good+',
  sleeveCondition: 'Very Good',
  saleStatus: 'available',
  quantityAvailable: 1,
  product: {
    title: 'Discovery',
    artist: 'Daft Punk',
    format: '2xLP',
    discogsReleaseId: '123456',
  },
};

describe('Discogs completeness', () => {
  it('accepts a complete sellable unit', () => {
    expect(validateListingInput(validUnit)).toEqual({ valid: true, missingFields: [] });
  });

  it('reports missing required data', () => {
    const result = validateListingInput({ ...validUnit, mediaCondition: '', product: { ...validUnit.product, discogsReleaseId: '' } });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('mediaCondition');
    expect(result.missingFields).toContain('product.discogsReleaseId');
  });

  it('rejects a zero or invalid price', () => {
    const zero = validateListingInput({ ...validUnit, price: 0 });
    expect(zero.valid).toBe(false);
    expect(zero.missingFields).toContain('price(>0 required)');
  });

});
