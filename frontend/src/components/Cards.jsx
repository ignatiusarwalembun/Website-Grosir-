import { Link } from 'react-router-dom';
import { Eye, CheckCircle2, Tag } from 'lucide-react';
export const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export function Skeleton(){return <div className="productCard skeleton"><div className="skImg"></div><i></i><i></i><i></i></div>}
export function ProductCard({p}){return <article className="productCard">
 <Link className="productVisual" to={`/produk/${p.id}`}><span>{p.emoji}</span>{p.discount>0&&<b>-{p.discount}%</b>}</Link>
 <div className="productMeta"><small>{p.tag}</small><Link className="productName" to={`/produk/${p.id}`}>{p.name}</Link><span className="unit">{p.unit}</span><del>{rupiah(p.price)}</del><strong>{rupiah(p.wholesalePrice)}</strong><p><CheckCircle2 size={14}/> Tersedia · Info harga lengkap</p><div className="tierHint"><Tag size={14}/> Tier harga grosir tersedia</div></div>
 <Link className="addBtn" to={`/produk/${p.id}`}><Eye size={18}/>Lihat Detail</Link>
 </article>}
export function PromoCard({promo}){return <div className="promoCard"><span>{promo.eyebrow}</span><b className="promoBadge">{promo.badge}</b><h3>{promo.title}</h3><p>{promo.description}</p><Link to="/promo">Lihat promo →</Link></div>}
