export default {
  routes: [
    { method: 'GET', path: '/backoffice/health', handler: 'backoffice.health', config: { auth: false } },
    { method: 'GET', path: '/backoffice/tenants', handler: 'backoffice.tenants', config: { auth: false } },
    { method: 'POST', path: '/backoffice/tenants', handler: 'backoffice.createTenant', config: { auth: false } },
    { method: 'GET', path: '/backoffice/dashboard', handler: 'backoffice.dashboard', config: { auth: false } },
    { method: 'GET', path: '/backoffice/products', handler: 'backoffice.products', config: { auth: false } },
    { method: 'POST', path: '/backoffice/products', handler: 'backoffice.createProduct', config: { auth: false } },
    { method: 'GET', path: '/backoffice/units', handler: 'backoffice.units', config: { auth: false } },
    { method: 'POST', path: '/backoffice/products/:productId/units', handler: 'backoffice.createUnit', config: { auth: false } },
    { method: 'GET', path: '/backoffice/listings', handler: 'backoffice.listings', config: { auth: false } },
    { method: 'GET', path: '/backoffice/sync-events', handler: 'backoffice.syncEvents', config: { auth: false } }
  ],
};
