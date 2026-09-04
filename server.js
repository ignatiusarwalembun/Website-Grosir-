import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { categories, productData, promos, orders } from './backend/src/data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const OPERATIONAL_API_URL = (process.env.OPERATIONAL_API_URL || 'https://grosirhub-operational-production.up.railway.app').replace(/\/$/, '');

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

function fallbackProducts(query = {}) {
  let data = [...productData];
  const { search, category, sort, promo } = query;
  if (search) data = data.filter(p => p.name.toLowerCase().includes(String(search).toLowerCase()));
  if (category && category !== 'all') data = data.filter(p => p.category === category);
  if (promo === 'true') data = data.filter(p => p.discount > 0);
  if (sort === 'price-asc') data.sort((a,b) => a.wholesalePrice - b.wholesalePrice);
  if (sort === 'price-desc') data.sort((a,b) => b.wholesalePrice - a.wholesalePrice);
  if (sort === 'newest') data.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === 'popular') data.sort((a,b) => Number(b.featured) - Number(a.featured));
  return data;
}

app.get('/api/products', async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    const response = await fetch(`${OPERATIONAL_API_URL}/api/products${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error(`Operational products ${response.status}`);
    res.json(await response.json());
  } catch (error) {
    console.error('Operational product catalog fallback:', error.message);
    res.json(fallbackProducts(req.query));
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const response = await fetch(`${OPERATIONAL_API_URL}/api/products/${encodeURIComponent(req.params.id)}`);
    if (response.status === 404) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    if (!response.ok) throw new Error(`Operational product ${response.status}`);
    res.json(await response.json());
  } catch (error) {
    console.error('Operational product detail fallback:', error.message);
    const product = productData.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json(product);
  }
});

app.get('/api/referrals/validate', async (req, res) => {
  try {
    const query = new URLSearchParams({
      code: String(req.query.code || ''),
      subtotal: String(req.query.subtotal || 0)
    }).toString();
    const response = await fetch(`${OPERATIONAL_API_URL}/api/referrals/validate?${query}`);
    const payload = await response.json().catch(() => ({ message: 'Kode referensi tidak valid' }));
    if (!response.ok) return res.status(response.status).json(payload);
    res.json(payload);
  } catch (error) {
    console.error('Operational referral validation error:', error.message);
    res.status(502).json({ message: 'Kode referensi sementara tidak dapat diperiksa' });
  }
});

app.get('/api/categories', (_req, res) => res.json(categories));
app.get('/api/promos', (_req, res) => res.json(promos));
app.get('/api/orders', (_req, res) => res.json(orders));
app.post('/api/cart', (req, res) => res.status(201).json({ status: 'ok', item: req.body }));

app.post('/api/checkout', async (req, res) => {
  try {
    const response = await fetch(`${OPERATIONAL_API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const payload = await response.json().catch(() => ({ message: 'Operational response invalid' }));
    if (!response.ok) return res.status(response.status).json(payload);
    res.status(201).json(payload);
  } catch (error) {
    console.error('Operational checkout error:', error.message);
    res.status(502).json({ message: 'Website operational sedang tidak dapat dihubungi' });
  }
});

app.get('/api/order-status/:id', async (req, res) => {
  try {
    const phone = String(req.query.phone || '');
    const response = await fetch(`${OPERATIONAL_API_URL}/api/public/orders/${encodeURIComponent(req.params.id)}?phone=${encodeURIComponent(phone)}`);
    const payload = await response.json().catch(() => ({ message: 'Pesanan tidak ditemukan' }));
    if (!response.ok) return res.status(response.status).json(payload);
    res.json(payload);
  } catch (error) {
    console.error('Operational order status error:', error.message);
    res.status(502).json({ message: 'Status pesanan sementara tidak dapat diperiksa' });
  }
});

const distDir = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distDir));
app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GrosirHub fullstack listening on ${PORT}`);
});
