export default {
  routes: [
    {
      method: 'GET',
      path: '/discogs/search',
      handler: 'discogs.search',
      config: { auth: false },
    },
  ],
};
