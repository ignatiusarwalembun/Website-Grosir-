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
app.get('/api/products', (req, res) => {
  let data = [...productData];
  const { search, category, sort, promo } = req.query;
  if (search) data = data.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (category && category !== 'all') data = data.filter(p => p.category === category);
  if (promo === 'true') data = data.filter(p => p.discount > 0);
  if (sort === 'price-asc') data.sort((a,b) => a.wholesalePrice - b.wholesalePrice);
  if (sort === 'price-desc') data.sort((a,b) => b.wholesalePrice - a.wholesalePrice);
  if (sort === 'newest') data.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === 'popular') data.sort((a,b) => Number(b.featured) - Number(a.featured));
  res.json(data);
});

app.get('/api/products/:id', (req, res) => {
  const product = productData.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
  res.json(product);
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

const distDir = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distDir));
app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GrosirHub fullstack listening on ${PORT}`);
});
