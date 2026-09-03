import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'grosirhub-admin';
const ORDERS_FILE = process.env.ORDERS_FILE || path.join(__dirname, 'orders.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="GrosirHub Operational"');
    return res.status(401).send('Authentication required');
  }
  const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
  const [username, password] = decoded.split(':');
  if (username !== 'admin' || password !== ADMIN_PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="GrosirHub Operational"');
    return res.status(401).send('Invalid credentials');
  }
  next();
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function rupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/orders', (req, res) => {
  const { customer, items, subtotal, paymentMethod, paymentReference } = req.body || {};
  if (!customer?.name || !customer?.phone || !Array.isArray(items) || !items.length || !paymentMethod) {
    return res.status(400).json({ message: 'Data pesanan belum lengkap' });
  }

  const orders = readOrders();
  const order = {
    id: `ORD-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    customer: {
      name: String(customer.name).trim(),
      phone: String(customer.phone).trim(),
      address: String(customer.address || '').trim()
    },
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity) || 1,
      wholesalePrice: Number(item.wholesalePrice) || 0
    })),
    subtotal: Number(subtotal) || 0,
    paymentMethod: String(paymentMethod),
    paymentReference: String(paymentReference || '').trim(),
    paymentStatus: 'MENUNGGU_VERIFIKASI',
    orderStatus: 'MENUNGGU_KONFIRMASI'
  };

  orders.unshift(order);
  writeOrders(orders);
  console.log(`Order received: ${order.id} - ${order.customer.name}`);
  res.status(201).json({ status: 'ok', order });
});

app.get('/api/orders', requireAdmin, (_req, res) => res.json(readOrders()));

app.patch('/api/orders/:id', requireAdmin, (req, res) => {
  const orders = readOrders();
  const index = orders.findIndex(order => order.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  const allowedPayment = new Set(['MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DITOLAK']);
  const allowedOrder = new Set(['MENUNGGU_KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN']);
  if (req.body.paymentStatus && allowedPayment.has(req.body.paymentStatus)) orders[index].paymentStatus = req.body.paymentStatus;
  if (req.body.orderStatus && allowedOrder.has(req.body.orderStatus)) orders[index].orderStatus = req.body.orderStatus;
  orders[index].updatedAt = new Date().toISOString();
  writeOrders(orders);
  res.json(orders[index]);
});

app.post('/orders/:id/action', requireAdmin, (req, res) => {
  const orders = readOrders();
  const index = orders.findIndex(order => order.id === req.params.id);
  if (index === -1) return res.status(404).send('Pesanan tidak ditemukan');

  const action = req.body.action;
  if (action === 'verify') orders[index].paymentStatus = 'TERVERIFIKASI';
  if (action === 'reject') orders[index].paymentStatus = 'DITOLAK';
  if (action === 'process') orders[index].orderStatus = 'DIPROSES';
  if (action === 'complete') orders[index].orderStatus = 'SELESAI';
  orders[index].updatedAt = new Date().toISOString();
  writeOrders(orders);
  res.redirect('/');
});

function renderDashboard(orders) {
  const waitingPayment = orders.filter(o => o.paymentStatus === 'MENUNGGU_VERIFIKASI').length;
  const processing = orders.filter(o => o.orderStatus === 'DIPROSES').length;
  const completed = orders.filter(o => o.orderStatus === 'SELESAI').length;

  const rows = orders.map(o => `
    <tr>
      <td><div class="orderId">${esc(o.id)}</div><div class="muted">${esc(new Date(o.createdAt).toLocaleString('id-ID'))}</div></td>
      <td><b>${esc(o.customer?.name)}</b><div>${esc(o.customer?.phone)}</div><div class="muted">${esc(o.customer?.address || '-')}</div></td>
      <td class="items">${(o.items || []).map(i => `<div>${esc(i.name)} × ${Number(i.quantity) || 1}</div>`).join('')}</td>
      <td><b>${esc(rupiah(o.subtotal))}</b></td>
      <td><div>${esc(o.paymentMethod)}</div><div class="muted">Ref: ${esc(o.paymentReference || '-')}</div><span class="pill">${esc(o.paymentStatus)}</span></td>
      <td><span class="pill">${esc(o.orderStatus)}</span></td>
      <td>
        <div class="actions">
          <form method="post" action="/orders/${encodeURIComponent(o.id)}/action"><input type="hidden" name="action" value="verify"><button class="ok">Verifikasi Bayar</button></form>
          <form method="post" action="/orders/${encodeURIComponent(o.id)}/action"><input type="hidden" name="action" value="reject"><button class="danger">Tolak Bayar</button></form>
          <form method="post" action="/orders/${encodeURIComponent(o.id)}/action"><input type="hidden" name="action" value="process"><button class="process">Proses</button></form>
          <form method="post" action="/orders/${encodeURIComponent(o.id)}/action"><input type="hidden" name="action" value="complete"><button class="done">Selesai</button></form>
        </div>
      </td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta http-equiv="refresh" content="10" />
<title>GrosirHub Operational</title>
<style>
:root{font-family:Inter,system-ui,Arial,sans-serif;color:#111827;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}.wrap{max-width:1320px;margin:auto;padding:28px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}.top h1{margin:0;font-size:28px}.top p{margin:5px 0 0;color:#6b7280}.badge{padding:8px 12px;border-radius:999px;background:#e8f7ef;color:#167447;font-weight:700;font-size:12px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}.stat{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px}.stat span{font-size:12px;color:#6b7280}.stat b{display:block;font-size:25px;margin-top:6px}.tableWrap{overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:18px}.empty{padding:48px;text-align:center;color:#6b7280}table{width:100%;border-collapse:collapse;min-width:1100px}th,td{text-align:left;padding:14px;border-bottom:1px solid #eef0f3;vertical-align:top}th{font-size:12px;color:#6b7280;background:#fafbfc}td{font-size:13px}.orderId{font-weight:800}.muted{color:#6b7280}.pill{display:inline-block;padding:5px 8px;border-radius:999px;background:#f3f4f6;font-size:11px;font-weight:700;margin-top:6px}.actions{display:flex;flex-wrap:wrap;gap:6px}.actions form{margin:0}.actions button{border:0;border-radius:9px;padding:7px 9px;font-weight:700;cursor:pointer}.ok{background:#dcfce7;color:#166534}.danger{background:#fee2e2;color:#991b1b}.process{background:#dbeafe;color:#1d4ed8}.done{background:#ede9fe;color:#6d28d9}.items{max-width:260px}.items div+div{margin-top:4px}@media(max-width:800px){.wrap{padding:16px}.stats{grid-template-columns:repeat(2,1fr)}.top{align-items:flex-start;flex-direction:column}}
</style>
</head>
<body>
<div class="wrap">
  <div class="top"><div><h1>GrosirHub Operational</h1><p>Konfirmasi pembayaran dan proses pesanan masuk. Halaman diperbarui otomatis setiap 10 detik.</p></div><div class="badge">LIVE OPERATIONAL</div></div>
  <div class="stats"><div class="stat"><span>Total Pesanan</span><b>${orders.length}</b></div><div class="stat"><span>Menunggu Verifikasi</span><b>${waitingPayment}</b></div><div class="stat"><span>Diproses</span><b>${processing}</b></div><div class="stat"><span>Selesai</span><b>${completed}</b></div></div>
  <div class="tableWrap">
    ${orders.length ? `<table><thead><tr><th>Order</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Pembayaran</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">Belum ada pesanan masuk.</div>'}
  </div>
</div>
</body>
</html>`;
}

app.get('/', requireAdmin, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.type('html').send(renderDashboard(readOrders()));
});

app.listen(PORT, '0.0.0.0', () => console.log(`GrosirHub Operational listening on ${PORT}`));
