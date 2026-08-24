import { getDiscogsConnector } from '../../../integrations/discogs';
import { createSyncEvent } from '../../../lib/sync-log';

function parseTenantId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error('tenantId is required and must be a positive integer');
  return id;
}

export default {
  async search(ctx: any) {
    try {
      const tenantId = parseTenantId(ctx.query.tenantId);
      const query = String(ctx.query.q ?? '').trim();
      if (!query) return ctx.badRequest('q is required');

      const tenant = await strapi.db.query('api::tenant.tenant').findOne({ where: { id: tenantId, active: true } });
      if (!tenant) return ctx.notFound('Active tenant not found');

      const releases = await getDiscogsConnector().searchReleases(query);
      await createSyncEvent({
        tenantId,
        action: 'search_release',
        status: 'success',
        message: `Discogs search completed for "${query}"`,
        payload: { query, resultCount: releases.length },
      });
      ctx.body = { data: releases };
    } catch (error: any) {
      ctx.badRequest(error.message);
    }
  },
};
