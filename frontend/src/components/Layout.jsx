import { Link, NavLink, Outlet } from 'react-router-dom';
import { Bell, Search, ShoppingCart, UserRound, Home, Store, BadgePercent, ClipboardList } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function Brand(){ return <Link className="brand" to="/"><span className="brandMark"><i></i><b></b></span><span><strong>GrosirHub</strong><small>Belanja Grosir Lebih Mudah</small></span></Link>; }
export default function Layout(){
 const {count}=useCart();
 return <>
  <header className="header"><div className="headerInner"><Brand/><nav className="desktopNav"><NavLink to="/">Beranda</NavLink><NavLink to="/belanja">Belanja</NavLink><NavLink to="/kategori">Kategori</NavLink><NavLink to="/promo">Promo</NavLink></nav><div className="headerSearch"><Search size={18}/><input placeholder="Cari produk grosir..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value) location.href=`/belanja?q=${encodeURIComponent(e.currentTarget.value)}`}}/></div><div className="headerActions"><button aria-label="Notifikasi"><Bell size={20}/></button><Link className="iconBtn" to="/keranjang"><ShoppingCart size={20}/>{count>0&&<em>{count}</em>}</Link><Link className="desktopOnly iconBtn" to="/akun"><UserRound size={20}/></Link></div></div><div className="mobileSearch"><Search size={18}/><input placeholder="Cari beras, minyak, minuman..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value) location.href=`/belanja?q=${encodeURIComponent(e.currentTarget.value)}`}}/></div></header>
  <main><Outlet/></main>
  <footer><div><Brand/><p>Platform katalog grosir modern untuk warung, UMKM, cafe, restoran dan reseller.</p></div><div><b>Belanja</b><Link to="/belanja">Semua Produk</Link><Link to="/kategori">Kategori</Link><Link to="/promo">Promo</Link></div><div><b>Akun</b><Link to="/pesanan">Pesanan</Link><Link to="/akun">Bantuan</Link></div><div><b>Operasional</b><span>Senin–Sabtu</span><span>08.00–20.00 WIB</span></div></footer>
  <nav className="mobileNav"><NavLink to="/"><Home/><span>Beranda</span></NavLink><NavLink to="/belanja"><Store/><span>Belanja</span></NavLink><NavLink to="/promo"><BadgePercent/><span>Promo</span></NavLink><NavLink to="/pesanan"><ClipboardList/><span>Pesanan</span></NavLink><NavLink to="/akun"><UserRound/><span>Akun</span></NavLink></nav>
 </>;
}
