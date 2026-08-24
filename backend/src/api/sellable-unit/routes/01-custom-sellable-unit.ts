export default {
  routes: [
    { method: 'POST', path: '/sellable-units/:id/check-discogs-completeness', handler: 'sellable-unit.checkDiscogsCompleteness', config: { auth: false } },
    { method: 'POST', path: '/sellable-units/:id/publish-discogs', handler: 'sellable-unit.publishDiscogs', config: { auth: false } },
    { method: 'POST', path: '/sellable-units/:id/simulate-discogs-sale', handler: 'sellable-unit.simulateDiscogsSale', config: { auth: false } }
  ],
};
