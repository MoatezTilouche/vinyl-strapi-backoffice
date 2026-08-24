function tenantIdFrom(ctx: any): number {
  const id = Number(ctx.query.tenantId ?? ctx.request.body?.tenantId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('tenantId is required and must be a positive integer');
  return id;
}

async function ensureTenant(tenantId: number) {
  return strapi.db.query('api::tenant.tenant').findOne({ where: { id: tenantId, active: true } });
}

export default {
  async health(ctx: any) {
    try {
      await strapi.db.query('api::tenant.tenant').count();
      ctx.body = { data: { status: 'ok', database: 'reachable', timestamp: new Date().toISOString() } };
    } catch (e: any) {
      ctx.status = 503;
      ctx.body = { error: { message: 'Database unavailable' } };
    }
  },

  async tenants(ctx: any) {
    ctx.body = { data: await strapi.db.query('api::tenant.tenant').findMany({ orderBy: { id: 'asc' } }) };
  },

  async createTenant(ctx: any) {
    const { name, slug } = ctx.request.body ?? {};
    if (!name || !slug) return ctx.badRequest('name and slug are required');
    const tenant = await strapi.db.query('api::tenant.tenant').create({ data: { name, slug, active: true } });
    ctx.body = { data: tenant };
  },

  async products(ctx: any) {
    try {
      const tenantId = tenantIdFrom(ctx);
      if (!(await ensureTenant(tenantId))) return ctx.notFound('Active tenant not found');
      const products = await strapi.db.query('api::product.product').findMany({
        where: { tenant: { id: tenantId } },
        populate: ['sellableUnits'],
        orderBy: { id: 'desc' },
      });
      ctx.body = { data: products };
    } catch (e: any) { ctx.badRequest(e.message); }
  },

  async createProduct(ctx: any) {
    try {
      const tenantId = tenantIdFrom(ctx);
      if (!(await ensureTenant(tenantId))) return ctx.notFound('Active tenant not found');
      const b = ctx.request.body ?? {};
      if (!b.title || !b.artist) return ctx.badRequest('title and artist are required');
      const product = await strapi.db.query('api::product.product').create({
        data: {
          tenant: tenantId,
          productType: 'vinyl',
          title: b.title,
          artist: b.artist,
          description: b.description || null,
          label: b.label || null,
          year: b.year ? Number(b.year) : null,
          country: b.country || null,
          format: b.format || null,
          catalogReference: b.catalogReference || null,
        },
      });
      ctx.body = { data: product };
    } catch (e: any) { ctx.badRequest(e.message); }
  },

  async units(ctx: any) {
    try {
      const tenantId = tenantIdFrom(ctx);
      if (!(await ensureTenant(tenantId))) return ctx.notFound('Active tenant not found');
      const units = await strapi.db.query('api::sellable-unit.sellable-unit').findMany({
        where: { tenant: { id: tenantId } },
        populate: ['product', 'channelListings'],
        orderBy: { id: 'desc' },
      });
      ctx.body = { data: units };
    } catch (e: any) { ctx.badRequest(e.message); }
  },
async createUnit(ctx: any) {
  try {
    const tenantId = tenantIdFrom(ctx);
    const productId = Number(ctx.params.productId);

    if (!(await ensureTenant(tenantId))) {
      return ctx.notFound('Active tenant not found');
    }

    const b = ctx.request.body ?? {};

    const product = await strapi.db
      .query('api::product.product')
      .findOne({
        where: {
          id: productId,
          tenant: { id: tenantId },
        },
      });

    if (!product) {
      return ctx.notFound('Product not found for tenant');
    }

    if (
      b.price === undefined ||
      !b.mediaCondition ||
      !b.sleeveCondition
    ) {
      return ctx.badRequest(
        'price, mediaCondition and sleeveCondition are required'
      );
    }

    const price = Number(b.price);

    if (!Number.isFinite(price) || price <= 0) {
      return ctx.badRequest('price must be a positive number');
    }

    const quantityAvailable = Number(
      b.quantityAvailable ?? 1
    );

    if (
      !Number.isInteger(quantityAvailable) ||
      quantityAvailable < 1
    ) {
      return ctx.badRequest(
        'quantityAvailable must be an integer greater than 0'
      );
    }

    const unit = await strapi.db
      .query('api::sellable-unit.sellable-unit')
      .create({
        data: {
          tenant: tenantId,
          product: productId,

          // sku is injected by the lifecycle hook;
          // any client SKU is ignored.

          price,
          currency: b.currency || 'EUR',
          mediaCondition: b.mediaCondition,
          sleeveCondition: b.sleeveCondition,
          sellerComment: b.sellerComment || null,
          saleStatus: 'available',
          quantityAvailable,
          internalLocation: b.internalLocation || null,
        },
      });

    ctx.body = { data: unit };
  } catch (e: any) {
    ctx.badRequest(e.message);
  }
},

  async listings(ctx: any) {
    try {
      const tenantId = tenantIdFrom(ctx);
      if (!(await ensureTenant(tenantId))) return ctx.notFound('Active tenant not found');
      const rows = await strapi.db.query('api::channel-listing.channel-listing').findMany({
        where: { tenant: { id: tenantId } },
        populate: { sellableUnit: { populate: ['product'] } },
        orderBy: { id: 'desc' },
      });
      ctx.body = { data: rows };
    } catch (e: any) { ctx.badRequest(e.message); }
  },

  async syncEvents(ctx: any) {
    try {
      const tenantId = tenantIdFrom(ctx);
      if (!(await ensureTenant(tenantId))) return ctx.notFound('Active tenant not found');
      const rows = await strapi.db.query('api::marketplace-sync-event.marketplace-sync-event').findMany({
        where: { tenant: { id: tenantId } },
        populate: ['product', 'sellableUnit', 'channelListing'],
        orderBy: { eventDate: 'desc' },
        limit: 100,
      });
      ctx.body = { data: rows };
    } catch (e: any) { ctx.badRequest(e.message); }
  },

  async dashboard(ctx: any) {
    try {
      const tenantId = tenantIdFrom(ctx);
      if (!(await ensureTenant(tenantId))) return ctx.notFound('Active tenant not found');
      const [products, availableUnits, publishedListings, syncErrors] = await Promise.all([
        strapi.db.query('api::product.product').count({ where: { tenant: { id: tenantId } } }),
        strapi.db.query('api::sellable-unit.sellable-unit').count({ where: { tenant: { id: tenantId }, saleStatus: 'available' } }),
        strapi.db.query('api::channel-listing.channel-listing').count({ where: { tenant: { id: tenantId }, status: 'published' } }),
        strapi.db.query('api::marketplace-sync-event.marketplace-sync-event').count({ where: { tenant: { id: tenantId }, status: 'failed' } }),
      ]);
      ctx.body = { data: { products, availableUnits, publishedListings, syncErrors } };
    } catch (e: any) { ctx.badRequest(e.message); }
  },
};
