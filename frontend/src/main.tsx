import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Album,
  Boxes,
  CircleDollarSign,
  CloudCog,
  Disc3,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  TriangleAlert,
} from 'lucide-react';
import { api } from './api';
import './styles.css';

type Tab = 'dashboard' | 'products' | 'inventory' | 'listings' | 'logs';

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    if (!tenantId) return;

    const [d, p, u, l, e] = await Promise.all([
      api.dashboard(tenantId),
      api.products(tenantId),
      api.units(tenantId),
      api.listings(tenantId),
      api.events(tenantId),
    ]);

    setDashboard(d);
    setProducts(p);
    setUnits(u);
    setListings(l);
    setEvents(e);
  };

  useEffect(() => {
    api
      .tenants()
      .then((rows) => {
        setTenants(rows);

        if (rows[0]) {
          setTenantId(rows[0].id);
        }
      })
      .catch((e) => setMessage(e.message));
  }, []);

  useEffect(() => {
    refresh().catch((e) => setMessage(e.message));
  }, [tenantId]);

  const run = async (fn: () => Promise<any>, success: string) => {
    setBusy(true);
    setMessage('');

    try {
      await fn();
      setMessage(success);
      await refresh();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Disc3 size={28} />

          <div>
            <strong>VINYL OPS</strong>
            <small>Marketplace backoffice</small>
          </div>
        </div>

        <nav>
          <Nav
            active={tab === 'dashboard'}
            onClick={() => setTab('dashboard')}
            icon={<Boxes />}
          >
            Dashboard
          </Nav>

          <Nav
            active={tab === 'products'}
            onClick={() => setTab('products')}
            icon={<Album />}
          >
            Produits
          </Nav>

          <Nav
            active={tab === 'inventory'}
            onClick={() => setTab('inventory')}
            icon={<ShoppingBag />}
          >
            Inventaire
          </Nav>

          <Nav
            active={tab === 'listings'}
            onClick={() => setTab('listings')}
            icon={<CloudCog />}
          >
            Listings Discogs
          </Nav>

          <Nav
            active={tab === 'logs'}
            onClick={() => setTab('logs')}
            icon={<RefreshCw />}
          >
            Sync logs
          </Nav>
        </nav>

        <div className="sidebar-note">
          Mode Discogs <span>MOCK</span>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <h1>
              {
                (
                  {
                    dashboard: 'Dashboard',
                    products: 'Catalogue vinyles',
                    inventory: 'Unités vendables',
                    listings: 'Listings Discogs',
                    logs: 'Journal de synchronisation',
                  } as any
                )[tab]
              }
            </h1>

            <p>Test technique Strapi · TypeScript · PostgreSQL</p>
          </div>

          <div className="actions">
            <select
              value={tenantId ?? ''}
              onChange={(e) => setTenantId(Number(e.target.value))}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <button
              className="icon-btn"
              onClick={() => refresh()}
              title="Rafraîchir"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {message && <div className="notice">{message}</div>}

        {tab === 'dashboard' && <Dashboard data={dashboard} />}

        {tab === 'products' && tenantId && (
          <Products
            tenantId={tenantId}
            products={products}
            busy={busy}
            run={run}
          />
        )}

        {tab === 'inventory' && tenantId && (
          <Inventory
            tenantId={tenantId}
            units={units}
            products={products}
            busy={busy}
            run={run}
          />
        )}

        {tab === 'listings' && <Listings rows={listings} />}

        {tab === 'logs' && <Logs rows={events} />}
      </main>
    </div>
  );
}

function Nav({ active, onClick, icon, children }: any) {
  return (
    <button
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {React.cloneElement(icon, { size: 18 })}
      <span>{children}</span>
    </button>
  );
}

function Dashboard({ data }: any) {
  const cards = [
    ['Produits', data.products ?? 0, <Album />],
    ['Unités disponibles', data.availableUnits ?? 0, <PackageCheck />],
    ['Listings publiés', data.publishedListings ?? 0, <CloudCog />],
    ['Échecs sync', data.syncErrors ?? 0, <TriangleAlert />],
  ];

  return (
    <section>
      <div className="stats">
        {cards.map(([label, value, icon]: any) => (
          <div className="stat" key={label}>
            <div className="stat-icon">
              {React.cloneElement(icon, { size: 22 })}
            </div>

            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-card">
        <div>
          <span className="eyebrow">WORKFLOW DE DÉMO</span>

          <h2>Du catalogue à Discogs, sans appel réseau.</h2>

          <p>
            Créez un vinyle, associez la release mock{' '}
            <b>Daft Punk — Discovery</b>, générez une unité vendable,
            publiez-la puis simulez sa vente.
          </p>
        </div>

        <Disc3 size={96} strokeWidth={1} />
      </div>
    </section>
  );
}

function Products({ tenantId, products, busy, run }: any) {
  const [form, setForm] = useState({
    title: 'Discovery',
    artist: 'Daft Punk',
    label: 'Virgin',
    year: '2001',
    country: 'France',
    format: '2xLP',
  });

  const [q, setQ] = useState('Daft Punk Discovery');
  const [results, setResults] = useState<any[]>([]);

  return (
    <section className="grid-2">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Nouveau vinyle</h3>
            <p>Fiche catalogue, distincte de l'exemplaire vendu.</p>
          </div>
        </div>

        <div className="form-grid">
          {Object.entries(form).map(([key, value]) => (
            <label key={key}>
              <span>{key}</span>

              <input
                value={value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]: e.target.value,
                  })
                }
              />
            </label>
          ))}
        </div>

        <button
          disabled={busy}
          className="primary"
          onClick={() =>
            run(
              () =>
                api.createProduct({
                  ...form,
                  tenantId,
                }),
              'Produit créé'
            )
          }
        >
          Créer la fiche
        </button>
      </div>

      <div className="panel">
        <h3>Recherche Discogs</h3>

        <p>Connecteur mockable isolé du controller.</p>

        <div className="search-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button
            onClick={async () =>
              setResults(await api.searchDiscogs(tenantId, q))
            }
          >
            <Search size={17} />
            Rechercher
          </button>
        </div>

        {results.map((r) => (
          <div className="release" key={r.releaseId}>
            <Disc3 />

            <div>
              <b>
                {r.artist} — {r.title}
              </b>

              <small>
                {r.year} · {r.country} · {r.format} · {r.label}
              </small>
            </div>

            <span>#{r.releaseId}</span>
          </div>
        ))}
      </div>

      <div className="panel span-2">
        <h3>Catalogue</h3>

        <div className="table">
          <div className="tr th">
            <span>Vinyle</span>
            <span>Format</span>
            <span>Release Discogs</span>
            <span>Action</span>
          </div>

          {products.map((p: any) => (
            <div className="tr" key={p.id}>
              <span>
                <b>{p.artist}</b>
                <small>{p.title}</small>
              </span>

              <span>{p.format || '—'}</span>

              <span>
                {p.discogsReleaseId
                  ? `#${p.discogsReleaseId}`
                  : 'Non liée'}
              </span>

              <span>
                {!p.discogsReleaseId ? (
                  <button
                    className="small"
                    onClick={() =>
                      run(
                        () =>
                          api.attachRelease(
                            p.id,
                            tenantId,
                            '123456'
                          ),
                        'Release Discogs associée'
                      )
                    }
                  >
                    Associer #123456
                  </button>
                ) : (
                  <span className="badge success">Liée</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Inventory({
  tenantId,
  units,
  products,
  busy,
  run,
}: any) {
  const [productId, setProductId] = useState<number>(
    products[0]?.id || 0
  );

  const [price, setPrice] = useState('35');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (!productId && products[0]) {
      setProductId(products[0].id);
    }
  }, [products]);

  return (
    <section className="grid-2">
      <div className="panel">
        <h3>Créer une unité vendable</h3>

        <p>Le SKU est généré automatiquement côté backend.</p>

        <label>
          <span>Produit</span>

          <select
            value={productId}
            onChange={(e) =>
              setProductId(Number(e.target.value))
            }
          >
            {products.map((p: any) => (
              <option value={p.id} key={p.id}>
                {p.artist} — {p.title}
              </option>
            ))}
          </select>
        </label>

        <div className="form-grid">
          <label>
            <span>Prix EUR</span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>

          <label>
            <span>Quantité disponible</span>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>

          <label>
            <span>État disque</span>

            <input
              defaultValue="Very Good+"
              id="media"
            />
          </label>

          <label>
            <span>État pochette</span>

            <input
              defaultValue="Very Good"
              id="sleeve"
            />
          </label>

          <label>
            <span>Localisation</span>

            <input
              defaultValue="A-01"
              id="location"
            />
          </label>
        </div>

        <button
          className="primary"
          disabled={!productId || busy}
          onClick={() =>
            run(
              () =>
                api.createUnit(productId, {
                  tenantId,
                  price: Number(price),
                  quantityAvailable: Number(quantity),
                  mediaCondition: (
                    document.getElementById(
                      'media'
                    ) as HTMLInputElement
                  ).value,
                  sleeveCondition: (
                    document.getElementById(
                      'sleeve'
                    ) as HTMLInputElement
                  ).value,
                  internalLocation: (
                    document.getElementById(
                      'location'
                    ) as HTMLInputElement
                  ).value,
                }),
              'Unité créée avec SKU automatique'
            )
          }
        >
          Créer l'unité
        </button>
      </div>

      <div className="panel">
        <h3>Statuts</h3>

        <div className="legend">
          <span>
            <i className="dot green" />
            available
          </span>

          <span>
            <i className="dot dark" />
            sold / out of stock
          </span>

          <span>
            <i className="dot amber" />
            publication en attente
          </span>
        </div>
      </div>

      <div className="panel span-2">
        <h3>Inventaire</h3>

        <div className="unit-grid">
          {units.map((u: any) => (
            <div className="unit-card" key={u.id}>
              <div className="unit-top">
                <div>
                  <span className="mono">{u.sku}</span>

                  <h4>
                    {u.product?.artist} — {u.product?.title}
                  </h4>
                </div>

                <span
                  className={`badge ${
                    u.saleStatus === 'available'
                      ? 'success'
                      : ''
                  }`}
                >
                  {u.saleStatus}
                </span>
              </div>

              <div className="unit-meta">
                <span>
                  <CircleDollarSign size={15} />
                  {u.price} {u.currency}
                </span>

                <span>
                  Quantité: {u.quantityAvailable}
                </span>

                <span>
                  Disque: {u.mediaCondition}
                </span>

                <span>
                  Pochette: {u.sleeveCondition}
                </span>
              </div>

              <div className="unit-actions">
                <button
                  onClick={() =>
                    run(
                      () => api.check(u.id, tenantId),
                      'Complétude Discogs vérifiée'
                    )
                  }
                >
                  Vérifier
                </button>

                <button
                  disabled={u.saleStatus !== 'available'}
                  className="primary"
                  onClick={() =>
                    run(
                      () => api.publish(u.id, tenantId),
                      'Listing Discogs publié'
                    )
                  }
                >
                  Publier
                </button>

                <button
                  disabled={u.saleStatus !== 'available'}
                  className="danger"
                  onClick={() =>
                    run(
                      () =>
                        api.simulateSale(
                          u.id,
                          tenantId
                        ),
                      'Vente Discogs simulée'
                    )
                  }
                >
                  Simuler vente
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Listings({ rows }: any) {
  return (
    <section className="panel">
      <h3>Channel listings</h3>

      <div className="table">
        <div className="tr th">
          <span>SKU</span>
          <span>Listing externe</span>
          <span>Prix</span>
          <span>Statut</span>
        </div>

        {rows.map((r: any) => (
          <div className="tr" key={r.id}>
            <span className="mono">
              {r.sellableUnit?.sku}
            </span>

            <span>
              {r.externalListingId ? (
                <a
                  href={r.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.externalListingId}
                </a>
              ) : (
                '—'
              )}
            </span>

            <span>
              {r.publishedPrice || '—'} EUR
            </span>

            <span>
              <span
                className={`badge ${
                  r.status === 'published'
                    ? 'success'
                    : ''
                }`}
              >
                {r.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Logs({ rows }: any) {
  return (
    <section className="panel">
      <h3>MarketplaceSyncEvent</h3>

      <div className="timeline">
        {rows.map((e: any) => (
          <div className="event" key={e.id}>
            <div
              className={`event-dot ${e.status}`}
            />

            <div>
              <div className="event-line">
                <b>{e.action}</b>

                <span
                  className={`badge ${
                    e.status === 'success'
                      ? 'success'
                      : ''
                  }`}
                >
                  {e.status}
                </span>

                <time>
                  {new Date(
                    e.eventDate
                  ).toLocaleString()}
                </time>
              </div>

              <p>{e.message}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

createRoot(
  document.getElementById('root')!
).render(<App />);