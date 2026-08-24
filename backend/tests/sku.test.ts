import { describe, expect, it } from 'vitest';
import { generateSkuFromPrevious } from '../src/lib/sku';

describe('SKU generation', () => {
  it('starts at VIN-000001', () => {
    expect(generateSkuFromPrevious(null)).toBe('VIN-000001');
  });

  it('increments the latest SKU', () => {
    expect(generateSkuFromPrevious('VIN-000041')).toBe('VIN-000042');
  });
});
