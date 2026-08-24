export function generateSkuFromPrevious(previous?: string | null): string {
  const match = previous?.match(/^VIN-(\d{6})$/);
  const next = match ? Number(match[1]) + 1 : 1;
  return `VIN-${String(next).padStart(6, '0')}`;
}

export async function generateNextSku(strapiInstance: any): Promise<string> {
  const latest = await strapiInstance.db.query('api::sellable-unit.sellable-unit').findOne({
    orderBy: { id: 'desc' },
    select: ['sku'],
  });
  return generateSkuFromPrevious(latest?.sku);
}
