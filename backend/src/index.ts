export default {
  register() {},
  async bootstrap({ strapi }: { strapi: any }) {
    if (process.env.SEED_DEMO !== 'true') return;
    const existing = await strapi.db.query('api::tenant.tenant').findOne({ where: { slug: 'demo-records' } });
    if (!existing) {
      await strapi.db.query('api::tenant.tenant').create({
        data: { name: 'Demo Records', slug: 'demo-records', active: true },
      });
      strapi.log.info('Seed: created tenant "Demo Records" (slug demo-records).');
    }
  },
};
