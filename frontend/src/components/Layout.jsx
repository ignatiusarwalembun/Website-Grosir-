import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Search, Home, Store, BadgePercent, LayoutGrid, Moon, Sun } from 'lucide-react';

export function Brand(){ return <Link className="brand" to="/"><span className="brandMark"><i></i><b></b></span><span><strong>GrosirHub</strong><small>Lihat Menu Grosir Lebih Mudah</small></span></Link>; }
export default function Layout(){
 const [isDark,setIsDark]=useState(()=>document.documentElement.dataset.theme==='dark');
 const toggleTheme=()=>{const next=!isDark;setIsDark(next);const theme=next?'dark':'light';document.documentElement.dataset.theme=theme;localStorage.setItem('grosirhub-theme',theme);};
 return <>
  <header className="header"><div className="headerInner"><Brand/><nav className="desktopNav"><NavLink to="/">Beranda</NavLink><NavLink to="/menu">Menu</NavLink><NavLink to="/kategori">Kategori</NavLink><NavLink to="/promo">Promo</NavLink></nav><div className="headerSearch"><Search size={18}/><input placeholder="Cari menu atau produk..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value) location.href=`/menu?q=${encodeURIComponent(e.currentTarget.value)}`}}/></div><div className="headerActions"><button className="themeToggle" type="button" aria-label={isDark?'Gunakan mode terang':'Gunakan mode gelap'} title={isDark?'Mode terang':'Mode gelap'} aria-pressed={isDark} onClick={toggleTheme}>{isDark?<Sun size={20}/>:<Moon size={20}/>}</button></div></div><div className="mobileSearch"><Search size={18}/><input placeholder="Cari beras, minyak, minuman..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value) location.href=`/menu?q=${encodeURIComponent(e.currentTarget.value)}`}}/></div></header>
  <main><Outlet/></main>
  <footer><div><Brand/><p>Katalog grosir digital untuk melihat produk, harga, kategori dan promo dengan cepat tanpa login.</p></div><div><b>Menu</b><Link to="/menu">Semua Menu</Link><Link to="/kategori">Kategori</Link><Link to="/promo">Promo</Link></div><div><b>Jelajahi</b><Link to="/">Beranda</Link><Link to="/menu">Katalog Produk</Link><Link to="/promo">Promo Aktif</Link></div><div><b>Operasional</b><span>Senin–Sabtu</span><span>08.00–20.00 WIB</span></div></footer>
  <nav className="mobileNav"><NavLink to="/"><Home/><span>Beranda</span></NavLink><NavLink to="/menu"><Store/><span>Menu</span></NavLink><NavLink to="/kategori"><LayoutGrid/><span>Kategori</span></NavLink><NavLink to="/promo"><BadgePercent/><span>Promo</span></NavLink></nav>
 </>;
}
