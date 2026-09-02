const categoryPhotos = {
  sembako: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=82',
  minuman: 'https://images.unsplash.com/photo-1630459065556-cd24ea585ba3?auto=format&fit=crop&w=1200&q=82',
  snack: 'https://images.unsplash.com/photo-1529259266118-cf22737f713f?auto=format&fit=crop&w=1200&q=82',
  instan: 'https://images.unsplash.com/photo-1496114212242-bac8bd9de53d?auto=format&fit=crop&w=1200&q=82',
  dapur: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=82',
  kebersihan: 'https://images.unsplash.com/photo-1656214286228-08fdbf520d1e?auto=format&fit=crop&w=1200&q=82',
  personal: 'https://images.unsplash.com/photo-1562731789-8324cbe28333?auto=format&fit=crop&w=1200&q=82',
  frozen: 'https://images.unsplash.com/photo-1529259266118-cf22737f713f?auto=format&fit=crop&w=1200&q=82',
  usaha: 'https://images.unsplash.com/photo-1574422731048-f09094773986?auto=format&fit=crop&w=1200&q=82'
};

export const categories = [
  { id: 'sembako', name: 'Sembako', icon: 'PackageOpen', description: 'Beras, gula, tepung dan kebutuhan pokok', image: categoryPhotos.sembako },
  { id: 'minuman', name: 'Minuman', icon: 'CupSoda', description: 'Air mineral, susu dan minuman siap jual', image: categoryPhotos.minuman },
  { id: 'snack', name: 'Snack', icon: 'Cookie', description: 'Camilan untuk rak toko dan reseller', image: categoryPhotos.snack },
  { id: 'instan', name: 'Makanan Instan', icon: 'Soup', description: 'Mie dan makanan praktis', image: categoryPhotos.instan },
  { id: 'dapur', name: 'Kebutuhan Dapur', icon: 'CookingPot', description: 'Bumbu, kecap, saus dan kebutuhan masak', image: categoryPhotos.dapur },
  { id: 'kebersihan', name: 'Kebersihan', icon: 'Sparkles', description: 'Detergen, sabun dan tissue', image: categoryPhotos.kebersihan },
  { id: 'personal', name: 'Personal Care', icon: 'Heart', description: 'Kebutuhan perawatan harian', image: categoryPhotos.personal },
  { id: 'frozen', name: 'Frozen Food', icon: 'Snowflake', description: 'Stok makanan beku usaha', image: categoryPhotos.frozen },
  { id: 'usaha', name: 'Perlengkapan Usaha', icon: 'Store', description: 'Kebutuhan operasional bisnis', image: categoryPhotos.usaha }
];

const products = [
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
  ['cup-plastik-50pcs','Cup Plastik 50pcs','usaha','50 pcs / pack',28500,26200,8,2,'Perlengkapan','🥤']
];

export const productData = products.map((p, idx) => ({
  id: p[0], name: p[1], category: p[2], unit: p[3], price: p[4], wholesalePrice: p[5], discount: p[6], minOrder: p[7], tag: p[8], emoji: p[9], image: categoryPhotos[p[2]],
  stock: idx % 6 === 0 ? 18 : 40 + idx * 5,
  featured: idx < 8,
  createdAt: `2026-08-${String(10 + idx).padStart(2,'0')}`,
  description: `${p[1]} untuk kebutuhan usaha, warung, restoran, cafe, dan reseller. Dikemas praktis dan cocok untuk pembelian berulang dalam jumlah besar.`,
  packaging: p[3],
  tiers: [
    { min: p[7], max: 4, price: p[4] },
    { min: 5, max: 9, price: Math.round(p[4] * 0.96 / 100) * 100 },
    { min: 10, max: null, price: p[5] }
  ]
}));

export const promos = [
  { id:'karton', eyebrow:'BELANJA KARTON', title:'Diskon hingga 15%', description:'Harga makin ringan untuk belanja kartonan produk pilihan.', type:'Grosir', badge:'15%' },
  { id:'warung', eyebrow:'STOK WARUNG', title:'Cashback hingga Rp50.000', description:'Isi ulang stok warung dan dapatkan bonus belanja mingguan.', type:'Cashback', badge:'50K' },
  { id:'restoran', eyebrow:'PAKET RESTORAN', title:'Bundle operasional hemat', description:'Paket kebutuhan dapur dan kebersihan untuk operasional harian.', type:'Bundle', badge:'HEMAT' },
  { id:'quantity', eyebrow:'DISKON QUANTITY', title:'Beli banyak, harga turun', description:'Nikmati harga bertingkat otomatis mulai dari pembelian 5 pcs.', type:'Quantity', badge:'TIER' }
];

export const orders = [
  { id:'GH-260831-0182', date:'31 Agu 2026', status:'Diproses', total:412500, items:5 },
  { id:'GH-260827-0156', date:'27 Agu 2026', status:'Dikirim', total:735000, items:8 },
  { id:'GH-260821-0118', date:'21 Agu 2026', status:'Selesai', total:289000, items:4 },
  { id:'GH-260815-0094', date:'15 Agu 2026', status:'Selesai', total:1180000, items:11 }
];