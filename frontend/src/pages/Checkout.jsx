import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, QrCode, Tag, WalletCards } from 'lucide-react';
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
  const [form,setForm] = useState({name:'',phone:'',address:'',paymentMethod:'Transfer Bank'});
  const [referralInput,setReferralInput] = useState('');
  const [appliedReferral,setAppliedReferral] = useState(null);
  const [referralLoading,setReferralLoading] = useState(false);
  const [referralError,setReferralError] = useState('');
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState(null);
  const change = e => setForm(v=>({...v,[e.target.name]:e.target.value}));

  async function applyReferral(){
    const code = referralInput.trim().toUpperCase();
    if(!code){
      setAppliedReferral(null);
      setReferralError('Masukkan kode referensi terlebih dahulu.');
      return null;
    }
    setReferralLoading(true);
    setReferralError('');
    try{
      const result = await api.validateReferral(code, subtotal);
      setAppliedReferral(result);
      setReferralInput(result.code);
      return result;
    }catch(err){
      setAppliedReferral(null);
      setReferralError(err.message || 'Kode referensi tidak valid.');
      return null;
    }finally{
      setReferralLoading(false);
    }
  }

  function changeReferral(e){
    const value = e.target.value.toUpperCase().replace(/\s+/g,'');
    setReferralInput(value);
    setReferralError('');
    if(appliedReferral && value !== appliedReferral.code) setAppliedReferral(null);
  }

  async function submit(e){
    e.preventDefault();
    if(!items.length) return;
    setLoading(true);
    setError('');
    try{
      let referral = appliedReferral;
      if(referralInput.trim() && (!referral || referral.code !== referralInput.trim().toUpperCase())){
        referral = await api.validateReferral(referralInput.trim().toUpperCase(), subtotal);
        setAppliedReferral(referral);
      }
      const result = await api.checkout({
        customer:{name:form.name,phone:form.phone,address:form.address},
        items:items.map(i=>({id:i.id,name:i.name,quantity:i.quantity,wholesalePrice:i.wholesalePrice})),
        subtotal,
        referralCode:referral?.code || '',
        paymentMethod:form.paymentMethod
      });
      localStorage.setItem('grosirhub-latest-order', JSON.stringify({id:result.order.id,phone:form.phone}));
      setSuccess(result.order);
      clear();
    }catch(err){
      setError(err.message || 'Konfirmasi pembayaran belum berhasil dikirim. Silakan coba lagi.');
    }finally{
      setLoading(false);
    }
  }

  const discountAmount = Number(appliedReferral?.discountAmount) || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  if(success) return <div className="page"><div style={{maxWidth:760,margin:'60px auto',background:'var(--card)',border:'1px solid var(--line)',borderRadius:24,padding:42,textAlign:'center',boxShadow:'var(--shadow)'}}><CheckCircle2 style={{width:58,height:58,color:'var(--teal)',marginBottom:14}}/><h1 style={{color:'var(--navy)',margin:'0 0 10px'}}>Konfirmasi pembayaran diterima</h1><p style={{color:'var(--muted)',lineHeight:1.7}}>Pesanan <b>{success.id}</b> sudah masuk ke tim operasional. Anda sekarang bisa memantau proses persiapan hingga pengantaran langsung dari website ini.</p><div style={{margin:'24px 0',padding:18,borderRadius:16,background:'#eef8f6'}}>{success.referralCode&&<div style={{fontSize:12,color:'var(--teal)',fontWeight:800,marginBottom:7}}>Kode referensi {success.referralCode} · Hemat {rupiah(success.discountAmount)}</div>}<b>{rupiah(success.subtotal)}</b><div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>Status awal · Menunggu verifikasi pembayaran</div></div><div style={{display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap'}}><Link className="primaryBtn" to="/pesanan">Pantau Status Pesanan</Link><Link className="secondaryBtn" style={{color:'var(--navy)',border:'1px solid var(--line)',background:'var(--card)'}} to="/menu">Kembali ke Menu</Link></div></div></div>;

  if(!items.length) return <div className="page"><div className="emptyCart"><h2>Belum ada item untuk dibayar</h2><p>Tambahkan produk ke keranjang terlebih dahulu.</p><Link className="primaryBtn" to="/menu">Lihat Menu</Link></div></div>;

  return <div className="page">
    <Link className="backLink" to="/keranjang"><ArrowLeft/> Kembali ke Keranjang</Link>
    <div className="shopHero compact"><span>CHECKOUT</span><h1>Selesaikan pesanan Anda.</h1><p>Isi data pemesan, gunakan kode referensi jika ada, lalu pilih metode pembayaran.</p></div>
    <form onSubmit={submit} style={{display:'grid',gridTemplateColumns:'minmax(0,1.15fr) minmax(320px,.85fr)',gap:26,marginTop:28}}>
      <div style={{display:'grid',gap:18}}>
        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Data Pemesan</h2>
          <div style={{display:'grid',gap:14}}>
            <label style={labelStyle}>Nama<input required name="name" value={form.name} onChange={change} placeholder="Nama pemesan" style={inputStyle}/></label>
            <label style={labelStyle}>Nomor WhatsApp / Telepon<input required name="phone" value={form.phone} onChange={change} placeholder="08xxxxxxxxxx" style={inputStyle}/></label>
            <label style={labelStyle}>Alamat Pengiriman<textarea required name="address" value={form.address} onChange={change} placeholder="Alamat lengkap pengiriman" rows="4" style={{...inputStyle,height:'auto',paddingTop:12,resize:'vertical'}}/></label>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}><Tag size={20} style={{color:'var(--teal)'}}/><h2 style={{...sectionTitle,margin:0}}>Kode Referensi</h2></div>
          <p style={{fontSize:12,color:'var(--muted)',lineHeight:1.6,margin:'8px 0 14px'}}>Punya kode dari toko atau pemberi referensi? Masukkan di sini untuk mendapatkan diskon sebelum pembayaran.</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10}}>
            <input value={referralInput} onChange={changeReferral} placeholder="Contoh: ARWA10" style={{...inputStyle,marginTop:0,textTransform:'uppercase',fontWeight:800,letterSpacing:'.06em'}}/>
            <button type="button" className="secondaryBtn" onClick={applyReferral} disabled={referralLoading} style={{height:46,padding:'0 18px',border:'1px solid var(--line)',background:'var(--card)',color:'var(--navy)',borderRadius:12,fontWeight:800}}>{referralLoading?'Mengecek...':'Terapkan'}</button>
          </div>
          {referralError&&<div style={{marginTop:10,padding:11,borderRadius:10,background:'#fee2e2',color:'#991b1b',fontSize:11}}>{referralError}</div>}
          {appliedReferral&&<div style={{marginTop:10,padding:12,borderRadius:10,background:'#ecfdf5',color:'#047857',fontSize:12,fontWeight:700}}>✓ Kode <b>{appliedReferral.code}</b> aktif — diskon {appliedReferral.type==='percent'?`${appliedReferral.value}%`:rupiah(appliedReferral.value)} berhasil diterapkan.</div>}
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Metode Pembayaran</h2>
          <div style={{display:'grid',gap:10}}>{methods.map(m=>{const Icon=m.icon;const active=form.paymentMethod===m.id;return <button type="button" key={m.id} onClick={()=>setForm(v=>({...v,paymentMethod:m.id}))} style={{display:'flex',alignItems:'center',gap:14,textAlign:'left',padding:16,borderRadius:14,border:active?'2px solid var(--teal)':'1px solid var(--line)',background:active?'#eef8f6':'var(--card)',color:'var(--text)'}}><Icon style={{width:24,height:24,color:'var(--teal)'}}/><span><b style={{display:'block'}}>{m.label}</b><small style={{color:'var(--muted)'}}>{m.desc}</small></span></button>})}</div>
          <div style={{marginTop:16,padding:14,borderRadius:12,background:'#fff7e8',fontSize:11,lineHeight:1.6,color:'#8a5a00'}}>Lakukan pembayaran sesuai total akhir setelah diskon. Tombol di bawah digunakan untuk mengirim konfirmasi pembayaran ke tim operasional.</div>
        </section>
      </div>

      <aside style={{height:'max-content',position:'sticky',top:100,background:'var(--card)',border:'1px solid var(--line)',borderRadius:20,padding:24}}>
        <span style={{fontSize:10,fontWeight:800,color:'var(--teal)',letterSpacing:'.12em'}}>RINGKASAN PESANAN</span>
        <h2 style={{color:'var(--navy)',fontSize:20}}>Pesanan Anda</h2>
        <div style={{display:'grid',gap:10,margin:'18px 0'}}>{items.map(i=><div key={i.id} style={{display:'flex',justifyContent:'space-between',gap:16,fontSize:12}}><span>{i.name} × {i.quantity}</span><b>{rupiah(i.wholesalePrice*i.quantity)}</b></div>)}</div>
        <hr style={{border:0,borderTop:'1px solid var(--line)'}}/>
        <div style={{display:'grid',gap:9,marginTop:16,fontSize:12}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Subtotal</span><b>{rupiah(subtotal)}</b></div>
          {appliedReferral&&<div style={{display:'flex',justifyContent:'space-between',color:'#047857'}}><span>Diskon · {appliedReferral.code}</span><b>-{rupiah(discountAmount)}</b></div>}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:16,margin:'18px 0',paddingTop:15,borderTop:'1px solid var(--line)'}}><b>Total Bayar</b><b style={{color:'var(--navy)',fontSize:22}}>{rupiah(finalTotal)}</b></div>
        {error&&<div style={{padding:12,borderRadius:10,background:'#fee2e2',color:'#991b1b',fontSize:11,marginBottom:12}}>{error}</div>}
        <button className="primaryBtn" type="submit" disabled={loading} style={{width:'100%',opacity:loading ? .65 : 1}}>{loading?'Mengirim Konfirmasi...':'Saya Sudah Bayar & Konfirmasi'}</button>
        <small style={{display:'block',marginTop:12,color:'var(--muted)',lineHeight:1.6}}>Total pembayaran yang masuk ke dashboard operational sudah memperhitungkan diskon kode referensi yang valid.</small>
      </aside>
    </form>
  </div>;
}

const sectionStyle={margin:0,background:'var(--card)',border:'1px solid var(--line)',borderRadius:20,padding:24};
const sectionTitle={marginTop:0,color:'var(--navy)',fontSize:20};
const labelStyle={fontSize:12,fontWeight:700};
const inputStyle={display:'block',width:'100%',height:46,marginTop:7,border:'1px solid var(--line)',borderRadius:12,padding:'0 13px',background:'var(--card)',color:'var(--text)',outline:'none'};
