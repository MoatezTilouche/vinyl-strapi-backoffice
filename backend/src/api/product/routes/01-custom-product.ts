export default {
  routes: [
    {
      method: 'POST',
      path: '/products/:id/attach-discogs-release',
      handler: 'product.attachDiscogsRelease',
      config: { auth: false },
    },
  ],
};
