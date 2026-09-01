import express from 'express';
import cors from 'cors';
import { categories, productData, promos, orders } from './data.js';

const app = express();
const PORT = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
if (frontendUrl) allowedOrigins.add(frontendUrl.replace(/\/$/, ''));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new Error('Origin not allowed by GrosirHub CORS policy'));
  }
}));
app.use(express.json());

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
app.get('/api/products/:id', (req,res) => {
  const product = productData.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
  res.json(product);
});
app.get('/api/categories', (_req,res) => res.json(categories));
app.get('/api/promos', (_req,res) => res.json(promos));
app.get('/api/orders', (_req,res) => res.json(orders));
app.post('/api/cart', (req,res) => res.status(201).json({ status:'ok', item:req.body }));

app.use((err, _req, res, _next) => res.status(403).json({ message: err.message }));
app.listen(PORT, '0.0.0.0', () => console.log(`GrosirHub API listening on ${PORT}`));
