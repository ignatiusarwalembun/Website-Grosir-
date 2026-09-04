<?php
declare(strict_types=1);

/*
 * GrosirHub Operational — Hostinger PHP edition
 * Upload this folder to a PHP-enabled Hostinger site/subdomain.
 * No Node.js, npm, Railway, or database setup is required.
 * Runtime data is stored in /data as locked JSON files.
 */

header_remove('X-Powered-By');
date_default_timezone_set('Asia/Jakarta');

const APP_NAME = 'GrosirHub Operational';
const DATA_DIR = __DIR__ . '/data';
const CONFIG_FILE = DATA_DIR . '/config.json';
const ORDERS_FILE = DATA_DIR . '/orders.json';
const PRODUCTS_FILE = DATA_DIR . '/products.json';
const REFERRALS_FILE = DATA_DIR . '/referrals.json';

if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}

function seedProducts(): array {
    $images = [
        'sembako' => 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=82',
        'minuman' => 'https://images.unsplash.com/photo-1630459065556-cd24ea585ba3?auto=format&fit=crop&w=1200&q=82',
        'snack' => 'https://images.unsplash.com/photo-1529259266118-cf22737f713f?auto=format&fit=crop&w=1200&q=82',
        'instan' => 'https://images.unsplash.com/photo-1496114212242-bac8bd9de53d?auto=format&fit=crop&w=1200&q=82',
        'dapur' => 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=82',
        'kebersihan' => 'https://images.unsplash.com/photo-1656214286228-08fdbf520d1e?auto=format&fit=crop&w=1200&q=82',
        'personal' => 'https://images.unsplash.com/photo-1562731789-8324cbe28333?auto=format&fit=crop&w=1200&q=82',
        'frozen' => 'https://images.unsplash.com/photo-1529259266118-cf22737f713f?auto=format&fit=crop&w=1200&q=82',
        'usaha' => 'https://images.unsplash.com/photo-1574422731048-f09094773986?auto=format&fit=crop&w=1200&q=82',
    ];
    $rows = [
        ['beras-premium-5kg','Beras Premium 5 Kg','sembako','5 kg / pack',68500,65000,8,2,'Beras','🌾'],
        ['minyak-goreng-2l','Minyak Goreng 2 Liter','sembako','2 L / pouch',38900,36500,10,2,'Minyak','🫗'],
        ['gula-pasir-1kg','Gula Pasir 1 Kg','sembako','1 kg / pack',17900,16500,12,3,'Gula','🧂'],
        ['tepung-terigu-1kg','Tepung Terigu 1 Kg','sembako','1 kg / pack',14900,13750,9,3,'Tepung','🌾'],
        ['air-mineral-600x24','Air Mineral 600ml x24','minuman','1 karton / 24 botol',56500,53000,14,1,'Air Mineral','💧'],
        ['mie-instan-1-dus','Mie Instan 1 Dus','instan','1 dus / 40 pcs',126000,118000,11,1,'Mie Instan','🍜'],
        ['kopi-sachet-20pcs','Kopi Sachet 20pcs','minuman','20 sachet / bag',33500,31000,7,2,'Kopi','☕'],
        ['teh-celup','Teh Celup','minuman','25 bags / box',14200,13250,5,3,'Teh','🍵'],
        ['susu-uht-1-dus','Susu UHT 1 Dus','minuman','24 x 200ml',128000,121000,8,1,'Susu','🥛'],
        ['sabun-cuci-piring','Sabun Cuci Piring','kebersihan','750ml / pouch',19500,17800,9,2,'Sabun','🧼'],
        ['detergen-1kg','Detergen 1 Kg','kebersihan','1 kg / pack',24800,22900,10,2,'Detergen','✨'],
        ['tissue-10pack','Tissue 10 Pack','kebersihan','10 pack / bundle',74500,69500,13,1,'Tissue','🧻'],
        ['kecap-600ml','Kecap 600ml','dapur','600ml / pouch',23800,21900,6,2,'Kecap','🍶'],
        ['saus-sambal-1kg','Saus Sambal 1 Kg','dapur','1 kg / pouch',27900,25800,7,2,'Saus','🌶️'],
        ['kentang-frozen-1kg','Kentang Frozen 1 Kg','frozen','1 kg / pack',42500,39500,9,2,'Frozen Food','🍟'],
        ['cup-plastik-50pcs','Cup Plastik 50pcs','usaha','50 pcs / pack',28500,26200,8,2,'Perlengkapan','🥤'],
    ];
    $out = [];
    foreach ($rows as $idx => $p) {
        $price = (int)$p[4];
        $wholesale = (int)$p[5];
        $min = (int)$p[7];
        $out[] = [
            'id'=>$p[0], 'name'=>$p[1], 'category'=>$p[2], 'unit'=>$p[3],
            'price'=>$price, 'wholesalePrice'=>$wholesale, 'discount'=>(int)$p[6],
            'minOrder'=>$min, 'tag'=>$p[8], 'emoji'=>$p[9], 'image'=>$images[$p[2]] ?? '',
            'stock'=>$idx % 6 === 0 ? 18 : 40 + $idx * 5, 'featured'=>$idx < 8,
            'createdAt'=>sprintf('2026-08-%02d', 10 + $idx),
            'description'=>$p[1] . ' untuk kebutuhan usaha, warung, restoran, cafe, dan reseller. Dikemas praktis dan cocok untuk pembelian berulang dalam jumlah besar.',
            'packaging'=>$p[3],
            'tiers'=>[
                ['min'=>$min,'max'=>4,'price'=>$price],
                ['min'=>5,'max'=>9,'price'=>(int)(round(($price * .96) / 100) * 100)],
                ['min'=>10,'max'=>null,'price'=>$wholesale],
            ],
        ];
    }
    return $out;
}

function initializeData(): void {
    if (!file_exists(ORDERS_FILE)) writeJson(ORDERS_FILE, []);
    if (!file_exists(REFERRALS_FILE)) writeJson(REFERRALS_FILE, []);
    if (!file_exists(PRODUCTS_FILE)) writeJson(PRODUCTS_FILE, seedProducts());
}

function readJson(string $file, mixed $fallback): mixed {
    if (!file_exists($file)) return $fallback;
    $fp = @fopen($file, 'rb');
    if (!$fp) return $fallback;
    try {
        flock($fp, LOCK_SH);
        $raw = stream_get_contents($fp);
        flock($fp, LOCK_UN);
    } finally {
        fclose($fp);
    }
    if (!$raw) return $fallback;
    $value = json_decode($raw, true);
    return json_last_error() === JSON_ERROR_NONE ? $value : $fallback;
}

function writeJson(string $file, mixed $value): bool {
    $fp = @fopen($file, 'c+b');
    if (!$fp) return false;
    try {
        if (!flock($fp, LOCK_EX)) return false;
        ftruncate($fp, 0);
        rewind($fp);
        $json = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $ok = fwrite($fp, $json === false ? '[]' : $json) !== false;
        fflush($fp);
        flock($fp, LOCK_UN);
        return $ok;
    } finally {
        fclose($fp);
    }
}

function updateJson(string $file, array $fallback, callable $callback): mixed {
    $fp = @fopen($file, 'c+b');
    if (!$fp) throw new RuntimeException('Penyimpanan data tidak dapat dibuka.');
    try {
        if (!flock($fp, LOCK_EX)) throw new RuntimeException('Penyimpanan data sedang terkunci.');
        rewind($fp);
        $raw = stream_get_contents($fp);
        $data = $raw ? json_decode($raw, true) : $fallback;
        if (!is_array($data)) $data = $fallback;
        $result = $callback($data);
        $next = $result['data'] ?? $data;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($next, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        fflush($fp);
        flock($fp, LOCK_UN);
        return $result['result'] ?? null;
    } finally {
        fclose($fp);
    }
}

initializeData();

function config(): array {
    $cfg = readJson(CONFIG_FILE, []);
    return is_array($cfg) ? $cfg : [];
}

function setupComplete(): bool {
    $cfg = config();
    return !empty($cfg['admin_password_hash']);
}

function requestPath(): string {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $base = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
    $base = rtrim($base, '/');
    if ($base && $base !== '.' && str_starts_with($path, $base)) {
        $path = substr($path, strlen($base));
    }
    return '/' . ltrim($path, '/');
}

function baseUrl(): string {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $base = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
    $base = $base === '/' || $base === '.' ? '' : rtrim($base, '/');
    return $scheme . '://' . $host . $base;
}

function jsonResponse(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function bodyJson(): array {
    $raw = file_get_contents('php://input');
    $data = $raw ? json_decode($raw, true) : [];
    return is_array($data) ? $data : [];
}

function redirectTo(string $path): never {
    header('Location: ' . $path);
    exit;
}

function esc(mixed $value): string {
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function rupiah(mixed $value): string {
    return 'Rp' . number_format((float)$value, 0, ',', '.');
}

function digits(mixed $value): string {
    return preg_replace('/\D+/', '', (string)$value) ?? '';
}

function referralCode(mixed $value): string {
    return strtoupper(preg_replace('/\s+/', '', trim((string)$value)) ?? '');
}

function slugify(string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? 'produk';
    $value = trim($value, '-');
    return substr($value ?: ('produk-' . time()), 0, 70);
}

function requireAdmin(): void {
    $cfg = config();
    $user = $_SERVER['PHP_AUTH_USER'] ?? '';
    $pass = $_SERVER['PHP_AUTH_PW'] ?? '';
    $expectedUser = (string)($cfg['admin_username'] ?? 'admin');
    $hash = (string)($cfg['admin_password_hash'] ?? '');
    if (!$hash || !hash_equals($expectedUser, $user) || !password_verify($pass, $hash)) {
        header('WWW-Authenticate: Basic realm="GrosirHub Operational"');
        http_response_code(401);
        echo 'Authentication required';
        exit;
    }
}

function statusLabels(): array {
    return [
        'MENUNGGU_PEMBAYARAN'=>'Menunggu Pembayaran',
        'MENUNGGU_VERIFIKASI'=>'Menunggu Verifikasi Pembayaran',
        'MENUNGGU_KONFIRMASI'=>'Menunggu Konfirmasi',
        'DIPROSES'=>'Pesanan Sedang Disiapkan',
        'SEDANG_DISIAPKAN'=>'Pesanan Sedang Disiapkan',
        'SIAP_DIKIRIM'=>'Pesanan Siap Dikirim',
        'DALAM_PENGANTARAN'=>'Dalam Pengantaran',
        'SELESAI'=>'Selesai',
        'DIBATALKAN'=>'Dibatalkan',
    ];
}

function normalizeView(string $value): string {
    return in_array($value, ['semua','menunggu','diproses','selesai'], true) ? $value : 'semua';
}

function filterOrders(array $orders, string $view): array {
    if ($view === 'menunggu') return array_values(array_filter($orders, fn($o) => in_array($o['orderStatus'] ?? '', ['MENUNGGU_PEMBAYARAN','MENUNGGU_VERIFIKASI','MENUNGGU_KONFIRMASI'], true)));
    if ($view === 'diproses') return array_values(array_filter($orders, fn($o) => in_array($o['orderStatus'] ?? '', ['DIPROSES','SEDANG_DISIAPKAN','SIAP_DIKIRIM','DALAM_PENGANTARAN'], true)));
    if ($view === 'selesai') return array_values(array_filter($orders, fn($o) => ($o['orderStatus'] ?? '') === 'SELESAI'));
    return $orders;
}

function resolveReferral(string $code, float $subtotal): array {
    $clean = referralCode($code);
    if ($clean === '') return ['valid'=>false,'code'=>'','discountAmount'=>0,'message'=>'Masukkan kode referensi.'];
    $refs = readJson(REFERRALS_FILE, []);
    foreach ($refs as $ref) {
        if (referralCode($ref['code'] ?? '') !== $clean) continue;
        if (empty($ref['active'])) return ['valid'=>false,'code'=>$clean,'discountAmount'=>0,'message'=>'Kode referensi sedang tidak aktif.'];
        $base = max(0, $subtotal);
        $value = max(0, (float)($ref['value'] ?? 0));
        $discount = ($ref['type'] ?? 'percent') === 'fixed'
            ? min($base, $value)
            : min($base, round($base * min(100, $value) / 100));
        return [
            'valid'=>true,'id'=>$ref['id'],'code'=>$ref['code'],'type'=>$ref['type'] ?? 'percent','value'=>$value,
            'discountAmount'=>(int)$discount,'finalTotal'=>(int)max(0, $base - $discount),
            'message'=>'Kode referensi berhasil digunakan.'
        ];
    }
    return ['valid'=>false,'code'=>$clean,'discountAmount'=>0,'message'=>'Kode referensi tidak ditemukan.'];
}

function makeOrderId(): string {
    return 'ORD-' . strtoupper(base_convert((string)time(), 10, 36)) . '-' . strtoupper(bin2hex(random_bytes(3)));
}

function buildOrder(array $body, array $options = []): array {
    $customer = is_array($body['customer'] ?? null) ? $body['customer'] : [];
    $items = is_array($body['items'] ?? null) ? $body['items'] : [];
    if (trim((string)($customer['name'] ?? '')) === '' || trim((string)($customer['phone'] ?? '')) === '' || trim((string)($customer['address'] ?? '')) === '' || !$items) {
        throw new InvalidArgumentException('Data pesanan belum lengkap');
    }
    $products = readJson(PRODUCTS_FILE, seedProducts());
    $map = [];
    foreach ($products as $p) $map[(string)$p['id']] = $p;
    $normalized = [];
    foreach ($items as $raw) {
        $id = (string)($raw['id'] ?? '');
        if (!isset($map[$id])) throw new InvalidArgumentException('Produk tidak ditemukan: ' . (string)($raw['name'] ?? $id));
        $p = $map[$id];
        $qty = max(1, (int)($raw['quantity'] ?? 1));
        $normalized[] = [
            'id'=>$p['id'],'name'=>$p['name'],'quantity'=>$qty,
            'wholesalePrice'=>max(0, (int)round((float)($p['wholesalePrice'] ?? 0)))
        ];
    }
    $originalSubtotal = 0;
    foreach ($normalized as $item) $originalSubtotal += $item['wholesalePrice'] * $item['quantity'];
    $applied = null;
    $requested = referralCode($body['referralCode'] ?? '');
    if ($requested !== '') {
        $applied = resolveReferral($requested, (float)$originalSubtotal);
        if (empty($applied['valid'])) throw new InvalidArgumentException((string)$applied['message']);
    }
    $discount = (int)($applied['discountAmount'] ?? 0);
    $final = max(0, $originalSubtotal - $discount);
    $order = [
        'id'=>$options['id'] ?? makeOrderId(),
        'createdAt'=>date(DATE_ATOM),
        'customer'=>[
            'name'=>trim((string)$customer['name']),
            'phone'=>trim((string)$customer['phone']),
            'address'=>trim((string)$customer['address'])
        ],
        'items'=>$normalized,
        'originalSubtotal'=>$originalSubtotal,
        'discountAmount'=>$discount,
        'subtotal'=>$final,
        'referralCode'=>$applied['code'] ?? '',
        'referralId'=>$applied['id'] ?? '',
        'paymentMethod'=>$options['paymentMethod'] ?? (string)($body['paymentMethod'] ?? 'Manual'),
        'paymentStatus'=>$options['paymentStatus'] ?? 'MENUNGGU_VERIFIKASI',
        'orderStatus'=>$options['orderStatus'] ?? 'MENUNGGU_VERIFIKASI',
    ];
    return ['order'=>$order,'appliedReferral'=>$applied];
}

function publicOrder(array $o): array {
    return [
        'id'=>$o['id'] ?? '', 'createdAt'=>$o['createdAt'] ?? '', 'updatedAt'=>$o['updatedAt'] ?? null,
        'customer'=>['name'=>$o['customer']['name'] ?? '', 'phone'=>$o['customer']['phone'] ?? '', 'address'=>$o['customer']['address'] ?? ''],
        'items'=>$o['items'] ?? [],
        'originalSubtotal'=>(int)($o['originalSubtotal'] ?? $o['subtotal'] ?? 0),
        'discountAmount'=>(int)($o['discountAmount'] ?? 0), 'subtotal'=>(int)($o['subtotal'] ?? 0),
        'referralCode'=>$o['referralCode'] ?? '', 'paymentMethod'=>$o['paymentMethod'] ?? '',
        'paymentStatus'=>$o['paymentStatus'] ?? '', 'midtransTransactionStatus'=>$o['midtransTransactionStatus'] ?? '',
        'orderStatus'=>$o['orderStatus'] ?? 'MENUNGGU_VERIFIKASI'
    ];
}

function recordReferralUsage(array &$order): void {
    if (empty($order['referralId']) || !empty($order['referralCountedAt'])) return;
    $refId = (string)$order['referralId'];
    updateJson(REFERRALS_FILE, [], function(array $refs) use ($refId) {
        foreach ($refs as &$ref) {
            if (($ref['id'] ?? '') === $refId) {
                $ref['usageCount'] = (int)($ref['usageCount'] ?? 0) + 1;
                $ref['updatedAt'] = date(DATE_ATOM);
                break;
            }
        }
        unset($ref);
        return ['data'=>$refs];
    });
    $order['referralCountedAt'] = date(DATE_ATOM);
}

function paymentConfigured(): bool {
    $cfg = config();
    return trim((string)($cfg['midtrans_server_key'] ?? '')) !== '' && trim((string)($cfg['midtrans_client_key'] ?? '')) !== '';
}

function snapBase(array $cfg): string {
    return !empty($cfg['midtrans_is_production']) ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
}

function midtransRequest(string $method, string $url, ?array $payload = null): array {
    $cfg = config();
    $serverKey = trim((string)($cfg['midtrans_server_key'] ?? ''));
    if ($serverKey === '') throw new RuntimeException('Midtrans Server Key belum dikonfigurasi.');
    if (!function_exists('curl_init')) throw new RuntimeException('PHP cURL tidak aktif pada hosting.');
    $ch = curl_init($url);
    $headers = ['Accept: application/json', 'Content-Type: application/json'];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_CUSTOMREQUEST=>$method,
        CURLOPT_USERPWD=>$serverKey . ':',
        CURLOPT_HTTPAUTH=>CURLAUTH_BASIC,
        CURLOPT_CONNECTTIMEOUT=>10,
        CURLOPT_TIMEOUT=>25,
        CURLOPT_HTTPHEADER=>$headers,
    ]);
    if ($payload !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) throw new RuntimeException('Midtrans tidak dapat dihubungi: ' . $err);
    $data = json_decode($raw, true);
    if (!is_array($data)) $data = [];
    if ($status < 200 || $status >= 300) {
        $message = $data['status_message'] ?? (isset($data['error_messages']) && is_array($data['error_messages']) ? implode(', ', $data['error_messages']) : 'Midtrans mengembalikan error ' . $status);
        throw new RuntimeException((string)$message);
    }
    return $data;
}

function createMidtransTransaction(array $order): array {
    $cfg = config();
    $details = [];
    foreach ($order['items'] as $idx => $item) {
        $details[] = [
            'id'=>substr((string)($item['id'] ?? ('ITEM-' . ($idx + 1))), 0, 50),
            'price'=>(int)$item['wholesalePrice'], 'quantity'=>max(1, (int)$item['quantity']),
            'name'=>substr(str_replace('|', '/', (string)$item['name']), 0, 50)
        ];
    }
    if (($order['discountAmount'] ?? 0) > 0) {
        $details[] = [
            'id'=>'DISC-' . substr((string)($order['referralCode'] ?: 'REF'), 0, 40),
            'price'=>-(int)$order['discountAmount'], 'quantity'=>1,
            'name'=>substr('Diskon ' . (string)($order['referralCode'] ?: 'Referensi'), 0, 50)
        ];
    }
    $payload = [
        'transaction_details'=>['order_id'=>$order['id'],'gross_amount'=>(int)$order['subtotal']],
        'item_details'=>$details,
        'customer_details'=>[
            'first_name'=>substr((string)$order['customer']['name'], 0, 50),
            'phone'=>substr((string)$order['customer']['phone'], 0, 30),
            'shipping_address'=>[
                'first_name'=>substr((string)$order['customer']['name'], 0, 50),
                'phone'=>substr((string)$order['customer']['phone'], 0, 30),
                'address'=>substr((string)$order['customer']['address'], 0, 200),
                'country_code'=>'IDN'
            ]
        ],
        'callbacks'=>['finish'=>baseUrl()]
    ];
    $url = snapBase($cfg) . '/snap/v1/transactions';
    $serverKey = trim((string)($cfg['midtrans_server_key'] ?? ''));
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_POST=>true,
        CURLOPT_USERPWD=>$serverKey . ':',
        CURLOPT_HTTPAUTH=>CURLAUTH_BASIC,
        CURLOPT_CONNECTTIMEOUT=>10,
        CURLOPT_TIMEOUT=>25,
        CURLOPT_HTTPHEADER=>[
            'Accept: application/json',
            'Content-Type: application/json',
            'X-Override-Notification: ' . baseUrl() . '/api/midtrans/notification'
        ],
        CURLOPT_POSTFIELDS=>json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
    ]);
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) throw new RuntimeException('Midtrans tidak dapat dihubungi: ' . $err);
    $data = json_decode($raw, true);
    if (!is_array($data)) $data = [];
    if ($status < 200 || $status >= 300 || empty($data['token'])) {
        $message = $data['status_message'] ?? (isset($data['error_messages']) && is_array($data['error_messages']) ? implode(', ', $data['error_messages']) : 'Midtrans gagal membuat transaksi.');
        throw new RuntimeException((string)$message);
    }
    return $data;
}

function validMidtransSignature(array $body): bool {
    $cfg = config();
    $serverKey = (string)($cfg['midtrans_server_key'] ?? '');
    if ($serverKey === '' || empty($body['signature_key'])) return false;
    $source = (string)($body['order_id'] ?? '') . (string)($body['status_code'] ?? '') . (string)($body['gross_amount'] ?? '') . $serverKey;
    return hash_equals(hash('sha512', $source), (string)$body['signature_key']);
}

function setupPage(string $message = '', bool $error = false): never {
    $done = setupComplete();
    if ($done) requireAdmin();
    $cfg = config();
    $title = $done ? 'Pengaturan' : 'Setup GrosirHub Operational';
    $production = !empty($cfg['midtrans_is_production']);
    echo '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.esc($title).'</title><style>'.css().'</style></head><body><div class="wrap narrow">';
    echo '<div class="top"><div><h1>'.esc($title).'</h1><p>'.($done ? 'Atur login admin dan koneksi Midtrans.' : 'Setup satu kali. Setelah disimpan, dashboard langsung aktif.').'</p></div>'.($done ? nav('settings') : '').'</div>';
    if ($message) echo '<div class="notice '.($error?'bad':'good').'">'.esc($message).'</div>';
    echo '<div class="panel"><form method="post" action="'.($done?'/settings':'/setup').'">';
    echo '<div class="grid two"><div class="field"><label>Username Admin</label><input name="admin_username" required value="'.esc($cfg['admin_username'] ?? 'admin').'"></div><div class="field"><label>'.($done?'Password Admin Baru (opsional)':'Password Admin').'</label><input type="password" name="admin_password" '.($done?'':'required').' minlength="8" placeholder="Minimal 8 karakter"></div>';
    echo '<div class="field"><label>Midtrans Client Key</label><input name="midtrans_client_key" value="'.esc($cfg['midtrans_client_key'] ?? '').'" placeholder="SB-Mid-client-..."></div><div class="field"><label>Midtrans Server Key</label><input type="password" name="midtrans_server_key" value="'.esc($cfg['midtrans_server_key'] ?? '').'" placeholder="SB-Mid-server-..."></div>';
    echo '<div class="field"><label class="check"><input type="checkbox" name="midtrans_is_production" '.($production?'checked':'').'> Gunakan Midtrans Production</label></div></div>';
    echo '<div class="notice">Webhook otomatis: <b>'.esc(baseUrl().'/api/midtrans/notification').'</b></div>';
    echo '<button class="btn save" style="margin-top:16px">'.($done?'Simpan Pengaturan':'Aktifkan Dashboard').'</button></form></div></div></body></html>';
    exit;
}

function css(): string {
    return ':root{font-family:Inter,system-ui,Arial,sans-serif;color:#111827;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}.wrap{max-width:1380px;margin:auto;padding:28px}.wrap.narrow{max-width:980px}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:22px}.top h1{margin:0;font-size:28px}.top p{margin:6px 0 0;color:#6b7280}.nav{display:flex;gap:8px;flex-wrap:wrap}.nav a,.tab,.exportBtn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;border-radius:10px;font-size:12px;font-weight:800;padding:10px 12px;background:#fff;border:1px solid #d1d5db;color:#374151}.nav a.active,.tab.active{background:#111827;color:#fff;border-color:#111827}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}.stat,.panel{background:#fff;border:1px solid #e5e7eb;border-radius:16px}.stat{padding:18px}.stat span{font-size:12px;color:#6b7280}.stat b{display:block;font-size:25px;margin-top:6px}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px}.tabs,.exports{display:flex;gap:8px;flex-wrap:wrap}.tab b{min-width:20px;height:20px;border-radius:999px;background:#f3f4f6;display:grid;place-items:center;font-size:10px}.tab.active b{background:rgba(255,255,255,.18)}.tableWrap{overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:18px}.empty{padding:48px;text-align:center;color:#6b7280}table{width:100%;border-collapse:collapse;min-width:1100px}th,td{text-align:left;padding:14px;border-bottom:1px solid #eef0f3;vertical-align:top}th{font-size:12px;color:#6b7280;background:#fafbfc}td{font-size:13px}.orderId{font-weight:800}.muted{color:#6b7280}.pill,.status{display:inline-block;padding:5px 8px;border-radius:999px;background:#f3f4f6;font-size:11px;font-weight:800;margin-top:6px}.statusProcessing{color:#1d4ed8;background:#eff6ff}.statusCompleted{color:#dc2626;background:#fef2f2}.statusWaiting{color:#92400e;background:#fffbeb}.actions{display:flex;flex-wrap:wrap;gap:6px}.actions form{margin:0}.actions button,.btn{border:0;border-radius:9px;padding:8px 10px;font-weight:750;cursor:pointer;text-decoration:none;display:inline-flex}.ok{background:#dcfce7;color:#166534}.danger{background:#fee2e2;color:#991b1b}.process{background:#dbeafe;color:#1d4ed8}.done{background:#fee2e2;color:#b91c1c}input,select,textarea{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px 11px;font:inherit;background:#fff}textarea{min-height:80px;resize:vertical}.field label{display:block;font-size:11px;font-weight:800;margin-bottom:6px;color:#4b5563}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.grid.two{grid-template-columns:1fr 1fr}.panel{padding:18px;margin-bottom:16px}.panel h2{margin:0 0 15px;font-size:18px}.save{background:#111827;color:#fff}.productTable img{width:58px;height:58px;object-fit:cover;border-radius:10px;background:#f3f4f6}.check{display:flex!important;align-items:center;gap:8px;margin-top:26px}.check input{width:auto}.sectionTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 12px}.sectionTitle h2{margin:0}.refCode{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:900;font-size:14px;letter-spacing:.05em}.discount{color:#047857;font-weight:800}.inactive{opacity:.58}.notice{padding:12px 14px;border-radius:12px;background:#eff6ff;color:#1e3a8a;font-size:12px;line-height:1.6;margin:12px 0}.notice.good{background:#ecfdf5;color:#065f46}.notice.bad{background:#fef2f2;color:#991b1b}@media(max-width:900px){.wrap{padding:16px}.stats{grid-template-columns:repeat(2,1fr)}.top{flex-direction:column}.grid,.grid.two{grid-template-columns:1fr 1fr}}@media(max-width:580px){.grid,.grid.two{grid-template-columns:1fr}}';
}

function nav(string $active): string {
    return '<div class="nav"><a class="'.($active==='orders'?'active':'').'" href="./">Pesanan</a><a class="'.($active==='products'?'active':'').'" href="./products">Kelola Produk</a><a class="'.($active==='referrals'?'active':'').'" href="./referrals">Kode Referensi</a><a class="'.($active==='settings'?'active':'').'" href="./settings">Pengaturan</a></div>';
}

function productFields(array $p = []): string {
    $cats = ['sembako','minuman','snack','instan','dapur','kebersihan','personal','frozen','usaha'];
    $options = '';
    foreach ($cats as $v) $options .= '<option value="'.$v.'" '.(($p['category'] ?? '')===$v?'selected':'').'>'.$v.'</option>';
    return '<div class="grid"><div class="field"><label>Nama Produk</label><input required name="name" value="'.esc($p['name'] ?? '').'"></div><div class="field"><label>Kategori</label><select name="category">'.$options.'</select></div><div class="field"><label>Unit / Kemasan</label><input name="unit" value="'.esc($p['unit'] ?? '1 pcs').'"></div><div class="field"><label>Tag</label><input name="tag" value="'.esc($p['tag'] ?? '').'"></div><div class="field"><label>Harga Normal</label><input required type="number" min="0" name="price" value="'.(int)($p['price'] ?? 0).'"></div><div class="field"><label>Harga Grosir</label><input required type="number" min="0" name="wholesalePrice" value="'.(int)($p['wholesalePrice'] ?? 0).'"></div><div class="field"><label>Diskon (%)</label><input type="number" min="0" name="discount" value="'.(int)($p['discount'] ?? 0).'"></div><div class="field"><label>Minimal Order</label><input type="number" min="1" name="minOrder" value="'.max(1,(int)($p['minOrder'] ?? 1)).'"></div><div class="field"><label>Stok</label><input type="number" min="0" name="stock" value="'.(int)($p['stock'] ?? 0).'"></div><div class="field"><label>Emoji</label><input name="emoji" value="'.esc($p['emoji'] ?? '📦').'"></div><div class="field" style="grid-column:span 2"><label>URL Gambar</label><input name="image" value="'.esc($p['image'] ?? '').'"></div><div class="field" style="grid-column:1/-1"><label>Deskripsi</label><textarea name="description">'.esc($p['description'] ?? '').'</textarea></div><div class="field"><label class="check"><input type="checkbox" name="featured" '.(!empty($p['featured'])?'checked':'').'> Produk Rekomendasi</label></div></div>';
}

function productFromPost(array $existing = []): array {
    $name = trim((string)($_POST['name'] ?? $existing['name'] ?? ''));
    $price = max(0, (int)($_POST['price'] ?? $existing['price'] ?? 0));
    $wholesale = max(0, (int)($_POST['wholesalePrice'] ?? $existing['wholesalePrice'] ?? $price));
    $min = max(1, (int)($_POST['minOrder'] ?? $existing['minOrder'] ?? 1));
    $unit = trim((string)($_POST['unit'] ?? $existing['unit'] ?? '1 pcs')) ?: '1 pcs';
    return array_merge($existing, [
        'id'=>$existing['id'] ?? slugify($name), 'name'=>$name,
        'category'=>trim((string)($_POST['category'] ?? $existing['category'] ?? 'sembako')) ?: 'sembako',
        'unit'=>$unit, 'price'=>$price, 'wholesalePrice'=>$wholesale,
        'discount'=>max(0,(int)($_POST['discount'] ?? $existing['discount'] ?? 0)), 'minOrder'=>$min,
        'tag'=>trim((string)($_POST['tag'] ?? $existing['tag'] ?? '')), 'emoji'=>trim((string)($_POST['emoji'] ?? $existing['emoji'] ?? '📦')) ?: '📦',
        'image'=>trim((string)($_POST['image'] ?? $existing['image'] ?? '')), 'stock'=>max(0,(int)($_POST['stock'] ?? $existing['stock'] ?? 0)),
        'featured'=>isset($_POST['featured']), 'createdAt'=>$existing['createdAt'] ?? date('Y-m-d'),
        'description'=>trim((string)($_POST['description'] ?? $existing['description'] ?? '')), 'packaging'=>$unit,
        'tiers'=>[['min'=>$min,'max'=>4,'price'=>$price],['min'=>5,'max'=>9,'price'=>(int)(round($price*.96/100)*100)],['min'=>10,'max'=>null,'price'=>$wholesale]]
    ]);
}

function referralFields(array $ref = []): string {
    return '<div class="grid"><div class="field"><label>Kode Referensi</label><input required name="code" value="'.esc($ref['code'] ?? '').'" placeholder="Contoh: ARWA10" style="text-transform:uppercase"></div><div class="field"><label>Tipe Diskon</label><select name="type"><option value="percent" '.(($ref['type'] ?? 'percent')!=='fixed'?'selected':'').'>Persentase (%)</option><option value="fixed" '.(($ref['type'] ?? '')==='fixed'?'selected':'').'>Nominal (Rp)</option></select></div><div class="field"><label>Nilai Diskon</label><input required type="number" min="0" name="value" value="'.(float)($ref['value'] ?? 0).'"></div><div class="field"><label class="check"><input type="checkbox" name="active" '.(!array_key_exists('active',$ref)||!empty($ref['active'])?'checked':'').'> Aktifkan Kode</label></div></div>';
}

function renderDashboard(array $orders, string $view): never {
    requireAdmin();
    $labels = statusLabels();
    $waitingPayment = count(array_filter($orders, fn($o)=>in_array($o['paymentStatus'] ?? '',['MENUNGGU_PEMBAYARAN','MENUNGGU_VERIFIKASI'],true)));
    $waiting = count(array_filter($orders, fn($o)=>in_array($o['orderStatus'] ?? '',['MENUNGGU_PEMBAYARAN','MENUNGGU_VERIFIKASI','MENUNGGU_KONFIRMASI'],true)));
    $processing = count(array_filter($orders, fn($o)=>in_array($o['orderStatus'] ?? '',['DIPROSES','SEDANG_DISIAPKAN','SIAP_DIKIRIM','DALAM_PENGANTARAN'],true)));
    $completed = count(array_filter($orders, fn($o)=>($o['orderStatus'] ?? '')==='SELESAI'));
    $visible = filterOrders($orders,$view);
    $rows='';
    foreach($visible as $o){
        $status=$o['orderStatus']??'MENUNGGU_VERIFIKASI';
        $cls=$status==='SELESAI'?'status statusCompleted':(in_array($status,['DIPROSES','SEDANG_DISIAPKAN','SIAP_DIKIRIM','DALAM_PENGANTARAN'],true)?'status statusProcessing':'status statusWaiting');
        $items=''; foreach($o['items']??[] as $i) $items.='<div>'.esc($i['name']??'').' × '.max(1,(int)($i['quantity']??1)).'</div>';
        $original=(int)($o['originalSubtotal']??$o['subtotal']??0); $discount=(int)($o['discountAmount']??0);
        $actions='';
        if (($o['paymentStatus']??'')==='MENUNGGU_VERIFIKASI') $actions.='<form method="post" action="./orders/'.rawurlencode((string)$o['id']).'/action"><input type="hidden" name="action" value="verify"><button class="ok">Verifikasi & Siapkan</button></form><form method="post" action="./orders/'.rawurlencode((string)$o['id']).'/action"><input type="hidden" name="action" value="reject"><button class="danger">Tolak Bayar</button></form>';
        if (in_array($status,['SEDANG_DISIAPKAN','DIPROSES'],true)) $actions.='<form method="post" action="./orders/'.rawurlencode((string)$o['id']).'/action"><input type="hidden" name="action" value="ready"><button class="process">Siap Dikirim</button></form>';
        if ($status==='SIAP_DIKIRIM') $actions.='<form method="post" action="./orders/'.rawurlencode((string)$o['id']).'/action"><input type="hidden" name="action" value="deliver"><button class="process">Mulai Pengantaran</button></form>';
        if ($status==='DALAM_PENGANTARAN') $actions.='<form method="post" action="./orders/'.rawurlencode((string)$o['id']).'/action"><input type="hidden" name="action" value="complete"><button class="done">Tandai Selesai</button></form>';
        $rows.='<tr><td><div class="orderId">'.esc($o['id']).'</div><div class="muted">'.esc(date('d/m/Y H:i',strtotime((string)($o['createdAt']??'now')))).'</div></td><td><b>'.esc($o['customer']['name']??'').'</b><div>'.esc($o['customer']['phone']??'').'</div><div class="muted">'.esc($o['customer']['address']??'-').'</div></td><td>'.$items.'</td><td><div>'.rupiah($original).'</div>'.($discount?'<div class="discount">-'.rupiah($discount).'</div>':'').'<b>'.rupiah($o['subtotal']??0).'</b></td><td>'.(!empty($o['referralCode'])?'<span class="refCode">'.esc($o['referralCode']).'</span>':'<span class="muted">—</span>').'</td><td><div>'.esc($o['paymentMethod']??'').'</div><span class="pill">'.esc($o['paymentStatus']??'').'</span></td><td><span class="'.$cls.'">'.esc($labels[$status]??$status).'</span></td><td><div class="actions">'.$actions.'</div></td></tr>';
    }
    $tab=fn($key,$label,$count)=>'<a class="tab '.($view===$key?'active':'').'" href="./?view='.$key.'">'.$label.'<b>'.$count.'</b></a>';
    echo '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="10"><title>'.APP_NAME.'</title><style>'.css().'</style></head><body><div class="wrap"><div class="top"><div><h1>'.APP_NAME.'</h1><p>Kelola pembayaran, progres pengiriman, produk, kode referensi, dan Midtrans dari Hostinger.</p></div>'.nav('orders').'</div><div class="stats"><div class="stat"><span>Total Pesanan</span><b>'.count($orders).'</b></div><div class="stat"><span>Menunggu Pembayaran</span><b>'.$waitingPayment.'</b></div><div class="stat"><span>Dalam Proses</span><b>'.$processing.'</b></div><div class="stat"><span>Selesai</span><b>'.$completed.'</b></div></div><div class="toolbar"><div class="tabs">'.$tab('semua','Semua',count($orders)).$tab('menunggu','Menunggu',$waiting).$tab('diproses','Diproses',$processing).$tab('selesai','Selesai',$completed).'</div><div class="exports"><a class="exportBtn" href="./export/csv?view='.$view.'">Export CSV</a><a class="exportBtn" href="./export/excel?view='.$view.'">Export Excel</a><a class="exportBtn" href="./export/json?view='.$view.'">Export JSON</a></div></div><div class="tableWrap">'.($visible?'<table><thead><tr><th>Order</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Kode Referensi</th><th>Pembayaran</th><th>Status Pengiriman</th><th>Aksi</th></tr></thead><tbody>'.$rows.'</tbody></table>':'<div class="empty">Belum ada pesanan pada klasifikasi ini.</div>').'</div></div></body></html>';
    exit;
}

$path = requestPath();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if (!setupComplete()) {
    if ($path === '/setup' && $method === 'POST') {
        $password = (string)($_POST['admin_password'] ?? '');
        if (strlen($password) < 8) setupPage('Password admin minimal 8 karakter.', true);
        $cfg = [
            'admin_username'=>trim((string)($_POST['admin_username'] ?? 'admin')) ?: 'admin',
            'admin_password_hash'=>password_hash($password, PASSWORD_DEFAULT),
            'midtrans_client_key'=>trim((string)($_POST['midtrans_client_key'] ?? '')),
            'midtrans_server_key'=>trim((string)($_POST['midtrans_server_key'] ?? '')),
            'midtrans_is_production'=>isset($_POST['midtrans_is_production']),
            'updatedAt'=>date(DATE_ATOM)
        ];
        writeJson(CONFIG_FILE,$cfg);
        redirectTo('./');
    }
    if ($path !== '/setup') redirectTo('./setup');
    setupPage();
}

if (($path === '/settings' || $path === '/setup') && $method === 'GET') setupPage();
if ($path === '/settings' && $method === 'POST') {
    requireAdmin();
    $cfg = config();
    $cfg['admin_username'] = trim((string)($_POST['admin_username'] ?? $cfg['admin_username'] ?? 'admin')) ?: 'admin';
    $newPassword = (string)($_POST['admin_password'] ?? '');
    if ($newPassword !== '') {
        if (strlen($newPassword) < 8) setupPage('Password admin minimal 8 karakter.', true);
        $cfg['admin_password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
    }
    $cfg['midtrans_client_key'] = trim((string)($_POST['midtrans_client_key'] ?? ''));
    $cfg['midtrans_server_key'] = trim((string)($_POST['midtrans_server_key'] ?? ''));
    $cfg['midtrans_is_production'] = isset($_POST['midtrans_is_production']);
    $cfg['updatedAt'] = date(DATE_ATOM);
    writeJson(CONFIG_FILE,$cfg);
    setupPage('Pengaturan berhasil disimpan.');
}

if ($path === '/api/health' && $method === 'GET') jsonResponse(['status'=>'ok','runtime'=>'php','storage'=>'hostinger-json']);

if ($path === '/api/products' && $method === 'GET') {
    $data = readJson(PRODUCTS_FILE, seedProducts());
    $search = strtolower(trim((string)($_GET['search'] ?? '')));
    $category = (string)($_GET['category'] ?? '');
    $promo = (string)($_GET['promo'] ?? '');
    if ($search !== '') $data = array_values(array_filter($data, fn($p)=>str_contains(strtolower((string)$p['name']),$search)));
    if ($category !== '' && $category !== 'all') $data = array_values(array_filter($data, fn($p)=>($p['category']??'')===$category));
    if ($promo === 'true') $data = array_values(array_filter($data, fn($p)=>(float)($p['discount']??0)>0));
    $sort = (string)($_GET['sort'] ?? '');
    if ($sort === 'price-asc') usort($data,fn($a,$b)=>($a['wholesalePrice']??0)<=>($b['wholesalePrice']??0));
    if ($sort === 'price-desc') usort($data,fn($a,$b)=>($b['wholesalePrice']??0)<=>($a['wholesalePrice']??0));
    if ($sort === 'newest') usort($data,fn($a,$b)=>strcmp((string)($b['createdAt']??''),(string)($a['createdAt']??'')));
    if ($sort === 'popular') usort($data,fn($a,$b)=>(int)!empty($b['featured'])<=>(int)!empty($a['featured']));
    jsonResponse($data);
}

if (preg_match('#^/api/products/([^/]+)$#',$path,$m) && $method==='GET') {
    $id=rawurldecode($m[1]); foreach(readJson(PRODUCTS_FILE,[]) as $p) if(($p['id']??'')===$id) jsonResponse($p);
    jsonResponse(['message'=>'Produk tidak ditemukan'],404);
}

if ($path === '/api/referrals/validate' && $method === 'GET') {
    $result=resolveReferral((string)($_GET['code']??''),max(0,(float)($_GET['subtotal']??0)));
    jsonResponse($result,!empty($result['valid'])?200:404);
}

if ($path === '/api/orders' && $method === 'POST') {
    try { $built=buildOrder(bodyJson()); }
    catch(Throwable $e){ jsonResponse(['message'=>$e->getMessage()],400); }
    $order=$built['order']; recordReferralUsage($order);
    updateJson(ORDERS_FILE,[],function(array $orders)use($order){array_unshift($orders,$order);return['data'=>$orders];});
    jsonResponse(['status'=>'ok','order'=>$order],201);
}

if (preg_match('#^/api/public/orders/([^/]+)$#',$path,$m) && $method==='GET') {
    $id=rawurldecode($m[1]); $phone=digits($_GET['phone']??'');
    foreach(readJson(ORDERS_FILE,[]) as $o) if(($o['id']??'')===$id && $phone!=='' && digits($o['customer']['phone']??'')===$phone) jsonResponse(publicOrder($o));
    jsonResponse(['message'=>'Pesanan tidak ditemukan'],404);
}

if ($path === '/api/midtrans/config' && $method === 'GET') {
    $cfg=config();
    jsonResponse([
        'enabled'=>paymentConfigured(),
        'clientKey'=>(string)($cfg['midtrans_client_key']??''),
        'production'=>!empty($cfg['midtrans_is_production']),
        'snapUrl'=>snapBase($cfg).'/snap/snap.js'
    ]);
}

if ($path === '/api/midtrans/create-transaction' && $method === 'POST') {
    if (!paymentConfigured()) jsonResponse(['message'=>'Midtrans belum dikonfigurasi'],503);
    try {
        $built=buildOrder(bodyJson(),['paymentMethod'=>'Midtrans','paymentStatus'=>'MENUNGGU_PEMBAYARAN','orderStatus'=>'MENUNGGU_PEMBAYARAN']);
        $order=$built['order'];
        if ((int)$order['subtotal'] <= 0) throw new RuntimeException('Total pembayaran harus lebih dari Rp0 untuk Midtrans.');
        $snap=createMidtransTransaction($order);
        $order['midtransSnapToken']=$snap['token'];
        $order['midtransRedirectUrl']=$snap['redirect_url']??'';
        $order['midtransTransactionStatus']='pending';
        updateJson(ORDERS_FILE,[],function(array $orders)use($order){array_unshift($orders,$order);return['data'=>$orders];});
        $cfg=config();
        jsonResponse(['status'=>'ok','token'=>$snap['token'],'redirect_url'=>$snap['redirect_url']??'','clientKey'=>$cfg['midtrans_client_key']??'','snapUrl'=>snapBase($cfg).'/snap/snap.js','order'=>$order],201);
    } catch(Throwable $e) { jsonResponse(['message'=>$e->getMessage()],502); }
}

if ($path === '/api/midtrans/notification' && $method === 'POST') {
    $body=bodyJson();
    if (!validMidtransSignature($body)) jsonResponse(['message'=>'Invalid Midtrans signature'],403);
    $orderId=(string)($body['order_id']??'');
    $transaction=(string)($body['transaction_status']??'');
    $fraud=(string)($body['fraud_status']??'');
    $updated=updateJson(ORDERS_FILE,[],function(array $orders)use($orderId,$transaction,$fraud,$body){
        $found=null;
        foreach($orders as &$order){
            if(($order['id']??'')!==$orderId) continue;
            $order['midtransTransactionStatus']=$transaction;
            $order['midtransStatusCode']=(string)($body['status_code']??'');
            $order['midtransPaymentType']=(string)($body['payment_type']??'');
            $order['updatedAt']=date(DATE_ATOM);
            $success=$transaction==='settlement'||($transaction==='capture'&&($fraud===''||$fraud==='accept'));
            if($success){$order['paymentStatus']='TERVERIFIKASI';if(in_array($order['orderStatus']??'',['MENUNGGU_PEMBAYARAN','MENUNGGU_VERIFIKASI','MENUNGGU_KONFIRMASI'],true))$order['orderStatus']='SEDANG_DISIAPKAN';recordReferralUsage($order);}
            elseif($transaction==='pending'){$order['paymentStatus']='MENUNGGU_PEMBAYARAN';$order['orderStatus']='MENUNGGU_PEMBAYARAN';}
            elseif(in_array($transaction,['deny','cancel','expire','failure'],true)){$order['paymentStatus']='DITOLAK';$order['orderStatus']='DIBATALKAN';}
            $found=$order; break;
        }
        unset($order);
        return ['data'=>$orders,'result'=>$found];
    });
    if(!$updated) jsonResponse(['message'=>'Order tidak ditemukan'],404);
    jsonResponse(['status'=>'ok','order'=>publicOrder($updated)]);
}

if ($path === '/products' && $method === 'GET') {
    requireAdmin(); $products=readJson(PRODUCTS_FILE,seedProducts()); $rows='';
    foreach($products as $p){$rows.='<tr><td>'.(!empty($p['image'])?'<img src="'.esc($p['image']).'" alt="">':'<div style="font-size:32px">'.esc($p['emoji']??'📦').'</div>').'</td><td><b>'.esc($p['name']).'</b><div class="muted">'.esc($p['id']).'</div></td><td>'.esc($p['category']).'</td><td>'.rupiah($p['wholesalePrice']).'</td><td>'.(int)($p['stock']??0).'</td><td><details><summary class="btn process">Edit</summary><form method="post" action="./products/'.rawurlencode((string)$p['id']).'/update" style="margin-top:12px;min-width:760px">'.productFields($p).'<button class="btn save" style="margin-top:12px">Simpan Perubahan</button></form></details></td><td><form method="post" action="./products/'.rawurlencode((string)$p['id']).'/delete" onsubmit="return confirm(\'Hapus produk ini?\')"><button class="btn danger">Hapus</button></form></td></tr>';}
    echo '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kelola Produk - GrosirHub</title><style>'.css().'</style></head><body><div class="wrap"><div class="top"><div><h1>Kelola Produk</h1><p>Tambah, edit, atau hapus produk yang tampil pada website utama.</p></div>'.nav('products').'</div><div class="panel"><h2>Tambah Produk Baru</h2><form method="post" action="./products">'.productFields().'<button class="btn save" style="margin-top:14px">Tambah Produk</button></form></div><div class="sectionTitle"><h2>Daftar Produk</h2><span class="muted">'.count($products).' produk</span></div><div class="tableWrap"><table class="productTable"><thead><tr><th>Gambar</th><th>Produk</th><th>Kategori</th><th>Harga Grosir</th><th>Stok</th><th>Edit</th><th>Hapus</th></tr></thead><tbody>'.$rows.'</tbody></table></div></div></body></html>';exit;
}
if ($path === '/products' && $method === 'POST') { requireAdmin();$p=productFromPost();if($p['name']===''){http_response_code(400);exit('Nama produk wajib diisi');}updateJson(PRODUCTS_FILE,[],function($items)use($p){$x=$p;while(array_filter($items,fn($i)=>($i['id']??'')===$x['id']))$x['id'].='-'.base_convert((string)time(),10,36);array_unshift($items,$x);return['data'=>$items];});redirectTo('./products'); }
if (preg_match('#^/products/([^/]+)/update$#',$path,$m)&&$method==='POST'){requireAdmin();$id=rawurldecode($m[1]);updateJson(PRODUCTS_FILE,[],function($items)use($id){foreach($items as &$p)if(($p['id']??'')===$id){$p=productFromPost($p);break;}unset($p);return['data'=>$items];});redirectTo('../../products');}
if (preg_match('#^/products/([^/]+)/delete$#',$path,$m)&&$method==='POST'){requireAdmin();$id=rawurldecode($m[1]);updateJson(PRODUCTS_FILE,[],fn($items)=>['data'=>array_values(array_filter($items,fn($p)=>($p['id']??'')!==$id))]);redirectTo('../../products');}

if ($path === '/referrals' && $method === 'GET') {
    requireAdmin();$refs=readJson(REFERRALS_FILE,[]);$rows='';foreach($refs as $ref){$rows.='<tr class="'.(!empty($ref['active'])?'':'inactive').'"><td><span class="refCode">'.esc($ref['code']).'</span></td><td>'.(($ref['type']??'percent')==='fixed'?rupiah($ref['value']):((float)$ref['value']).'%').'</td><td>'.(!empty($ref['active'])?'<span class="status statusProcessing">Aktif</span>':'<span class="status">Nonaktif</span>').'</td><td>'.(int)($ref['usageCount']??0).'×</td><td><details><summary class="btn process">Edit</summary><form method="post" action="./referrals/'.rawurlencode((string)$ref['id']).'/update" style="margin-top:12px;min-width:720px">'.referralFields($ref).'<button class="btn save" style="margin-top:12px">Simpan Perubahan</button></form></details></td><td><form method="post" action="./referrals/'.rawurlencode((string)$ref['id']).'/delete" onsubmit="return confirm(\'Hapus kode referensi ini?\')"><button class="btn danger">Hapus</button></form></td></tr>';}
    echo '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kode Referensi - GrosirHub</title><style>'.css().'</style></head><body><div class="wrap"><div class="top"><div><h1>Kode Referensi</h1><p>Buat kode diskon yang dapat dimasukkan customer sebelum melakukan pembayaran.</p></div>'.nav('referrals').'</div><div class="panel"><h2>Tambah Kode Referensi</h2><form method="post" action="./referrals">'.referralFields(['active'=>true]).'<button class="btn save" style="margin-top:14px">Tambah Kode</button></form></div><div class="sectionTitle"><h2>Daftar Kode</h2><span class="muted">'.count($refs).' kode</span></div><div class="tableWrap">'.($refs?'<table><thead><tr><th>Kode</th><th>Diskon</th><th>Status</th><th>Dipakai</th><th>Edit</th><th>Hapus</th></tr></thead><tbody>'.$rows.'</tbody></table>':'<div class="empty">Belum ada kode referensi.</div>').'</div></div></body></html>';exit;
}
if ($path==='/referrals'&&$method==='POST'){requireAdmin();$code=referralCode($_POST['code']??'');if($code===''){http_response_code(400);exit('Kode referensi wajib diisi');}$type=($_POST['type']??'percent')==='fixed'?'fixed':'percent';$value=max(0,(float)($_POST['value']??0));if($type==='percent')$value=min(100,$value);$ref=['id'=>'REF-'.strtoupper(base_convert((string)time(),10,36)).'-'.strtoupper(bin2hex(random_bytes(2))),'code'=>$code,'type'=>$type,'value'=>$value,'active'=>isset($_POST['active']),'usageCount'=>0,'createdAt'=>date(DATE_ATOM)];try{updateJson(REFERRALS_FILE,[],function($refs)use($ref){foreach($refs as $r)if(referralCode($r['code']??'')===$ref['code'])throw new RuntimeException('Kode referensi sudah digunakan');array_unshift($refs,$ref);return['data'=>$refs];});}catch(Throwable $e){http_response_code(400);exit(esc($e->getMessage()));}redirectTo('./referrals');}
if(preg_match('#^/referrals/([^/]+)/update$#',$path,$m)&&$method==='POST'){requireAdmin();$id=rawurldecode($m[1]);$code=referralCode($_POST['code']??'');$type=($_POST['type']??'percent')==='fixed'?'fixed':'percent';$value=max(0,(float)($_POST['value']??0));if($type==='percent')$value=min(100,$value);try{updateJson(REFERRALS_FILE,[],function($refs)use($id,$code,$type,$value){foreach($refs as $r)if(($r['id']??'')!==$id&&referralCode($r['code']??'')===$code)throw new RuntimeException('Kode referensi sudah digunakan');foreach($refs as &$r)if(($r['id']??'')===$id){$r['code']=$code;$r['type']=$type;$r['value']=$value;$r['active']=isset($_POST['active']);$r['updatedAt']=date(DATE_ATOM);break;}unset($r);return['data'=>$refs];});}catch(Throwable $e){http_response_code(400);exit(esc($e->getMessage()));}redirectTo('../../referrals');}
if(preg_match('#^/referrals/([^/]+)/delete$#',$path,$m)&&$method==='POST'){requireAdmin();$id=rawurldecode($m[1]);updateJson(REFERRALS_FILE,[],fn($refs)=>['data'=>array_values(array_filter($refs,fn($r)=>($r['id']??'')!==$id))]);redirectTo('../../referrals');}

if(preg_match('#^/orders/([^/]+)/action$#',$path,$m)&&$method==='POST'){requireAdmin();$id=rawurldecode($m[1]);$action=(string)($_POST['action']??'');updateJson(ORDERS_FILE,[],function($orders)use($id,$action){foreach($orders as &$o)if(($o['id']??'')===$id){if($action==='verify'){$o['paymentStatus']='TERVERIFIKASI';$o['orderStatus']='SEDANG_DISIAPKAN';recordReferralUsage($o);}if($action==='reject'){$o['paymentStatus']='DITOLAK';$o['orderStatus']='DIBATALKAN';}if($action==='prepare')$o['orderStatus']='SEDANG_DISIAPKAN';if($action==='ready')$o['orderStatus']='SIAP_DIKIRIM';if($action==='deliver')$o['orderStatus']='DALAM_PENGANTARAN';if($action==='complete')$o['orderStatus']='SELESAI';$o['updatedAt']=date(DATE_ATOM);break;}unset($o);return['data'=>$orders];});redirectTo('../../');}

if (str_starts_with($path,'/export/')) {
    requireAdmin();$view=normalizeView((string)($_GET['view']??'semua'));$orders=filterOrders(readJson(ORDERS_FILE,[]),$view);
    $rows=[];foreach($orders as $o)$rows[]=['Order ID'=>$o['id']??'','Tanggal'=>$o['createdAt']??'','Nama Pelanggan'=>$o['customer']['name']??'','Telepon'=>$o['customer']['phone']??'','Alamat'=>$o['customer']['address']??'','Item'=>implode(' | ',array_map(fn($i)=>($i['name']??'').' x '.($i['quantity']??1),$o['items']??[])),'Total Item'=>array_sum(array_map(fn($i)=>(int)($i['quantity']??1),$o['items']??[])),'Subtotal Sebelum Diskon'=>(int)($o['originalSubtotal']??$o['subtotal']??0),'Kode Referensi'=>$o['referralCode']??'','Diskon Referensi'=>(int)($o['discountAmount']??0),'Total Pembayaran'=>(int)($o['subtotal']??0),'Metode Pembayaran'=>$o['paymentMethod']??'','Status Pembayaran'=>$o['paymentStatus']??'','Status Pesanan'=>$o['orderStatus']??''];
    if($path==='/export/json'){header('Content-Type: application/json');header('Content-Disposition: attachment; filename="grosirhub-orders-'.$view.'.json"');echo json_encode($orders,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
    $headers=$rows?array_keys($rows[0]):['Order ID','Tanggal','Nama Pelanggan','Telepon','Alamat','Item','Total Item','Subtotal Sebelum Diskon','Kode Referensi','Diskon Referensi','Total Pembayaran','Metode Pembayaran','Status Pembayaran','Status Pesanan'];
    if($path==='/export/csv'){header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="grosirhub-orders-'.$view.'.csv"');$fp=fopen('php://output','wb');fwrite($fp,"\xEF\xBB\xBF");fputcsv($fp,$headers);foreach($rows as $r)fputcsv($fp,array_map(fn($h)=>$r[$h]??'',$headers));fclose($fp);exit;}
    if($path==='/export/excel'){header('Content-Type: application/vnd.ms-excel; charset=utf-8');header('Content-Disposition: attachment; filename="grosirhub-orders-'.$view.'.xls"');echo '<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Pesanan"><Table>';echo '<Row>';foreach($headers as $h)echo '<Cell><Data ss:Type="String">'.htmlspecialchars($h,ENT_XML1,'UTF-8').'</Data></Cell>';echo '</Row>';foreach($rows as $r){echo '<Row>';foreach($headers as $h){$v=$r[$h]??'';$type=is_numeric($v)?'Number':'String';echo '<Cell><Data ss:Type="'.$type.'">'.htmlspecialchars((string)$v,ENT_XML1,'UTF-8').'</Data></Cell>';}echo '</Row>';}echo '</Table></Worksheet></Workbook>';exit;}
}

if ($path === '/' && $method === 'GET') renderDashboard(readJson(ORDERS_FILE,[]),normalizeView((string)($_GET['view']??'semua')));

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['message'=>'Route tidak ditemukan','path'=>$path],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
