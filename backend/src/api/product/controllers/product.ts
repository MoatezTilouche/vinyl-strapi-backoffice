import { factories } from '@strapi/strapi';
import { getDiscogsConnector } from '../../../integrations/discogs';

export default factories.createCoreController('api::product.product', () => ({
  async attachDiscogsRelease(ctx: any) {
    const productId = Number(ctx.params.id);
    const tenantId = Number(ctx.request.body?.tenantId);
    const releaseId = String(ctx.request.body?.releaseId ?? '');
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(tenantId) || tenantId <= 0 || !releaseId) {
      return ctx.badRequest('product id and tenantId must be positive integers; releaseId is required');
    }

    const tenant = await strapi.db.query('api::tenant.tenant').findOne({ where: { id: tenantId, active: true } });
    if (!tenant) return ctx.notFound('Active tenant not found');

    const product = await strapi.db.query('api::product.product').findOne({
      where: { id: productId, tenant: { id: tenantId } },
    });
    if (!product) return ctx.notFound('Product not found for tenant');

    try {
      const release = await getDiscogsConnector().getRelease(releaseId);
      const updated = await strapi.db.query('api::product.product').update({
        where: { id: productId },
        data: {
          discogsReleaseId: release.releaseId,
          discogsMasterId: release.masterId ?? null,
          label: product.label || release.label,
          year: product.year || release.year,
          country: product.country || release.country,
          format: product.format || release.format,
        },
      });
      ctx.body = { data: updated, release };
    } catch (error: any) {
      ctx.badRequest(error.message);
    }
  },
}));
