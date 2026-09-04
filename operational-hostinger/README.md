# GrosirHub Operational — Hostinger PHP

Versi operational ini dibuat untuk **PHP hosting biasa di Hostinger**. Tidak membutuhkan Node.js, npm, Railway, atau database eksternal.

## Isi

- `index.php` — dashboard admin, REST API, referral, status order, export, Midtrans Snap + webhook.
- `.htaccess` — clean URL + security headers.
- `data/.htaccess` — memblokir akses publik ke file runtime.
- Folder `data/` akan otomatis membuat `products.json`, `orders.json`, `referrals.json`, dan `config.json`.

## Deploy

Upload **isi folder `operational-hostinger/`** ke document root website/subdomain PHP di Hostinger. Buka URL website tersebut; halaman `/setup` akan muncul otomatis.

Setup pertama hanya meminta:

- username/password admin;
- Midtrans Client Key (opsional dulu);
- Midtrans Server Key (opsional dulu);
- Sandbox/Production.

Setelah setup, webhook Midtrans otomatis menggunakan:

`<URL_OPERATIONAL>/api/midtrans/notification`

## Endpoint kompatibel dengan storefront

- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/referrals/validate`
- `POST /api/orders`
- `GET /api/public/orders/:id?phone=...`
- `GET /api/midtrans/config`
- `POST /api/midtrans/create-transaction`
- `POST /api/midtrans/notification`

Storefront Node Hostinger cukup mengubah `OPERATIONAL_API_URL` dari Railway ke URL operational PHP ini. Tidak perlu mengubah React checkout lagi.

## Catatan migrasi

Railway operational lama sebaiknya dibiarkan hidup sampai endpoint PHP sudah dites. Setelah `OPERATIONAL_API_URL` storefront diarahkan ke Hostinger PHP dan transaksi tes berhasil, Railway dapat dimatikan.
