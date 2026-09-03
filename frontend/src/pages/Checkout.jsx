import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, QrCode, WalletCards } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { rupiah } from '../components/Cards';
import { api } from '../services/api';

const methods = [
  { id:'Transfer Bank', label:'Transfer Bank', desc:'Konfirmasi setelah transfer selesai.', icon:CreditCard },
  { id:'QRIS', label:'QRIS', desc:'Bayar melalui aplikasi yang mendukung QRIS.', icon:QrCode },
  { id:'E-Wallet', label:'E-Wallet', desc:'Gunakan dompet digital pilihan Anda.', icon:WalletCards }
];

export default function Checkout(){
  const { items, subtotal, clear } = useCart();
  const [form,setForm] = useState({name:'',phone:'',address:'',paymentMethod:'Transfer Bank',paymentReference:''});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState(null);
  const change = e => setForm(v=>({...v,[e.target.name]:e.target.value}));

  async function submit(e){
    e.preventDefault();
    if(!items.length) return;
    setLoading(true);setError('');
    try{
      const result = await api.checkout({
        customer:{name:form.name,phone:form.phone,address:form.address},
        items:items.map(i=>({id:i.id,name:i.name,quantity:i.quantity,wholesalePrice:i.wholesalePrice})),
        subtotal,
        paymentMethod:form.paymentMethod,
        paymentReference:form.paymentReference
      });
      setSuccess(result.order);
      clear();
    }catch{
      setError('Konfirmasi pembayaran belum berhasil dikirim. Silakan coba lagi.');
    }finally{setLoading(false)}
  }

  if(success) return <div className="page"><div style={{maxWidth:720,margin:'60px auto',background:'var(--card)',border:'1px solid var(--line)',borderRadius:24,padding:42,textAlign:'center',boxShadow:'var(--shadow)'}}><CheckCircle2 style={{width:58,height:58,color:'var(--teal)',marginBottom:14}}/><h1 style={{color:'var(--navy)',margin:'0 0 10px'}}>Pembayaran dikonfirmasi</h1><p style={{color:'var(--muted)',lineHeight:1.7}}>Pesanan <b>{success.id}</b> sudah masuk ke website operasional dan menunggu verifikasi tim.</p><div style={{margin:'24px 0',padding:18,borderRadius:16,background:'#eef8f6'}}><b>{rupiah(success.subtotal)}</b><div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>{success.paymentMethod} · {success.paymentStatus.replaceAll('_',' ')}</div></div><Link className="primaryBtn" to="/menu">Kembali ke Menu</Link></div></div>;

  if(!items.length) return <div className="page"><div className="emptyCart"><h2>Belum ada item untuk dibayar</h2><p>Tambahkan produk ke keranjang terlebih dahulu.</p><Link className="primaryBtn" to="/menu">Lihat Menu</Link></div></div>;

  return <div className="page"><Link className="backLink" to="/keranjang"><ArrowLeft/> Kembali ke Keranjang</Link><div className="shopHero compact"><span>CHECKOUT</span><h1>Pilih metode pembayaran.</h1><p>Isi data pemesan, pilih pembayaran, lalu kirim konfirmasi setelah pembayaran selesai.</p></div><form onSubmit={submit} style={{display:'grid',gridTemplateColumns:'minmax(0,1.15fr) minmax(320px,.85fr)',gap:26,marginTop:28}}><div style={{display:'grid',gap:18}}><section style={{margin:0,background:'var(--card)',border:'1px solid var(--line)',borderRadius:20,padding:24}}><h2 style={{marginTop:0,color:'var(--navy)',fontSize:20}}>Data Pemesan</h2><div style={{display:'grid',gap:14}}><label style={{fontSize:12,fontWeight:700}}>Nama<input required name="name" value={form.name} onChange={change} placeholder="Nama pemesan" style={inputStyle}/></label><label style={{fontSize:12,fontWeight:700}}>Nomor WhatsApp / Telepon<input required name="phone" value={form.phone} onChange={change} placeholder="08xxxxxxxxxx" style={inputStyle}/></label><label style={{fontSize:12,fontWeight:700}}>Alamat Pengiriman<textarea required name="address" value={form.address} onChange={change} placeholder="Alamat lengkap pengiriman" rows="4" style={{...inputStyle,height:'auto',paddingTop:12,resize:'vertical'}}/></label></div></section><section style={{margin:0,background:'var(--card)',border:'1px solid var(--line)',borderRadius:20,padding:24}}><h2 style={{marginTop:0,color:'var(--navy)',fontSize:20}}>Metode Pembayaran</h2><div style={{display:'grid',gap:10}}>{methods.map(m=>{const Icon=m.icon;const active=form.paymentMethod===m.id;return <button type="button" key={m.id} onClick={()=>setForm(v=>({...v,paymentMethod:m.id}))} style={{display:'flex',alignItems:'center',gap:14,textAlign:'left',padding:16,borderRadius:14,border:active?'2px solid var(--teal)':'1px solid var(--line)',background:active?'#eef8f6':'var(--card)',color:'var(--text)'}}><Icon style={{width:24,height:24,color:'var(--teal)'}}/><span><b style={{display:'block'}}>{m.label}</b><small style={{color:'var(--muted)'}}>{m.desc}</small></span></button>})}</div><label style={{display:'block',fontSize:12,fontWeight:700,marginTop:16}}>Nomor Referensi Pembayaran <span style={{fontWeight:500,color:'var(--muted)'}}>(opsional)</span><input name="paymentReference" value={form.paymentReference} onChange={change} placeholder="Contoh: TRX123456" style={inputStyle}/></label><div style={{marginTop:16,padding:14,borderRadius:12,background:'#fff7e8',fontSize:11,lineHeight:1.6,color:'#8a5a00'}}>Lakukan pembayaran sesuai instruksi pembayaran toko. Tombol di bawah digunakan untuk mengirim konfirmasi pembayaran ke tim operasional.</div></section></div><aside style={{height:'max-content',position:'sticky',top:100,background:'var(--card)',border:'1px solid var(--line)',borderRadius:20,padding:24}}><span style={{fontSize:10,fontWeight:800,color:'var(--teal)',letterSpacing:'.12em'}}>RINGKASAN PESANAN</span><h2 style={{color:'var(--navy)',fontSize:20}}>Pesanan Anda</h2><div style={{display:'grid',gap:10,margin:'18px 0'}}>{items.map(i=><div key={i.id} style={{display:'flex',justifyContent:'space-between',gap:16,fontSize:12}}><span>{i.name} × {i.quantity}</span><b>{rupiah(i.wholesalePrice*i.quantity)}</b></div>)}</div><hr style={{border:0,borderTop:'1px solid var(--line)'}}/><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:16,margin:'18px 0'}}><b>Total</b><b style={{color:'var(--navy)',fontSize:22}}>{rupiah(subtotal)}</b></div>{error&&<div style={{padding:12,borderRadius:10,background:'#fee2e2',color:'#991b1b',fontSize:11,marginBottom:12}}>{error}</div>}<button className="primaryBtn" type="submit" disabled={loading} style={{width:'100%',opacity:loading ? .65 : 1}}>{loading?'Mengirim Konfirmasi...':'Saya Sudah Bayar & Konfirmasi'}</button><small style={{display:'block',marginTop:12,color:'var(--muted)',lineHeight:1.6}}>Setelah dikirim, pesanan masuk ke dashboard operasional untuk diverifikasi.</small></aside></form></div>;
}

const inputStyle={display:'block',width:'100%',height:46,marginTop:7,border:'1px solid var(--line)',borderRadius:12,padding:'0 13px',background:'var(--card)',color:'var(--text)',outline:'none'};
