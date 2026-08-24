export async function createSyncEvent(params: {
  tenantId: number;
  action: 'search_release' | 'check_completeness' | 'publish_listing' | 'mark_local_out_of_stock';
  status: 'started' | 'success' | 'failed';
  message: string;
  productId?: number;
  sellableUnitId?: number;
  channelListingId?: number;
  payload?: unknown;
}) {
  return strapi.db.query('api::marketplace-sync-event.marketplace-sync-event').create({
    data: {
      tenant: params.tenantId,
      channel: 'discogs',
      action: params.action,
      status: params.status,
      product: params.productId,
      sellableUnit: params.sellableUnitId,
      channelListing: params.channelListingId,
      message: params.message,
      payload: params.payload ?? null,
      eventDate: new Date().toISOString(),
    },
  });
}
