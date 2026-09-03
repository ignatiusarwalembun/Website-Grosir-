const API_URL = (import.meta.env.VITE_API_URL || 'https://grosirhub-backend-production.up.railway.app').replace(/\/$/, '');
async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
export const api = {
  products: (params='') => request(`/api/products${params ? `?${params}` : ''}`),
  product: id => request(`/api/products/${id}`),
  categories: () => request('/api/categories'),
  promos: () => request('/api/promos'),
  orders: () => request('/api/orders'),
  cart: item => request('/api/cart', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(item) })
};
