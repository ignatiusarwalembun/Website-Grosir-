import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Search, Home, Store, BadgePercent, LayoutGrid, Moon, Sun, ShoppingCart } from 'lucide-react';
import { logoSrc } from '../brandAssets';
import { useCart } from '../context/CartContext';

export function Brand(){ return <Link className="brand jjBrand" to="/"><img className="brandLogo" src={logoSrc} alt="JJ Twins mart"/><span><strong>JJ Twins <em>mart</em></strong><small>Katalog Menu & Harga</small></span></Link>; }
export default function Layout(){
 const [isDark,setIsDark]=useState(()=>document.documentElement.dataset.theme==='dark');
 const {count}=useCart();
 const toggleTheme=()=>{const next=!isDark;setIsDark(next);const theme=next?'dark':'light';document.documentElement.dataset.theme=theme;localStorage.setItem('grosirhub-theme',theme);};
 return <>
  <header className="header"><div className="headerInner"><Brand/><nav className="desktopNav"><NavLink to="/">Beranda</NavLink><NavLink to="/menu">Menu</NavLink><NavLink to="/kategori">Kategori</NavLink><NavLink to="/promo">Promo</NavLink><NavLink to="/pesanan">Status Pesanan</NavLink></nav><div className="headerSearch"><Search size={18}/><input placeholder="Cari menu JJ Twins mart..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value) location.href=`/menu?q=${encodeURIComponent(e.currentTarget.value)}`}}/></div><div className="headerActions"><Link className="cartHeaderBtn" to="/keranjang" aria-label={`Keranjang, ${count} item`}><ShoppingCart size={20}/>{count>0&&<b>{count}</b>}</Link><button className="themeToggle" type="button" aria-label={isDark?'Gunakan mode terang':'Gunakan mode gelap'} title={isDark?'Mode terang':'Mode gelap'} aria-pressed={isDark} onClick={toggleTheme}>{isDark?<Sun size={20}/>:<Moon size={20}/>}</button></div></div><div className="mobileSearch"><Search size={18}/><input placeholder="Cari beras, minyak, minuman..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value) location.href=`/menu?q=${encodeURIComponent(e.currentTarget.value)}`}}/></div></header>
  <main><Outlet/></main>
  <footer><div><Brand/><p>Katalog digital JJ Twins mart untuk melihat produk, harga, kategori dan promo dengan cepat tanpa login.</p></div><div><b>Menu</b><Link to="/menu">Semua Menu</Link><Link to="/kategori">Kategori</Link><Link to="/promo">Promo</Link></div><div><b>Jelajahi</b><Link to="/">Beranda</Link><Link to="/menu">Katalog Produk</Link><Link to="/pesanan">Status Pesanan</Link></div><div><b>Operasional</b><span>Senin–Sabtu</span><span>08.00–20.00 WIB</span></div></footer>
  <nav className="mobileNav"><NavLink to="/"><Home/><span>Beranda</span></NavLink><NavLink to="/menu"><Store/><span>Menu</span></NavLink><NavLink to="/kategori"><LayoutGrid/><span>Kategori</span></NavLink><NavLink to="/promo"><BadgePercent/><span>Promo</span></NavLink><NavLink to="/keranjang" className="mobileCartLink"><span className="mobileCartIcon"><ShoppingCart/>{count>0&&<b>{count}</b>}</span><span>Keranjang</span></NavLink></nav>
 </>;
}
