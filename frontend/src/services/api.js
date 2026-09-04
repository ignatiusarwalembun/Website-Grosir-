const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const error = new Error(payload?.message || `API ${res.status}`);
    error.status = res.status;
    error.payload = payload;
    throw error;
  }
  return res.json();
}
export const api = {
  products: (params='') => request(`/api/products${params ? `?${params}` : ''}`),
  product: id => request(`/api/products/${id}`),
  categories: () => request('/api/categories'),
  promos: () => request('/api/promos'),
  orders: () => request('/api/orders'),
  cart: item => request('/api/cart', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(item) }),
  validateReferral: (code, subtotal) => request(`/api/referrals/validate?code=${encodeURIComponent(code)}&subtotal=${encodeURIComponent(subtotal)}`),
  paymentConfig: () => request('/api/payment/config'),
  createPayment: order => request('/api/payment/create', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(order) }),
  checkout: order => request('/api/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(order) }),
  orderStatus: (id, phone) => request(`/api/order-status/${encodeURIComponent(id)}?phone=${encodeURIComponent(phone)}`)
};
