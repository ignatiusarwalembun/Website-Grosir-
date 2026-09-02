import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle2, Tag, ShoppingCart, Check } from 'lucide-react';
import { productImage } from '../brandAssets';
import { useCart } from '../context/CartContext';
export const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export function Skeleton(){return <div className="productCard skeleton"><div className="skImg"></div><i></i><i></i><i></i></div>}
export function ProductCard({p}){const image=p.image||productImage(p);const {add}=useCart();const [added,setAdded]=useState(false);const addItem=()=>{add(p,1);setAdded(true);setTimeout(()=>setAdded(false),1200)};return <article className="productCard jjProductCard">
 <Link className="productVisual productPhoto" to={`/produk/${p.id}`}><img src={image} alt={p.name} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=productImage(p)}}/>{p.discount>0&&<b>-{p.discount}%</b>}</Link>
 <div className="productMeta"><small>{p.tag}</small><Link className="productName" to={`/produk/${p.id}`}>{p.name}</Link><span className="unit">{p.unit}</span><del>{rupiah(p.price)}</del><strong>{rupiah(p.wholesalePrice)}</strong><p><CheckCircle2 size={14}/> Tersedia · Info harga lengkap</p><div className="tierHint"><Tag size={14}/> Tier harga grosir tersedia</div></div>
 <div className="productActions"><Link className="addBtn detailBtn" to={`/produk/${p.id}`}><Eye size={18}/>Detail</Link><button className={`cartAddBtn ${added?'added':''}`} type="button" onClick={addItem}>{added?<Check size={18}/>:<ShoppingCart size={18}/>}<span>{added?'Ditambahkan':'Tambah'}</span></button></div>
 </article>}
export function PromoCard({promo}){return <div className="promoCard jjPromoCard"><span>{promo.eyebrow}</span><b className="promoBadge">{promo.badge}</b><h3>{promo.title}</h3><p>{promo.description}</p><Link to="/promo">Lihat promo →</Link></div>}
