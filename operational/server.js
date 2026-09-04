import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import { seedProducts } from './products.seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'grosirhub-admin';
const ORDERS_FILE = process.env.ORDERS_FILE || path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = process.env.PRODUCTS_FILE || path.join(__dirname, 'products.json');
const REFERRALS_FILE = process.env.REFERRALS_FILE || path.join(__dirname, 'referrals.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

const readJson = (file, fallback) => {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2));
const readOrders = () => readJson(ORDERS_FILE, []);
const writeOrders = value => writeJson(ORDERS_FILE, value);
const readProducts = () => {
  const data = readJson(PRODUCTS_FILE, null);
  if (Array.isArray(data)) return data;
  writeJson(PRODUCTS_FILE, seedProducts);
  return [...seedProducts];
};
const writeProducts = value => writeJson(PRODUCTS_FILE, value);
const readReferrals = () => {
  const data = readJson(REFERRALS_FILE, []);
  return Array.isArray(data) ? data : [];
};
const writeReferrals = value => writeJson(REFERRALS_FILE, value);

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="GrosirHub Operational"');
    return res.status(401).send('Authentication required');
  }
  const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
  const i = decoded.indexOf(':');
  if (decoded.slice(0, i) !== 'admin' || decoded.slice(i + 1) !== ADMIN_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="GrosirHub Operational"');
    return res.status(401).send('Invalid credentials');
  }
  next();
}

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
const rupiah = value => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(value) || 0);
const digits = value => String(value || '').replace(/\D/g, '');
const slug = value => String(value || 'produk').toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || `produk-${Date.now()}`;
const referralCode = value => String(value || '').trim().toUpperCase().replace(/\s+/g, '');

const STATUS_LABELS = {
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi Pembayaran',
  MENUNGGU_KONFIRMASI: 'Menunggu Konfirmasi',
  DIPROSES: 'Pesanan Sedang Disiapkan',
  SEDANG_DISIAPKAN: 'Pesanan Sedang Disiapkan',
  SIAP_DIKIRIM: 'Pesanan Siap Dikirim',
  DALAM_PENGANTARAN: 'Dalam Pengantaran',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan'
};

function normalizeView(value) {
  return new Set(['semua', 'menunggu', 'diproses', 'selesai']).has(value) ? value : 'semua';
}
function filterOrders(orders, view) {
  if (view === 'menunggu') return orders.filter(o => ['MENUNGGU_VERIFIKASI', 'MENUNGGU_KONFIRMASI'].includes(o.orderStatus));
  if (view === 'diproses') return orders.filter(o => ['DIPROSES', 'SEDANG_DISIAPKAN', 'SIAP_DIKIRIM', 'DALAM_PENGANTARAN'].includes(o.orderStatus));
  if (view === 'selesai') return orders.filter(o => o.orderStatus === 'SELESAI');
  return orders;
}
function publicOrder(o) {
  return {
    id: o.id,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt || null,
    customer: {
      name: o.customer?.name || '',
      phone: o.customer?.phone || '',
      address: o.customer?.address || ''
    },
    items: o.items || [],
    originalSubtotal: Number(o.originalSubtotal ?? o.subtotal) || 0,
    discountAmount: Number(o.discountAmount) || 0,
    subtotal: Number(o.subtotal) || 0,
    referralCode: o.referralCode || '',
    paymentMethod: o.paymentMethod || '',
    paymentStatus: o.paymentStatus || '',
    orderStatus: o.orderStatus || 'MENUNGGU_VERIFIKASI'
  };
}
function productFromBody(body, existing = {}) {
  const name = String(body.name ?? existing.name ?? '').trim();
  const price = Number(body.price ?? existing.price) || 0;
  const wholesalePrice = Number(body.wholesalePrice ?? existing.wholesalePrice) || price;
  const minOrder = Math.max(1, Number(body.minOrder ?? existing.minOrder) || 1);
  const unit = String(body.unit ?? existing.unit ?? '1 pcs').trim() || '1 pcs';
  return {
    ...existing,
    id: existing.id || slug(body.id || name),
    name,
    category: String(body.category ?? existing.category ?? 'sembako').trim() || 'sembako',
    unit,
    price,
    wholesalePrice,
    discount: Math.max(0, Number(body.discount ?? existing.discount) || 0),
    minOrder,
    tag: String(body.tag ?? existing.tag ?? '').trim(),
    emoji: String(body.emoji ?? existing.emoji ?? '📦').trim() || '📦',
    image: String(body.image ?? existing.image ?? '').trim(),
    stock: Math.max(0, Number(body.stock ?? existing.stock) || 0),
    featured: body.featured === 'on' || body.featured === true || body.featured === 'true',
    createdAt: existing.createdAt || new Date().toISOString().slice(0, 10),
    description: String(body.description ?? existing.description ?? '').trim(),
    packaging: unit,
    tiers: [
      { min: minOrder, max: 4, price },
      { min: 5, max: 9, price: Math.round(price * .96 / 100) * 100 },
      { min: 10, max: null, price: wholesalePrice }
    ]
  };
}
function referralFromBody(body, existing = {}) {
  const code = referralCode(body.code ?? existing.code);
  const type = body.type === 'fixed' ? 'fixed' : 'percent';
  const maxValue = type === 'percent' ? 100 : Number.MAX_SAFE_INTEGER;
  const value = Math.min(maxValue, Math.max(0, Number(body.value ?? existing.value) || 0));
  return {
    ...existing,
    id: existing.id || `REF-${Date.now().toString(36).toUpperCase()}`,
    code,
    type,
    value,
    active: body.active === 'on' || body.active === true || body.active === 'true',
    usageCount: Number(existing.usageCount) || 0,
    createdAt: existing.createdAt || new Date().toISOString()
  };
}
function resolveReferral(code, subtotal) {
  const clean = referralCode(code);
  if (!clean) return { valid: false, code: '', discountAmount: 0, message: 'Masukkan kode referensi.' };
  const ref = readReferrals().find(r => referralCode(r.code) === clean);
  if (!ref) return { valid: false, code: clean, discountAmount: 0, message: 'Kode referensi tidak ditemukan.' };
  if (!ref.active) return { valid: false, code: clean, discountAmount: 0, message: 'Kode referensi sedang tidak aktif.' };
  const base = Math.max(0, Number(subtotal) || 0);
  const discountAmount = ref.type === 'fixed'
    ? Math.min(base, Math.max(0, Number(ref.value) || 0))
    : Math.min(base, Math.round(base * Math.max(0, Number(ref.value) || 0) / 100));
  return {
    valid: true,
    id: ref.id,
    code: ref.code,
    type: ref.type,
    value: Number(ref.value) || 0,
    discountAmount,
    finalTotal: Math.max(0, base - discountAmount),
    message: 'Kode referensi berhasil digunakan.'
  };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/products', (req, res) => {
  let data = [...readProducts()];
  const { search, category, sort, promo } = req.query;
  if (search) data = data.filter(p => p.name.toLowerCase().includes(String(search).toLowerCase()));
  if (category && category !== 'all') data = data.filter(p => p.category === category);
  if (promo === 'true') data = data.filter(p => Number(p.discount) > 0);
  if (sort === 'price-asc') data.sort((a, b) => a.wholesalePrice - b.wholesalePrice);
  if (sort === 'price-desc') data.sort((a, b) => b.wholesalePrice - a.wholesalePrice);
  if (sort === 'newest') data.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (sort === 'popular') data.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  res.json(data);
});

app.get('/api/products/:id', (req, res) => {
  const product = readProducts().find(x => x.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
  res.json(product);
});

app.get('/api/referrals/validate', (req, res) => {
  const subtotal = Math.max(0, Number(req.query.subtotal) || 0);
  const result = resolveReferral(req.query.code, subtotal);
  if (!result.valid) return res.status(404).json(result);
  res.json(result);
});

app.get('/api/public/orders/:id', (req, res) => {
  const phone = digits(req.query.phone);
  const order = readOrders().find(x => x.id === req.params.id);
  if (!order || !phone || digits(order.customer?.phone) !== phone) {
    return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  }
  res.json(publicOrder(order));
});

app.post('/api/orders', (req, res) => {
  const { customer, items, paymentMethod } = req.body || {};
  if (!customer?.name || !customer?.phone || !Array.isArray(items) || !items.length || !paymentMethod) {
    return res.status(400).json({ message: 'Data pesanan belum lengkap' });
  }

  const normalizedItems = items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: Math.max(1, Number(item.quantity) || 1),
    wholesalePrice: Math.max(0, Number(item.wholesalePrice) || 0)
  }));
  const originalSubtotal = normalizedItems.reduce((sum, item) => sum + item.wholesalePrice * item.quantity, 0);

  let appliedReferral = null;
  const requestedCode = referralCode(req.body.referralCode);
  if (requestedCode) {
    const result = resolveReferral(requestedCode, originalSubtotal);
    if (!result.valid) return res.status(400).json({ message: result.message });
    appliedReferral = result;
  }

  const discountAmount = appliedReferral?.discountAmount || 0;
  const finalTotal = Math.max(0, originalSubtotal - discountAmount);
  const orders = readOrders();
  const order = {
    id: `ORD-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    customer: {
      name: String(customer.name).trim(),
      phone: String(customer.phone).trim(),
      address: String(customer.address || '').trim()
    },
    items: normalizedItems,
    originalSubtotal,
    discountAmount,
    subtotal: finalTotal,
    referralCode: appliedReferral?.code || '',
    paymentMethod: String(paymentMethod),
    paymentStatus: 'MENUNGGU_VERIFIKASI',
    orderStatus: 'MENUNGGU_VERIFIKASI'
  };
  orders.unshift(order);
  writeOrders(orders);

  if (appliedReferral?.id) {
    const refs = readReferrals();
    const index = refs.findIndex(r => r.id === appliedReferral.id);
    if (index >= 0) {
      refs[index].usageCount = (Number(refs[index].usageCount) || 0) + 1;
      refs[index].updatedAt = new Date().toISOString();
      writeReferrals(refs);
    }
  }

  console.log(`Order received: ${order.id} - ${order.customer.name}`);
  res.status(201).json({ status: 'ok', order });
});

app.get('/api/orders', requireAdmin, (_req, res) => res.json(readOrders()));

app.patch('/api/orders/:id', requireAdmin, (req, res) => {
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  const paymentOptions = new Set(['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DITOLAK']);
  const orderOptions = new Set(['MENUNGGU_VERIFIKASI', 'MENUNGGU_KONFIRMASI', 'DIPROSES', 'SEDANG_DISIAPKAN', 'SIAP_DIKIRIM', 'DALAM_PENGANTARAN', 'SELESAI', 'DIBATALKAN']);
  if (req.body.paymentStatus && paymentOptions.has(req.body.paymentStatus)) orders[index].paymentStatus = req.body.paymentStatus;
  if (req.body.orderStatus && orderOptions.has(req.body.orderStatus)) orders[index].orderStatus = req.body.orderStatus;
  orders[index].updatedAt = new Date().toISOString();
  writeOrders(orders);
  res.json(orders[index]);
});

app.post('/orders/:id/action', requireAdmin, (req, res) => {
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index < 0) return res.status(404).send('Pesanan tidak ditemukan');
  const action = req.body.action;
  if (action === 'verify') {
    orders[index].paymentStatus = 'TERVERIFIKASI';
    orders[index].orderStatus = 'SEDANG_DISIAPKAN';
  }
  if (action === 'reject') {
    orders[index].paymentStatus = 'DITOLAK';
    orders[index].orderStatus = 'DIBATALKAN';
  }
  if (action === 'prepare') orders[index].orderStatus = 'SEDANG_DISIAPKAN';
  if (action === 'ready') orders[index].orderStatus = 'SIAP_DIKIRIM';
  if (action === 'deliver') orders[index].orderStatus = 'DALAM_PENGANTARAN';
  if (action === 'complete') orders[index].orderStatus = 'SELESAI';
  orders[index].updatedAt = new Date().toISOString();
  writeOrders(orders);
  if (action === 'complete') return res.redirect('/?view=selesai');
  if (['verify', 'prepare', 'ready', 'deliver'].includes(action)) return res.redirect('/?view=diproses');
  res.redirect(`/?view=${normalizeView(req.body.returnTo)}`);
});

app.get('/products', requireAdmin, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.type('html').send(renderProducts(readProducts()));
});
app.post('/products', requireAdmin, (req, res) => {
  const products = readProducts();
  const product = productFromBody(req.body);
  if (!product.name) return res.status(400).send('Nama produk wajib diisi');
  if (products.some(x => x.id === product.id)) product.id = `${product.id}-${Date.now().toString(36)}`;
  products.unshift(product);
  writeProducts(products);
  res.redirect('/products');
});
app.post('/products/:id/update', requireAdmin, (req, res) => {
  const products = readProducts();
  const index = products.findIndex(p => p.id === req.params.id);
  if (index < 0) return res.status(404).send('Produk tidak ditemukan');
  products[index] = productFromBody(req.body, products[index]);
  writeProducts(products);
  res.redirect('/products');
});
app.post('/products/:id/delete', requireAdmin, (req, res) => {
  const products = readProducts();
  const next = products.filter(p => p.id !== req.params.id);
  if (next.length === products.length) return res.status(404).send('Produk tidak ditemukan');
  writeProducts(next);
  res.redirect('/products');
});

app.get('/referrals', requireAdmin, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.type('html').send(renderReferrals(readReferrals()));
});
app.post('/referrals', requireAdmin, (req, res) => {
  const refs = readReferrals();
  const ref = referralFromBody(req.body);
  if (!ref.code) return res.status(400).send('Kode referensi wajib diisi');
  if (refs.some(r => referralCode(r.code) === ref.code)) return res.status(400).send('Kode referensi sudah digunakan');
  refs.unshift(ref);
  writeReferrals(refs);
  res.redirect('/referrals');
});
app.post('/referrals/:id/update', requireAdmin, (req, res) => {
  const refs = readReferrals();
  const index = refs.findIndex(r => r.id === req.params.id);
  if (index < 0) return res.status(404).send('Kode referensi tidak ditemukan');
  const updated = referralFromBody(req.body, refs[index]);
  if (!updated.code) return res.status(400).send('Kode referensi wajib diisi');
  if (refs.some((r, i) => i !== index && referralCode(r.code) === updated.code)) return res.status(400).send('Kode referensi sudah digunakan');
  refs[index] = { ...updated, updatedAt: new Date().toISOString() };
  writeReferrals(refs);
  res.redirect('/referrals');
});
app.post('/referrals/:id/delete', requireAdmin, (req, res) => {
  const refs = readReferrals();
  const next = refs.filter(r => r.id !== req.params.id);
  if (next.length === refs.length) return res.status(404).send('Kode referensi tidak ditemukan');
  writeReferrals(next);
  res.redirect('/referrals');
});

function exportRows(orders) {
  return orders.map(o => ({
    'Order ID': o.id,
    'Tanggal': o.createdAt ? new Date(o.createdAt).toLocaleString('id-ID') : '',
    'Nama Pelanggan': o.customer?.name || '',
    'Telepon': o.customer?.phone || '',
    'Alamat': o.customer?.address || '',
    'Item': (o.items || []).map(i => `${i.name} x ${Number(i.quantity) || 1}`).join(' | '),
    'Total Item': (o.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0),
    'Subtotal Sebelum Diskon': Number(o.originalSubtotal ?? o.subtotal) || 0,
    'Kode Referensi': o.referralCode || '',
    'Diskon Referensi': Number(o.discountAmount) || 0,
    'Total Pembayaran': Number(o.subtotal) || 0,
    'Metode Pembayaran': o.paymentMethod || '',
    'Status Pembayaran': o.paymentStatus || '',
    'Status Pesanan': o.orderStatus || ''
  }));
}
const csvEscape = value => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

app.get('/export/json', requireAdmin, (req, res) => {
  const view = normalizeView(req.query.view);
  const orders = filterOrders(readOrders(), view);
  res.setHeader('Content-Disposition', `attachment; filename="grosirhub-orders-${view}.json"`);
  res.type('application/json').send(JSON.stringify(orders, null, 2));
});
app.get('/export/csv', requireAdmin, (req, res) => {
  const view = normalizeView(req.query.view);
  const rows = exportRows(filterOrders(readOrders(), view));
  const headers = rows.length ? Object.keys(rows[0]) : [
    'Order ID', 'Tanggal', 'Nama Pelanggan', 'Telepon', 'Alamat', 'Item', 'Total Item',
    'Subtotal Sebelum Diskon', 'Kode Referensi', 'Diskon Referensi', 'Total Pembayaran',
    'Metode Pembayaran', 'Status Pembayaran', 'Status Pesanan'
  ];
  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map(row => headers.map(h => csvEscape(row[h])).join(','))
  ].join('\n');
  res.setHeader('Content-Disposition', `attachment; filename="grosirhub-orders-${view}.csv"`);
  res.type('text/csv; charset=utf-8').send(`\uFEFF${csv}`);
});
app.get('/export/excel', requireAdmin, (req, res) => {
  const view = normalizeView(req.query.view);
  const rows = exportRows(filterOrders(readOrders(), view));
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: 'Belum ada data pesanan pada klasifikasi ini' }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pesanan');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="grosirhub-orders-${view}.xlsx"`);
  res.send(buffer);
});

function actionForm(id, action, label, cls, view) {
  return `<form method="post" action="/orders/${encodeURIComponent(id)}/action"><input type="hidden" name="action" value="${action}"><input type="hidden" name="returnTo" value="${view}"><button class="${cls}">${label}</button></form>`;
}
function actionButtons(order, view) {
  const buttons = [];
  if (order.paymentStatus === 'MENUNGGU_VERIFIKASI') {
    buttons.push(
      actionForm(order.id, 'verify', 'Verifikasi & Siapkan', 'ok', view),
      actionForm(order.id, 'reject', 'Tolak Bayar', 'danger', view)
    );
  }
  if (['MENUNGGU_VERIFIKASI', 'MENUNGGU_KONFIRMASI', 'DIPROSES'].includes(order.orderStatus) && order.paymentStatus === 'TERVERIFIKASI') {
    buttons.push(actionForm(order.id, 'prepare', 'Mulai Siapkan', 'process', view));
  }
  if (['SEDANG_DISIAPKAN', 'DIPROSES'].includes(order.orderStatus)) buttons.push(actionForm(order.id, 'ready', 'Siap Dikirim', 'process', view));
  if (order.orderStatus === 'SIAP_DIKIRIM') buttons.push(actionForm(order.id, 'deliver', 'Mulai Pengantaran', 'process', view));
  if (order.orderStatus === 'DALAM_PENGANTARAN') buttons.push(actionForm(order.id, 'complete', 'Tandai Selesai', 'done', view));
  return buttons.join('');
}

function css() {
  return `:root{font-family:Inter,system-ui,Arial,sans-serif;color:#111827;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}.wrap{max-width:1380px;margin:auto;padding:28px}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:22px}.top h1{margin:0;font-size:28px}.top p{margin:6px 0 0;color:#6b7280}.nav{display:flex;gap:8px;flex-wrap:wrap}.nav a,.tab,.exportBtn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;border-radius:10px;font-size:12px;font-weight:800;padding:10px 12px;background:#fff;border:1px solid #d1d5db;color:#374151}.nav a.active,.tab.active{background:#111827;color:#fff;border-color:#111827}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}.stat,.panel{background:#fff;border:1px solid #e5e7eb;border-radius:16px}.stat{padding:18px}.stat span{font-size:12px;color:#6b7280}.stat b{display:block;font-size:25px;margin-top:6px}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px}.tabs,.exports{display:flex;gap:8px;flex-wrap:wrap}.tab b{min-width:20px;height:20px;border-radius:999px;background:#f3f4f6;display:grid;place-items:center;font-size:10px}.tab.active b{background:rgba(255,255,255,.18)}.tableWrap{overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:18px}.empty{padding:48px;text-align:center;color:#6b7280}table{width:100%;border-collapse:collapse;min-width:1100px}th,td{text-align:left;padding:14px;border-bottom:1px solid #eef0f3;vertical-align:top}th{font-size:12px;color:#6b7280;background:#fafbfc}td{font-size:13px}.orderId{font-weight:800}.muted{color:#6b7280}.pill,.status{display:inline-block;padding:5px 8px;border-radius:999px;background:#f3f4f6;font-size:11px;font-weight:800;margin-top:6px}.statusProcessing{color:#1d4ed8;background:#eff6ff}.statusCompleted{color:#dc2626;background:#fef2f2}.statusWaiting{color:#92400e;background:#fffbeb}.actions{display:flex;flex-wrap:wrap;gap:6px}.actions form{margin:0}.actions button,.btn{border:0;border-radius:9px;padding:8px 10px;font-weight:750;cursor:pointer;text-decoration:none;display:inline-flex}.ok{background:#dcfce7;color:#166534}.danger{background:#fee2e2;color:#991b1b}.process{background:#dbeafe;color:#1d4ed8}.done{background:#fee2e2;color:#b91c1c}input,select,textarea{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px 11px;font:inherit;background:#fff}textarea{min-height:80px;resize:vertical}.field label{display:block;font-size:11px;font-weight:800;margin-bottom:6px;color:#4b5563}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.panel{padding:18px;margin-bottom:16px}.panel h2{margin:0 0 15px;font-size:18px}.save{background:#111827;color:#fff}.productTable img{width:58px;height:58px;object-fit:cover;border-radius:10px;background:#f3f4f6}.check{display:flex;align-items:center;gap:8px}.check input{width:auto}.sectionTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 12px}.sectionTitle h2{margin:0}.refCode{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:900;font-size:14px;letter-spacing:.05em}.discount{color:#047857;font-weight:800}.inactive{opacity:.58}@media(max-width:900px){.wrap{padding:16px}.stats{grid-template-columns:repeat(2,1fr)}.top{flex-direction:column}.grid{grid-template-columns:1fr 1fr}}@media(max-width:580px){.grid{grid-template-columns:1fr}}`;
}

function nav(active) {
  return `<div class="nav"><a class="${active === 'orders' ? 'active' : ''}" href="/">Pesanan</a><a class="${active === 'products' ? 'active' : ''}" href="/products">Kelola Produk</a><a class="${active === 'referrals' ? 'active' : ''}" href="/referrals">Kode Referensi</a></div>`;
}

function renderDashboard(orders, view) {
  const waitingPayment = orders.filter(o => o.paymentStatus === 'MENUNGGU_VERIFIKASI').length;
  const waiting = orders.filter(o => ['MENUNGGU_VERIFIKASI', 'MENUNGGU_KONFIRMASI'].includes(o.orderStatus)).length;
  const processing = orders.filter(o => ['DIPROSES', 'SEDANG_DISIAPKAN', 'SIAP_DIKIRIM', 'DALAM_PENGANTARAN'].includes(o.orderStatus)).length;
  const completed = orders.filter(o => o.orderStatus === 'SELESAI').length;
  const visible = filterOrders(orders, view);
  const rows = visible.map(o => {
    const cls = o.orderStatus === 'SELESAI'
      ? 'status statusCompleted'
      : ['DIPROSES', 'SEDANG_DISIAPKAN', 'SIAP_DIKIRIM', 'DALAM_PENGANTARAN'].includes(o.orderStatus)
        ? 'status statusProcessing'
        : 'status statusWaiting';
    const original = Number(o.originalSubtotal ?? o.subtotal) || 0;
    const discount = Number(o.discountAmount) || 0;
    return `<tr>
      <td><div class="orderId">${esc(o.id)}</div><div class="muted">${esc(new Date(o.createdAt).toLocaleString('id-ID'))}</div></td>
      <td><b>${esc(o.customer?.name)}</b><div>${esc(o.customer?.phone)}</div><div class="muted">${esc(o.customer?.address || '-')}</div></td>
      <td>${(o.items || []).map(i => `<div>${esc(i.name)} × ${Number(i.quantity) || 1}</div>`).join('')}</td>
      <td><div>${esc(rupiah(original))}</div>${discount ? `<div class="discount">-${esc(rupiah(discount))}</div>` : ''}<b>${esc(rupiah(o.subtotal))}</b></td>
      <td>${o.referralCode ? `<span class="refCode">${esc(o.referralCode)}</span>` : '<span class="muted">—</span>'}</td>
      <td><div>${esc(o.paymentMethod)}</div><span class="pill">${esc(o.paymentStatus)}</span></td>
      <td><span class="${cls}">${esc(STATUS_LABELS[o.orderStatus] || o.orderStatus)}</span></td>
      <td><div class="actions">${actionButtons(o, view)}</div></td>
    </tr>`;
  }).join('');
  const tab = (key, label, count) => `<a class="tab ${view === key ? 'active' : ''}" href="/?view=${key}">${label}<b>${count}</b></a>`;
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="10"><title>GrosirHub Operational</title><style>${css()}</style></head><body><div class="wrap"><div class="top"><div><h1>GrosirHub Operational</h1><p>Kelola pembayaran, progres pengiriman, produk, dan kode referensi dari satu dashboard.</p></div>${nav('orders')}</div><div class="stats"><div class="stat"><span>Total Pesanan</span><b>${orders.length}</b></div><div class="stat"><span>Menunggu Verifikasi</span><b>${waitingPayment}</b></div><div class="stat"><span>Dalam Proses</span><b>${processing}</b></div><div class="stat"><span>Selesai</span><b>${completed}</b></div></div><div class="toolbar"><div class="tabs">${tab('semua', 'Semua', orders.length)}${tab('menunggu', 'Menunggu', waiting)}${tab('diproses', 'Diproses', processing)}${tab('selesai', 'Selesai', completed)}</div><div class="exports"><a class="exportBtn" href="/export/csv?view=${view}">Export CSV</a><a class="exportBtn" href="/export/excel?view=${view}">Export Excel</a><a class="exportBtn" href="/export/json?view=${view}">Export JSON</a></div></div><div class="tableWrap">${visible.length ? `<table><thead><tr><th>Order</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Kode Referensi</th><th>Pembayaran</th><th>Status Pengiriman</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">Belum ada pesanan pada klasifikasi ini.</div>'}</div></div></body></html>`;
}

function productFields(p = {}) {
  return `<div class="grid"><div class="field"><label>Nama Produk</label><input required name="name" value="${esc(p.name || '')}"></div><div class="field"><label>Kategori</label><select name="category">${['sembako', 'minuman', 'snack', 'instan', 'dapur', 'kebersihan', 'personal', 'frozen', 'usaha'].map(v => `<option value="${v}" ${p.category === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div class="field"><label>Unit / Kemasan</label><input name="unit" value="${esc(p.unit || '1 pcs')}"></div><div class="field"><label>Tag</label><input name="tag" value="${esc(p.tag || '')}"></div><div class="field"><label>Harga Normal</label><input required type="number" min="0" name="price" value="${Number(p.price) || 0}"></div><div class="field"><label>Harga Grosir</label><input required type="number" min="0" name="wholesalePrice" value="${Number(p.wholesalePrice) || 0}"></div><div class="field"><label>Diskon (%)</label><input type="number" min="0" name="discount" value="${Number(p.discount) || 0}"></div><div class="field"><label>Minimal Order</label><input type="number" min="1" name="minOrder" value="${Number(p.minOrder) || 1}"></div><div class="field"><label>Stok</label><input type="number" min="0" name="stock" value="${Number(p.stock) || 0}"></div><div class="field"><label>Emoji</label><input name="emoji" value="${esc(p.emoji || '📦')}"></div><div class="field" style="grid-column:span 2"><label>URL Gambar</label><input name="image" value="${esc(p.image || '')}"></div><div class="field" style="grid-column:1/-1"><label>Deskripsi</label><textarea name="description">${esc(p.description || '')}</textarea></div><div class="field"><label class="check"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> Produk Rekomendasi</label></div></div>`;
}

function renderProducts(products) {
  const rows = products.map(p => `<tr><td>${p.image ? `<img src="${esc(p.image)}" alt="">` : `<div style="font-size:32px">${esc(p.emoji || '📦')}</div>`}</td><td><b>${esc(p.name)}</b><div class="muted">${esc(p.id)}</div></td><td>${esc(p.category)}</td><td>${esc(rupiah(p.wholesalePrice))}</td><td>${Number(p.stock) || 0}</td><td><details><summary class="btn process">Edit</summary><form method="post" action="/products/${encodeURIComponent(p.id)}/update" style="margin-top:12px;min-width:760px">${productFields(p)}<button class="btn save" style="margin-top:12px">Simpan Perubahan</button></form></details></td><td><form method="post" action="/products/${encodeURIComponent(p.id)}/delete" onsubmit="return confirm('Hapus produk ini?')"><button class="btn danger">Hapus</button></form></td></tr>`).join('');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kelola Produk - GrosirHub</title><style>${css()}</style></head><body><div class="wrap"><div class="top"><div><h1>Kelola Produk</h1><p>Tambah, edit, atau hapus produk yang tampil pada website utama.</p></div>${nav('products')}</div><div class="panel"><h2>Tambah Produk Baru</h2><form method="post" action="/products">${productFields()}<button class="btn save" style="margin-top:14px">Tambah Produk</button></form></div><div class="sectionTitle"><h2>Daftar Produk</h2><span class="muted">${products.length} produk</span></div><div class="tableWrap"><table class="productTable"><thead><tr><th>Gambar</th><th>Produk</th><th>Kategori</th><th>Harga Grosir</th><th>Stok</th><th>Edit</th><th>Hapus</th></tr></thead><tbody>${rows}</tbody></table></div></div></body></html>`;
}

function referralFields(ref = {}) {
  return `<div class="grid"><div class="field"><label>Kode Referensi</label><input required name="code" value="${esc(ref.code || '')}" placeholder="Contoh: ARWA10" style="text-transform:uppercase"></div><div class="field"><label>Tipe Diskon</label><select name="type"><option value="percent" ${ref.type !== 'fixed' ? 'selected' : ''}>Persentase (%)</option><option value="fixed" ${ref.type === 'fixed' ? 'selected' : ''}>Nominal (Rp)</option></select></div><div class="field"><label>Nilai Diskon</label><input required type="number" min="0" name="value" value="${Number(ref.value) || 0}"></div><div class="field"><label class="check" style="margin-top:27px"><input type="checkbox" name="active" ${ref.active ? 'checked' : ''}> Aktifkan Kode</label></div></div>`;
}

function renderReferrals(referrals) {
  const rows = referrals.map(ref => `<tr class="${ref.active ? '' : 'inactive'}"><td><span class="refCode">${esc(ref.code)}</span></td><td>${ref.type === 'fixed' ? esc(rupiah(ref.value)) : `${Number(ref.value) || 0}%`}</td><td>${ref.active ? '<span class="status statusProcessing">Aktif</span>' : '<span class="status">Nonaktif</span>'}</td><td>${Number(ref.usageCount) || 0}×</td><td><details><summary class="btn process">Edit</summary><form method="post" action="/referrals/${encodeURIComponent(ref.id)}/update" style="margin-top:12px;min-width:720px">${referralFields(ref)}<button class="btn save" style="margin-top:12px">Simpan Perubahan</button></form></details></td><td><form method="post" action="/referrals/${encodeURIComponent(ref.id)}/delete" onsubmit="return confirm('Hapus kode referensi ini?')"><button class="btn danger">Hapus</button></form></td></tr>`).join('');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kode Referensi - GrosirHub</title><style>${css()}</style></head><body><div class="wrap"><div class="top"><div><h1>Kode Referensi</h1><p>Buat kode diskon yang dapat dimasukkan customer sebelum melakukan pembayaran.</p></div>${nav('referrals')}</div><div class="panel"><h2>Tambah Kode Referensi</h2><form method="post" action="/referrals">${referralFields({ active: true })}<button class="btn save" style="margin-top:14px">Tambah Kode</button></form></div><div class="sectionTitle"><h2>Daftar Kode</h2><span class="muted">${referrals.length} kode</span></div><div class="tableWrap">${referrals.length ? `<table><thead><tr><th>Kode</th><th>Diskon</th><th>Status</th><th>Dipakai</th><th>Edit</th><th>Hapus</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">Belum ada kode referensi. Tambahkan kode pertama di atas.</div>'}</div></div></body></html>`;
}

app.get('/', requireAdmin, (req, res) => {
  const view = normalizeView(req.query.view);
  res.setHeader('Cache-Control', 'no-store');
  res.type('html').send(renderDashboard(readOrders(), view));
});

app.listen(PORT, '0.0.0.0', () => console.log(`GrosirHub Operational listening on ${PORT}`));
