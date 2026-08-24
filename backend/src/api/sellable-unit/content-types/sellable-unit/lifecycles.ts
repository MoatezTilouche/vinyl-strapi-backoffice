import { generateNextSku } from '../../../../lib/sku';

export default {
  async beforeCreate(event: any) {
    // Always generated server-side: any client-provided SKU is ignored.
    event.params.data.sku = await generateNextSku(strapi);
  },
};
