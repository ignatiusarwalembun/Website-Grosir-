import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, PackageCheck, PackageOpen, Search, Truck } from 'lucide-react';
import { api } from '../services/api';
import { rupiah } from '../components/Cards';

const steps = [
  { key:'MENUNGGU_VERIFIKASI', title:'Konfirmasi Pembayaran Diterima', desc:'Konfirmasi pembayaran Anda sudah kami terima dan sedang diperiksa oleh tim.', icon:Clock3 },
  { key:'SEDANG_DISIAPKAN', title:'Pesanan Sedang Disiapkan', desc:'Pesanan sedang disiapkan dan dikemas dengan teliti sebelum dikirim.', icon:PackageOpen },
  { key:'SIAP_DIKIRIM', title:'Pesanan Siap Dikirim', desc:'Pesanan sudah selesai dikemas dan menunggu proses pengantaran.', icon:PackageCheck },
  { key:'DALAM_PENGANTARAN', title:'Pesanan Dalam Pengantaran', desc:'Pesanan sedang dalam perjalanan menuju alamat tujuan.', icon:Truck },
  { key:'SELESAI', title:'Pesanan Telah Selesai', desc:'Pesanan telah selesai diterima. Terima kasih sudah berbelanja bersama kami.', icon:CheckCircle2 }
];

const normalize = status => {
  if (status === 'MENUNGGU_KONFIRMASI') return 'MENUNGGU_VERIFIKASI';
  if (status === 'DIPROSES') return 'SEDANG_DISIAPKAN';
  return status || 'MENUNGGU_VERIFIKASI';
};
const readSaved = () => {
  try { return JSON.parse(localStorage.getItem('grosirhub-latest-order')) || {}; }
  catch { return {}; }
};

export default function OrderStatus(){
  const saved = useMemo(readSaved, []);
  const [orderId,setOrderId] = useState(saved.id || '');
  const [phone,setPhone] = useState(saved.phone || '');
  const [order,setOrder] = useState(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  async function checkStatus(id=orderId, number=phone, quiet=false){
    if(!id || !number) return;
    if(!quiet) setLoading(true);
    if(!quiet) setError('');
    try{
      const result = await api.orderStatus(id.trim(), number.trim());
      setOrder(result);
      localStorage.setItem('grosirhub-latest-order', JSON.stringify({id:result.id,phone:number.trim()}));
    }catch(err){
      if(!quiet){ setOrder(null); setError(err.status===404?'Pesanan tidak ditemukan. Pastikan ID pesanan dan nomor telepon sesuai saat checkout.':'Status pesanan belum dapat dimuat. Silakan coba lagi.'); }
    }finally{ if(!quiet) setLoading(false); }
  }

  useEffect(()=>{ if(saved.id && saved.phone) checkStatus(saved.id, saved.phone); },[]);
  useEffect(()=>{
    if(!order?.id || !phone || normalize(order.orderStatus)==='SELESAI') return;
    const timer = setInterval(()=>checkStatus(order.id, phone, true), 10000);
    return ()=>clearInterval(timer);
  },[order?.id,order?.orderStatus,phone]);

  const currentStatus = normalize(order?.orderStatus);
  const currentIndex = Math.max(0, steps.findIndex(s=>s.key===currentStatus));

  return <div className="page">
    <div className="shopHero compact">
      <span>STATUS PESANAN</span>
      <h1>Pantau perjalanan pesanan Anda.</h1>
      <p>Masukkan ID pesanan dan nomor telepon yang digunakan saat checkout. Status akan diperbarui otomatis mengikuti proses dari tim operasional.</p>
    </div>

    <div style={styles.lookup}>
      <label style={styles.label}>ID Pesanan<input value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder="Contoh: ORD-ABC123" style={styles.input}/></label>
      <label style={styles.label}>Nomor Telepon<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xxxxxxxxxx" style={styles.input}/></label>
      <button className="primaryBtn" type="button" onClick={()=>checkStatus()} disabled={loading} style={{alignSelf:'end',height:46,opacity:loading?.7:1}}><Search size={17}/>{loading?'Mengecek...':'Cek Status'}</button>
    </div>

    {error && <div style={styles.error}>{error}</div>}

    {order && <div style={styles.card}>
      <div style={styles.orderHead}>
        <div><span style={styles.eyebrow}>PESANAN</span><h2 style={styles.orderTitle}>{order.id}</h2><p style={styles.muted}>{order.customer?.name} · {new Date(order.createdAt).toLocaleString('id-ID')}</p></div>
        <div style={styles.total}><span>Total</span><b>{rupiah(order.subtotal)}</b></div>
      </div>

      {order.orderStatus==='DIBATALKAN' ? <div style={styles.cancelled}><b>Pesanan Dibatalkan</b><span>Pembayaran tidak dapat diverifikasi atau pesanan dibatalkan oleh tim operasional.</span></div> : <>
        <div style={styles.progressLine}><div style={{...styles.progressFill,width:`${(currentIndex/(steps.length-1))*100}%`}}/></div>
        <div style={styles.steps}>{steps.map((step,index)=>{const Icon=step.icon;const active=index<=currentIndex;const current=index===currentIndex;return <div key={step.key} style={styles.step}>
          <div style={{...styles.iconCircle,background:active?'var(--teal)':'#eef2f4',color:active?'#fff':'#94a3b8',boxShadow:current?'0 0 0 5px rgba(20,184,166,.12)':'none'}}><Icon size={20}/></div>
          <div><b style={{...styles.stepTitle,color:active?'var(--navy)':'#94a3b8'}}>{step.title}</b><p style={styles.stepDesc}>{step.desc}</p></div>
        </div>})}</div>
      </>}

      <div style={styles.infoGrid}>
        <div><span style={styles.infoLabel}>Pembayaran</span><b>{String(order.paymentStatus||'').replaceAll('_',' ')}</b></div>
        <div><span style={styles.infoLabel}>Metode</span><b>{order.paymentMethod}</b></div>
        <div><span style={styles.infoLabel}>Alamat Pengiriman</span><b>{order.customer?.address}</b></div>
      </div>
    </div>}
  </div>;
}

const styles={
  lookup:{marginTop:24,display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:14,background:'var(--card)',border:'1px solid var(--line)',borderRadius:20,padding:20},
  label:{fontSize:11,fontWeight:800,color:'var(--text)'},input:{display:'block',width:'100%',height:46,marginTop:7,border:'1px solid var(--line)',borderRadius:12,padding:'0 13px',background:'var(--card)',color:'var(--text)',outline:'none'},
  error:{marginTop:16,padding:15,borderRadius:12,background:'#fee2e2',color:'#991b1b',fontSize:12},card:{marginTop:24,background:'var(--card)',border:'1px solid var(--line)',borderRadius:24,padding:28,boxShadow:'var(--shadow)'},
  orderHead:{display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-start',paddingBottom:22,borderBottom:'1px solid var(--line)'},eyebrow:{fontSize:10,fontWeight:800,color:'var(--teal)',letterSpacing:'.12em'},orderTitle:{margin:'5px 0 4px',color:'var(--navy)',fontSize:24},muted:{margin:0,color:'var(--muted)',fontSize:12},total:{textAlign:'right'},infoLabel:{display:'block',fontSize:10,fontWeight:800,color:'var(--muted)',marginBottom:5,textTransform:'uppercase'},
  progressLine:{height:4,background:'#e8edf1',borderRadius:999,margin:'38px 7% 0',position:'relative'},progressFill:{height:'100%',background:'var(--teal)',borderRadius:999,transition:'width .4s ease'},steps:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:18,marginTop:-14},step:{textAlign:'center',display:'flex',alignItems:'center',flexDirection:'column',gap:12},iconCircle:{width:44,height:44,borderRadius:999,display:'grid',placeItems:'center',border:'4px solid var(--card)'},stepTitle:{display:'block',fontSize:12,lineHeight:1.4},stepDesc:{fontSize:10,lineHeight:1.6,color:'var(--muted)',margin:'5px 0 0'},
  infoGrid:{display:'grid',gridTemplateColumns:'1fr 1fr 2fr',gap:18,marginTop:30,padding:18,borderRadius:16,background:'rgba(15,159,143,.06)'},cancelled:{marginTop:24,padding:20,borderRadius:16,background:'#fef2f2',color:'#991b1b',display:'grid',gap:5}
};
