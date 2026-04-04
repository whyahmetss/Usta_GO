import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle, CreditCard, Lock, Building2, Copy, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { API_ENDPOINTS } from '../config';
import { useAuth } from '../context/AuthContext';

const PRESET_AMOUNTS = [100, 200, 500, 1000];

/* ── Chip SVG ── */
function ChipSVG() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
      <rect width="40" height="30" rx="5" fill="#D4AF37" />
      <rect x="13" y="0" width="14" height="30" fill="#C9A227" />
      <rect x="0" y="10" width="40" height="10" fill="#C9A227" />
      <rect x="13" y="10" width="14" height="10" fill="#B8921A" />
      <rect x="15" y="12" width="10" height="6" rx="1" fill="#D4AF37" />
    </svg>
  );
}

/* ── Contactless SVG ── */
function ContactlessSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12.5a8.5 8.5 0 0 1 14 0" opacity="0.4" />
      <path d="M7.5 15a5.5 5.5 0 0 1 9 0" opacity="0.65" />
      <path d="M10 17.5a2.5 2.5 0 0 1 4 0" />
    </svg>
  );
}

/* ── MastercardLogo ── */
function MastercardLogo() {
  return (
    <div className="flex">
      <div className="w-8 h-8 rounded-full bg-red-500 opacity-90" />
      <div className="w-8 h-8 rounded-full bg-amber-400 opacity-90 -ml-3" />
    </div>
  );
}

/* ── Animated Virtual Card with Flip ── */
function VirtualCard({ amount, holderName, cardNumber, expiry, cvc, flipped }) {
  const formatDisplay = (num) => {
    const clean = num.replace(/\D/g, '');
    const padded = clean.padEnd(16, '•');
    return `${padded.slice(0,4)} ${padded.slice(4,8)} ${padded.slice(8,12)} ${padded.slice(12,16)}`;
  };

  const displayNum = formatDisplay(cardNumber);
  const displayAmount = amount > 0 ? `${amount.toLocaleString('tr-TR')} TL` : '— TL';
  const displayExpiry = expiry || '••/••';
  const displayCvc = (cvc || '').padEnd(3, '•');

  const cardBg = 'linear-gradient(135deg, #1a1040 0%, #2d1b6e 40%, #0f3460 80%, #16213e 100%)';

  return (
    <div className="relative w-full max-w-sm mx-auto select-none" style={{ perspective: '1200px' }}>
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/40 to-blue-500/40 blur-2xl scale-105" />
      <div
        className="relative"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '210px',
        }}
      >
        {/* ── FRONT ── */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: cardBg, backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />

          <div className="relative flex items-start justify-between px-6 pt-5">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Usta Go</p>
              <p className="text-white font-black text-lg tracking-tight">Hizmet Hesabım</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ContactlessSVG />
            </div>
          </div>

          <div className="relative flex items-center justify-between px-6 mt-3">
            <ChipSVG />
            <div className="text-right">
              <p className="text-white/40 text-[9px] uppercase tracking-widest">Yüklenecek</p>
              <p className="text-white font-black text-xl tabular-nums transition-all duration-300">{displayAmount}</p>
            </div>
          </div>

          <div className="relative px-6 mt-4">
            <p className="text-white/70 text-base tracking-[0.2em] font-mono transition-all duration-150">{displayNum}</p>
          </div>

          <div className="relative flex items-end justify-between px-6 pt-2 pb-5">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Kart Sahibi</p>
              <p className="text-white font-semibold text-sm tracking-wide uppercase truncate">
                {holderName || 'AD SOYAD'}
              </p>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex flex-col items-end">
                <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Son Kullanma</p>
                <p className="text-white font-semibold text-sm font-mono">{displayExpiry}</p>
              </div>
              <MastercardLogo />
            </div>
          </div>

          <div className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full bg-purple-500/10" />
          <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-blue-500/10" />
        </div>

        {/* ── BACK ── */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: cardBg, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />

          {/* Magnetic strip */}
          <div className="mt-8 w-full h-12 bg-black/60" />

          {/* CVV strip */}
          <div className="flex items-center px-6 mt-6 gap-3">
            <div className="flex-1 h-10 rounded-lg bg-white/10 flex items-center justify-end pr-4">
              <p className="text-white font-mono text-lg tracking-[0.3em]">{displayCvc}</p>
            </div>
            <p className="text-white/40 text-xs font-semibold">CVV</p>
          </div>

          <div className="px-6 mt-6">
            <p className="text-white/30 text-[10px] leading-relaxed">
              Bu kart Usta Go hizmet kredisi yükleme işlemi için kullanılmaktadır. 
              İşlem iyzico 3D Secure altyapısı ile güvence altındadır.
            </p>
          </div>

          <div className="absolute bottom-5 right-6">
            <MastercardLogo />
          </div>
          <div className="absolute bottom-5 left-6">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Usta Go</p>
          </div>

          <div className="absolute top-[-40px] left-[-40px] w-40 h-40 rounded-full bg-blue-500/10" />
        </div>
      </div>
    </div>
  );
}



/* ── Havale Talimatları Ekranı ── */
function HavaleTalimat({ tutar, ibanBilgi, onClose, navigate }) {
  const [aşama, setAşama] = useState('yukleniyor'); // 'yukleniyor' → 'bilgi' → 'gonderiyor' → 'bekleniyor'
  const [copied, setCopied] = useState('');
  const [talep, setTalep] = useState(null);
  const [hata, setHata] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  // Sayfa açıldığında hemen referans kodu üret
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAPI(API_ENDPOINTS.WALLET.HAVALE_TALEP, { method: 'POST', body: { tutar } });
        if (cancelled) return;
        if (res?.success) {
          setTalep(res.data);
          setAşama('bilgi');
        } else {
          setHata(res?.error || 'Talep oluşturulamadı');
          setAşama('bilgi');
        }
      } catch (e) {
        if (!cancelled) { setHata(e.message); setAşama('bilgi'); }
      }
    })();
    return () => { cancelled = true; };
  }, [tutar]);

  const handleGonderdim = async () => {
    setAşama('bekleniyor');
  };

  // ── Yükleniyor ──
  if (aşama === 'yukleniyor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a103d] to-[#0f2444] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Havale bilgileri hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  // ── Onay Bekleniyor ekranı ──
  if (aşama === 'bekleniyor' && talep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a103d] to-[#0f2444] flex items-center justify-center p-6">
        <div className="text-center w-full max-w-sm">
          <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400/40 flex items-center justify-center mx-auto mb-5">
            <Clock size={36} className="text-amber-400" />
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Onay Bekleniyor</h2>
          <p className="text-white/50 text-sm mb-6">Havaleni aldık. Admin banka hesabını kontrol ettikten sonra bakiyeni yükleyecek.</p>

          <div className="bg-white/10 rounded-2xl p-4 mb-3 text-left">
            <p className="text-white/40 text-xs mb-1">Referans Kodu</p>
            <div className="flex items-center justify-between">
              <p className="text-white font-black text-xl tracking-widest">{talep.referansKodu}</p>
              <button onClick={() => copy(talep.referansKodu, 'ref2')} className="p-2 rounded-xl bg-white/10">
                {copied === 'ref2' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/60" />}
              </button>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left">
            <p className="text-white/40 text-xs mb-1">Tutar</p>
            <p className="text-white font-bold text-lg">{Number(talep.tutar || tutar).toLocaleString('tr-TR')} TL</p>
          </div>

          <button
            onClick={() => navigate('/wallet')}
            className="w-full py-4 rounded-2xl font-black text-white text-base"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
          >
            Hizmet Hesabıma Dön
          </button>
        </div>
      </div>
    );
  }

  // ── Bilgi ekranı ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a103d] to-[#0f2444]">
      {/* Header */}
      <div className="flex items-center px-5 pt-12 pb-3">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 text-white mr-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div>
          <h1 className="text-white font-black text-xl">Havale / EFT</h1>
          <p className="text-white/40 text-xs">Aşağıdaki bilgilere havale gönderin</p>
        </div>
      </div>

      <div className="px-5 space-y-4 pb-10">
        {/* Tutar kartı */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}>
          <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-white/10" />
          <p className="text-white/60 text-xs font-medium mb-1">Gönderilecek Tutar</p>
          <p className="text-white font-black text-5xl">{Number(tutar).toLocaleString('tr-TR')} <span className="text-2xl">TL</span></p>
        </div>

        {/* Referans Kodu — en önemli bilgi */}
        {talep?.referansKodu && (
          <div className="relative overflow-hidden rounded-2xl p-5 border-2 border-amber-400/40" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.1) 100%)' }}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-amber-400" />
              <p className="text-amber-300 text-xs font-bold uppercase tracking-wider">Açıklama Kodu</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white font-black text-2xl tracking-[0.2em]">{talep.referansKodu}</p>
              <button onClick={() => copy(talep.referansKodu, 'ref')} className="p-3 rounded-xl bg-white/10 active:scale-90 transition">
                {copied === 'ref' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} className="text-amber-300" />}
              </button>
            </div>
            <p className="text-amber-200/60 text-xs mt-2">Bu kodu havale açıklamasına yazın</p>
          </div>
        )}

        {/* Banka bilgileri */}
        {(!ibanBilgi?.iban || ibanBilgi.iban === '—') ? (
          <div className="bg-rose-500/20 border border-rose-500/40 rounded-2xl p-5 text-center">
            <XCircle size={28} className="text-rose-400 mx-auto mb-2" />
            <p className="text-rose-300 font-semibold text-sm mb-1">Havale bilgileri henüz tanımlanmamış</p>
            <p className="text-rose-300/70 text-xs">Lütfen daha sonra tekrar deneyin veya kart ile ödeme yöntemini kullanın.</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur rounded-2xl overflow-hidden border border-white/10">
            {/* Banka adı */}
            <div className="flex items-center gap-2 px-5 py-3 bg-white/5 border-b border-white/10">
              <Building2 size={16} className="text-blue-400" />
              <p className="text-white font-bold text-sm">{ibanBilgi?.banka || 'Banka'}</p>
            </div>

            {/* Hesap Adı */}
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">Hesap Adı</p>
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-base">{ibanBilgi?.ad || '—'}</p>
                <button onClick={() => copy(ibanBilgi?.ad || '', 'ad')} className="p-2 rounded-xl bg-white/5 active:scale-90 transition">
                  {copied === 'ad' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/30" />}
                </button>
              </div>
            </div>

            {/* IBAN */}
            <div className="px-5 py-4">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">IBAN</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-mono font-bold text-sm tracking-wider break-all">{ibanBilgi?.iban || '—'}</p>
                <button onClick={() => copy(ibanBilgi?.iban || '', 'iban')} className="shrink-0 p-2 rounded-xl bg-white/5 active:scale-90 transition">
                  {copied === 'iban' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/30" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Adımlar */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Nasıl Yapılır?</p>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Yukarıdaki IBAN\'a havale/EFT gönderin' },
              { step: '2', text: `Açıklama kısmına "${talep?.referansKodu || '...'}" yazın` },
              { step: '3', text: '"Havaleyi Gönderdim" butonuna basın' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs font-black">{s.step}</span>
                </div>
                <p className="text-white/70 text-sm">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {hata && (
          <div className="bg-rose-500/20 border border-rose-500/40 rounded-2xl p-4 text-rose-300 text-sm">
            {hata}
          </div>
        )}

        {/* Ana buton */}
        <button
          onClick={handleGonderdim}
          disabled={!talep}
          className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-[0.98] transition disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', boxShadow: '0 8px 24px rgba(5,150,105,0.4)' }}
        >
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            Havaleyi Gönderdim
          </span>
        </button>

        <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
          <Clock size={12} />
          Hafta içi 09:00–18:00 arası genellikle aynı gün işlenir
        </div>
      </div>
    </div>
  );
}

/* ── Saved card helpers ── */
const SAVED_CARD_KEY = 'ustago_saved_card';
const getSavedCard = () => {
  try {
    const raw = localStorage.getItem(SAVED_CARD_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (c?.number && c?.holder && c?.expiry) return c;
    return null;
  } catch { return null; }
};
const saveCardToLocal = (card) => {
  try { localStorage.setItem(SAVED_CARD_KEY, JSON.stringify(card)); } catch {}
};
const removeSavedCard = () => {
  try { localStorage.removeItem(SAVED_CARD_KEY); } catch {}
};

/* ── Tick check icon ── */
function TickCircle({ active, className = '' }) {
  return (
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
      active
        ? 'border-emerald-400 bg-emerald-500 scale-110'
        : 'border-white/20 bg-transparent'
    } ${className}`}>
      {active && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

/* ── Main Page ── */
const Odeme = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // step: 'yontem' → 'kart' → payment
  const [step, setStep] = useState('yontem');
  const [yontem, setYontem] = useState(null); // null | 'kart' | 'havale'
  const [selectedAmount, setSelectedAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [ibanBilgi, setIbanBilgi] = useState(null);
  const [mesafeliSatis, setMesafeliSatis] = useState(false);
  const [onBilgilendirme, setOnBilgilendirme] = useState(false);

  // Kart bilgileri
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name?.toUpperCase() || '');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [savedCard, setSavedCard] = useState(() => getSavedCard());
  const [useSaved, setUseSaved] = useState(false);

  const legalAccepted = mesafeliSatis && onBilgilendirme;
  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  // Load saved card on mount
  useEffect(() => {
    const sc = getSavedCard();
    if (sc) {
      setSavedCard(sc);
    }
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');
    const err = searchParams.get('error');
    if (status === 'success' && amount) {
      setSuccess(true);
      setSuccessAmount(parseFloat(amount) || finalAmount);
    } else if (status === 'fail') {
      setError(err ? decodeURIComponent(err) : 'Ödeme başarısız oldu.');
    }
  }, [searchParams]);

  const formatCardNumber = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0,2)}/${clean.slice(2)}`;
    return clean;
  };

  const handleIyzicoPay = async () => {
    if (!finalAmount || finalAmount < 10) { setError('Minimum yükleme tutarı 10 TL'); return; }

    let payNum, payExpiry, payCvc, payHolder;
    if (useSaved && savedCard) {
      payNum = savedCard.number;
      payExpiry = savedCard.expiry;
      payCvc = cardCvc; // CVV her zaman yeniden girilmeli
      payHolder = savedCard.holder;
    } else {
      payNum = cardNumber.replace(/\s/g, '');
      payExpiry = cardExpiry;
      payCvc = cardCvc;
      payHolder = cardHolder;
    }

    if (payNum.replace(/\s/g, '').length < 15) { setError('Geçerli bir kart numarası girin.'); return; }
    if (payExpiry.length < 4) { setError('Son kullanma tarihini girin.'); return; }
    if (payCvc.length < 3) { setError('CVV kodunu girin.'); return; }
    if (!payHolder.trim()) { setError('Kart sahibi adını girin.'); return; }

    setLoading(true);
    setError(null);
    try {
      const [expMonth, expYear] = payExpiry.split('/');
      const cleanNum = payNum.replace(/\s/g, '');
      const res = await fetchAPI(API_ENDPOINTS.WALLET.TOPUP_INIT, {
        method: 'POST',
        body: {
          amount: finalAmount,
          cardNumber: cleanNum,
          expireMonth: expMonth,
          expireYear: `20${expYear}`,
          cvc: payCvc,
          cardHolderName: payHolder,
        },
        skipAutoLogout: true,
      });

      // Save card if requested (before potential redirect)
      if (saveCard && !useSaved) {
        saveCardToLocal({
          number: cleanNum,
          holder: payHolder,
          expiry: payExpiry,
          last4: cleanNum.slice(-4),
        });
      }

      if (res?.success && res?.data?.threeDSHtmlContent) {
        const win = window.open('', '_self');
        win.document.write(res.data.threeDSHtmlContent);
        win.document.close();
        return;
      }
      if (res?.success && res?.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }
      if (res?.success) {
        setSuccess(true);
        setSuccessAmount(finalAmount);
        return;
      }
      setError(res?.error || res?.message || 'Ödeme başlatılamadı.');
    } catch (err) {
      setError(err?.message || 'Ödeme işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleYontemDevam = async () => {
    if (!yontem) return;
    if (yontem === 'havale') {
      if (!ibanBilgi) {
        try {
          const res = await fetchAPI(API_ENDPOINTS.WALLET.HAVALE_BILGI);
          if (res?.success) setIbanBilgi(res.data);
        } catch {}
      }
      setStep('havale');
      return;
    }
    // Kart seçildi
    if (savedCard) {
      setUseSaved(true);
      setCardHolder(savedCard.holder);
    }
    setStep('kart');
  };

  // ── Havale ekranı ──
  if (step === 'havale') {
    return <HavaleTalimat tutar={finalAmount} ibanBilgi={ibanBilgi} onClose={() => setStep('yontem')} navigate={navigate} />;
  }

  // ── Başarılı ──
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a103d] to-[#0f2444] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/40">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Ödeme Başarılı!</h2>
          <p className="text-white/60 mb-1 text-lg">
            {(successAmount || finalAmount).toLocaleString('tr-TR')} TL hesabınıza yüklendi
          </p>
          <p className="text-white/40 text-sm mb-10">Bakiyeniz güncellendi</p>
          <button onClick={() => navigate('/wallet')} className="px-10 py-4 bg-white text-[#1a103d] rounded-2xl font-bold text-base shadow-xl active:scale-95 transition">
            Hizmet Hesabıma Dön
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: Kart formu ──
  if (step === 'kart') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a103d] to-[#0f2444]">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center px-4 pt-12 pb-4">
            <button onClick={() => { setStep('yontem'); setUseSaved(false); }} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 text-white mr-3 active:scale-90 transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div>
              <h1 className="text-white font-black text-xl">Kart Bilgileri</h1>
              <p className="text-white/40 text-xs">{finalAmount.toLocaleString('tr-TR')} TL yükleme</p>
            </div>
          </div>

          {/* Virtual Card */}
          <div className="px-5 mt-2 mb-6">
            <VirtualCard
              amount={finalAmount}
              holderName={(useSaved ? savedCard?.holder : cardHolder) || user?.name?.toUpperCase() || ''}
              cardNumber={(useSaved ? savedCard?.number : cardNumber.replace(/\s/g, '')) || ''}
              expiry={useSaved ? savedCard?.expiry : cardExpiry}
              cvc={cardCvc}
              flipped={cardFlipped}
            />
          </div>

          {/* Bottom sheet */}
          <div className="mx-2 rounded-t-[32px] bg-white dark:bg-[#1a1a2e] shadow-2xl px-5 pt-6 pb-10">

            {/* Saved card option */}
            {savedCard && (
              <div className="mb-5">
                <button
                  onClick={() => { setUseSaved(true); setCardCvc(''); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all mb-3 ${
                    useSaved
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-white/10'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${useSaved ? 'bg-purple-100 dark:bg-purple-800/30' : 'bg-gray-100 dark:bg-white/10'}`}>
                    <CreditCard size={20} className={useSaved ? 'text-purple-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-bold ${useSaved ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      Kayıtlı Kart
                    </p>
                    <p className="text-xs text-gray-400 font-mono">•••• •••• •••• {savedCard.last4}</p>
                  </div>
                  <TickCircle active={useSaved} />
                </button>

                <button
                  onClick={() => { setUseSaved(false); setCardNumber(''); setCardExpiry(''); setCardCvc(''); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    !useSaved
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-white/10'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${!useSaved ? 'bg-purple-100 dark:bg-purple-800/30' : 'bg-gray-100 dark:bg-white/10'}`}>
                    <CreditCard size={20} className={!useSaved ? 'text-purple-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-bold ${!useSaved ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      Yeni Kart ile Öde
                    </p>
                    <p className="text-xs text-gray-400">Farklı bir kart kullan</p>
                  </div>
                  <TickCircle active={!useSaved} />
                </button>

                {/* Delete saved card */}
                <button
                  onClick={() => { removeSavedCard(); setSavedCard(null); setUseSaved(false); }}
                  className="mt-2 text-xs text-rose-400 font-semibold flex items-center gap-1 mx-auto"
                >
                  <XCircle size={12} /> Kayıtlı kartı sil
                </button>
              </div>
            )}

            {/* Card form — only when NOT using saved card */}
            {(!useSaved || !savedCard) && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Kart Numarası</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    onFocus={() => setCardFlipped(false)}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-mono text-base tracking-wider focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Kart Sahibi</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    onFocus={() => setCardFlipped(false)}
                    placeholder="AD SOYAD"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-semibold text-sm uppercase tracking-wide focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Son Kullanma</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      onFocus={() => setCardFlipped(false)}
                      placeholder="AA/YY"
                      maxLength={5}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-mono text-base text-center focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">CVV</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      onFocus={() => setCardFlipped(true)}
                      onBlur={() => setCardFlipped(false)}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-mono text-base text-center focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                {/* Save card toggle */}
                <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-300 dark:border-white/20 text-purple-600 focus:ring-purple-500 shrink-0 accent-purple-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Kartımı kaydet</p>
                    <p className="text-[10px] text-gray-400">Sonraki ödemelerde tekrar girmeyesin</p>
                  </div>
                </label>
              </div>
            )}

            {/* CVV for saved card */}
            {useSaved && savedCard && (
              <div className="mb-5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">CVV Kodu</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onFocus={() => setCardFlipped(true)}
                  onBlur={() => setCardFlipped(false)}
                  placeholder="•••"
                  maxLength={4}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-mono text-base text-center focus:outline-none focus:border-purple-500 transition"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-center">Güvenliğiniz için CVV her seferinde girilmelidir</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-sm text-rose-600 dark:text-rose-400 font-medium mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleIyzicoPay}
              disabled={loading || finalAmount < 10 || !legalAccepted}
              className="relative w-full py-4 rounded-2xl font-black text-white text-base overflow-hidden active:scale-[0.98] transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }} />
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ödeme işleniyor...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={16} />
                  {finalAmount > 0 ? `${finalAmount.toLocaleString('tr-TR')} TL — Güvenli Öde` : 'Güvenli Öde'}
                </span>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 dark:text-gray-500 text-xs font-medium">
              <ShieldCheck size={13} />
              256-bit SSL · Güvenli ödeme
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: Yöntem seçimi (ilk ekran) ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a103d] to-[#0f2444]">
      <div className="relative">
        {/* Header */}
        <div className="flex items-center px-4 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 text-white mr-3 active:scale-90 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-black text-xl">Hizmet Kredisi Al</h1>
            <p className="text-white/40 text-xs">Tutar ve ödeme yöntemini seçin</p>
          </div>
        </div>

        {/* Virtual Card */}
        <div className="px-5 mt-2 mb-6">
          <VirtualCard amount={finalAmount} holderName={user?.name?.toUpperCase() || ''} cardNumber="" expiry="" cvc="" flipped={false} />
        </div>

        {/* Bottom sheet */}
        <div className="mx-2 rounded-t-[32px] bg-white dark:bg-[#1a1a2e] shadow-2xl px-5 pt-6 pb-10">

          {/* Tutar */}
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Yüklenecek Tutar
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_AMOUNTS.map((tutar) => (
              <button
                key={tutar}
                onClick={() => { setSelectedAmount(tutar); setCustomAmount(''); }}
                className={`py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                  selectedAmount === tutar && !customAmount
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                }`}
              >
                {tutar}₺
              </button>
            ))}
          </div>
          <div className="relative mb-6">
            <input
              type="number" min="10" value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
              placeholder="Farklı tutar girin..."
              className="w-full pl-4 pr-14 py-4 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-purple-500 transition dark:placeholder-gray-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">TL</span>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-sm text-rose-600 dark:text-rose-400 font-medium mb-4">
              {error}
            </div>
          )}

          {/* Yasal Onay */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={mesafeliSatis}
                onChange={(e) => setMesafeliSatis(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 dark:border-white/20 text-purple-600 focus:ring-purple-500 shrink-0 accent-purple-600"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                <a href="/legal/mesafeli-satis-sozlesmesi" target="_blank" className="text-purple-500 underline font-semibold hover:text-purple-700 transition">Mesafeli Satış Sözleşmesi</a>'ni okudum ve kabul ediyorum.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={onBilgilendirme}
                onChange={(e) => setOnBilgilendirme(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 dark:border-white/20 text-purple-600 focus:ring-purple-500 shrink-0 accent-purple-600"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                <a href="/legal/on-bilgilendirme-formu" target="_blank" className="text-purple-500 underline font-semibold hover:text-purple-700 transition">Ön Bilgilendirme Formu</a>'nu okudum ve kabul ediyorum.
              </span>
            </label>
          </div>

          {/* Ödeme Yöntemi Seçimi — güzel tickli kartlar */}
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Ödeme Yöntemi
          </p>

          <div className="space-y-3 mb-6">
            {/* Kart ile Öde */}
            <button
              onClick={() => setYontem('kart')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                yontem === 'kart'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10'
                  : 'border-gray-200 dark:border-white/10'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                yontem === 'kart' ? 'bg-purple-100 dark:bg-purple-800/40' : 'bg-gray-100 dark:bg-white/10'
              }`}>
                <CreditCard size={22} className={yontem === 'kart' ? 'text-purple-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-bold ${yontem === 'kart' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  Kart ile Öde
                </p>
                <p className="text-[11px] text-gray-400">iyzico 3D Secure Güvenli Ödeme</p>
                {savedCard && (
                  <p className="text-[10px] text-purple-400 font-semibold mt-0.5">Kayıtlı kart: •••• {savedCard.last4}</p>
                )}
              </div>
              <TickCircle active={yontem === 'kart'} />
            </button>

            {/* Havale / EFT */}
            <button
              onClick={() => setYontem('havale')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                yontem === 'havale'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10'
                  : 'border-gray-200 dark:border-white/10'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                yontem === 'havale' ? 'bg-emerald-100 dark:bg-emerald-800/40' : 'bg-gray-100 dark:bg-white/10'
              }`}>
                <Building2 size={22} className={yontem === 'havale' ? 'text-emerald-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-bold ${yontem === 'havale' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  Havale / EFT
                </p>
                <p className="text-[11px] text-gray-400">Banka havalesi · 1-24 saat</p>
              </div>
              <TickCircle active={yontem === 'havale'} />
            </button>
          </div>

          {/* Devam Et butonu */}
          <button
            onClick={handleYontemDevam}
            disabled={!yontem || finalAmount < 10 || !legalAccepted}
            className="relative w-full py-4 rounded-2xl font-black text-white text-base overflow-hidden active:scale-[0.98] transition disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }} />
            <span className="flex items-center justify-center gap-2">
              {yontem === 'kart' ? <CreditCard size={16} /> : yontem === 'havale' ? <Building2 size={16} /> : <Lock size={16} />}
              {!yontem ? 'Yöntem Seçin' : 'Devam Et'}
              {yontem && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              )}
            </span>
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 dark:text-gray-500 text-xs font-medium">
            <ShieldCheck size={13} />
            256-bit SSL · Güvenli ödeme
          </div>
        </div>
      </div>
    </div>
  );
};

export default Odeme;
