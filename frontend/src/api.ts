const API = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || body?.message || `HTTP ${res.status}`);
  return body.data as T;
}
export async function deleteProduct(id: number) {
  const response = await fetch(`${API}/products/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete product');
  }

  return response.json();
}

export async function deleteSellableUnit(id: number) {
  const response = await fetch(`${API}/sellable-units/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete sellable unit');
  }

  return response.json();
}
export async function deleteListing(id: number) {
  const response = await fetch(`${API}/channel-listings/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete listing');
  }

  return response.json();
}
export const api = {
  tenants: () => request<any[]>('/backoffice/tenants'),
  dashboard: (tenantId: number) => request<any>(`/backoffice/dashboard?tenantId=${tenantId}`),
  products: (tenantId: number) => request<any[]>(`/backoffice/products?tenantId=${tenantId}`),
  units: (tenantId: number) => request<any[]>(`/backoffice/units?tenantId=${tenantId}`),
  listings: (tenantId: number) => request<any[]>(`/backoffice/listings?tenantId=${tenantId}`),
  events: (tenantId: number) => request<any[]>(`/backoffice/sync-events?tenantId=${tenantId}`),
  createProduct: (data: any) => request<any>('/backoffice/products', { method: 'POST', body: JSON.stringify(data) }),
  createUnit: (productId: number, data: any) => request<any>(`/backoffice/products/${productId}/units`, { method: 'POST', body: JSON.stringify(data) }),
  searchDiscogs: (tenantId: number, q: string) => request<any[]>(`/discogs/search?tenantId=${tenantId}&q=${encodeURIComponent(q)}`),
  attachRelease: (productId: number, tenantId: number, releaseId: string) => request<any>(`/products/${productId}/attach-discogs-release`, { method: 'POST', body: JSON.stringify({ tenantId, releaseId }) }),
  check: (unitId: number, tenantId: number) => request<any>(`/sellable-units/${unitId}/check-discogs-completeness`, { method: 'POST', body: JSON.stringify({ tenantId }) }),
  publish: (unitId: number, tenantId: number) => request<any>(`/sellable-units/${unitId}/publish-discogs`, { method: 'POST', body: JSON.stringify({ tenantId }) }),
  simulateSale: (unitId: number, tenantId: number) => request<any>(`/sellable-units/${unitId}/simulate-discogs-sale`, { method: 'POST', body: JSON.stringify({ tenantId }) }),
};
