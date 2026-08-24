import { factories } from '@strapi/strapi';
import { getDiscogsConnector } from '../../../integrations/discogs';
import { createSyncEvent } from '../../../lib/sync-log';

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

async function ensureActiveTenant(tenantId: number) {
  return strapi.db.query('api::tenant.tenant').findOne({ where: { id: tenantId, active: true } });
}

async function getScopedUnit(unitId: number, tenantId: number) {
  return strapi.db.query('api::sellable-unit.sellable-unit').findOne({
    where: { id: unitId, tenant: { id: tenantId } },
    populate: ['product', 'tenant', 'channelListings'],
  });
}

export default factories.createCoreController('api::sellable-unit.sellable-unit', () => ({
  async checkDiscogsCompleteness(ctx: any) {
    const unitId = Number(ctx.params.id);
    const tenantId = Number(ctx.request.body?.tenantId ?? ctx.query.tenantId);
    if (!isPositiveInteger(unitId) || !isPositiveInteger(tenantId)) return ctx.badRequest('unit id and tenantId must be positive integers');
    if (!(await ensureActiveTenant(tenantId))) return ctx.notFound('Active tenant not found');
    const unit = await getScopedUnit(unitId, tenantId);
    if (!unit) return ctx.notFound('Sellable unit not found for tenant');

    const result = getDiscogsConnector().validateListingPayload(unit);
    await createSyncEvent({
      tenantId,
      action: 'check_completeness',
      status: result.valid ? 'success' : 'failed',
      message: result.valid ? `Discogs payload complete for ${unit.sku}` : `Missing fields: ${result.missingFields.join(', ')}`,
      productId: unit.product?.id,
      sellableUnitId: unit.id,
      payload: result,
    });
    ctx.body = { data: result };
  },

  async publishDiscogs(ctx: any) {
    const unitId = Number(ctx.params.id);
    const tenantId = Number(ctx.request.body?.tenantId);
    if (!isPositiveInteger(unitId) || !isPositiveInteger(tenantId)) return ctx.badRequest('unit id and tenantId must be positive integers');
    if (!(await ensureActiveTenant(tenantId))) return ctx.notFound('Active tenant not found');
    const unit = await getScopedUnit(unitId, tenantId);
    if (!unit) return ctx.notFound('Sellable unit not found for tenant');

    const connector = getDiscogsConnector();
    const validation = connector.validateListingPayload(unit);
    if (!validation.valid) {
      await createSyncEvent({ tenantId, action: 'publish_listing', status: 'failed', message: `Publication refused: ${validation.missingFields.join(', ')}`, productId: unit.product?.id, sellableUnitId: unit.id, payload: validation });
      return ctx.badRequest(`Incomplete Discogs payload: ${validation.missingFields.join(', ')}`);
    }

    await createSyncEvent({ tenantId, action: 'publish_listing', status: 'started', message: `Publishing ${unit.sku} to Discogs`, productId: unit.product?.id, sellableUnitId: unit.id });
    try {
      const published = await connector.publishListing(unit);
      const existing = Array.isArray(unit.channelListings) ? unit.channelListings.find((item: any) => item.channel === 'discogs') : undefined;
      const listing = existing
        ? await strapi.db.query('api::channel-listing.channel-listing').update({ where: { id: existing.id }, data: { externalListingId: published.externalListingId, externalUrl: published.externalUrl, status: 'published', publishedPrice: unit.price, lastSyncAt: new Date().toISOString(), lastError: null } })
        : await strapi.db.query('api::channel-listing.channel-listing').create({ data: { tenant: tenantId, sellableUnit: unit.id, channel: 'discogs', externalListingId: published.externalListingId, externalUrl: published.externalUrl, status: 'published', publishedPrice: unit.price, lastSyncAt: new Date().toISOString() } });

      await createSyncEvent({ tenantId, action: 'publish_listing', status: 'success', message: `${unit.sku} published as ${published.externalListingId}`, productId: unit.product?.id, sellableUnitId: unit.id, channelListingId: listing.id, payload: published });
      ctx.body = { data: listing };
    } catch (error: any) {
      await createSyncEvent({ tenantId, action: 'publish_listing', status: 'failed', message: error.message, productId: unit.product?.id, sellableUnitId: unit.id });
      ctx.internalServerError(error.message);
    }
  },

  async simulateDiscogsSale(ctx: any) {
    const unitId = Number(ctx.params.id);
    const tenantId = Number(ctx.request.body?.tenantId);
    if (!isPositiveInteger(unitId) || !isPositiveInteger(tenantId)) return ctx.badRequest('unit id and tenantId must be positive integers');
    if (!(await ensureActiveTenant(tenantId))) return ctx.notFound('Active tenant not found');
    const unit = await getScopedUnit(unitId, tenantId);
    if (!unit) return ctx.notFound('Sellable unit not found for tenant');

    const soldState = await getDiscogsConnector().markLocalSoldOrOutOfStock(unit);
    const updated = await strapi.db.query('api::sellable-unit.sellable-unit').update({
      where: { id: unit.id },
      data: soldState,
    });
    if (Array.isArray(unit.channelListings)) {
      for (const listing of unit.channelListings) {
        if (listing.channel === 'discogs') {
          await strapi.db.query('api::channel-listing.channel-listing').update({
            where: { id: listing.id },
            data: { status: 'removed', lastSyncAt: new Date().toISOString() },
          });
        }
      }
    }
    await createSyncEvent({ tenantId, action: 'mark_local_out_of_stock', status: 'success', message: `${unit.sku} marked sold after simulated Discogs sale`, productId: unit.product?.id, sellableUnitId: unit.id, payload: soldState });
    ctx.body = { data: updated };
  },
}));
