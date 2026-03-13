import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle, Wifi, CreditCard } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { API_ENDPOINTS } from '../config';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

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

/* ── Animated Virtual Card ── */
function VirtualCard({ amount, holderName }) {
  const displayNum = '•••• •••• •••• 4242';
  const displayAmount = amount > 0 ? `${amount.toLocaleString('tr-TR')} TL` : '— TL';

  return (
    <div className="relative w-full max-w-sm mx-auto select-none" style={{ perspective: '1000px' }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/40 to-blue-500/40 blur-2xl scale-105" />

      {/* Card face */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #1a1040 0%, #2d1b6e 40%, #0f3460 80%, #16213e 100%)',
          minHeight: '200px',
        }}
      >
        {/* Shiny overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)',
          }}
        />

        {/* Top row */}
        <div className="relative flex items-start justify-between px-6 pt-5">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Usta Go</p>
            <p className="text-white font-black text-lg tracking-tight">Cüzdan</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ContactlessSVG />
          </div>
        </div>

        {/* Chip row */}
        <div className="relative flex items-center justify-between px-6 mt-4">
          <ChipSVG />
          <div className="text-right">
            <p className="text-white/40 text-[9px] uppercase tracking-widest">Yüklenecek</p>
            <p className="text-white font-black text-xl tabular-nums transition-all duration-300">
              {displayAmount}
            </p>
          </div>
        </div>

        {/* Card number */}
        <div className="relative px-6 mt-5">
          <p className="text-white/70 text-base tracking-[0.25em] font-mono">{displayNum}</p>
        </div>

        {/* Bottom row */}
        <div className="relative flex items-end justify-between px-6 pt-3 pb-5">
          <div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Kart Sahibi</p>
            <p className="text-white font-semibold text-sm tracking-wide uppercase">
              {holderName || 'USTA GO USER'}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Geçerlilik</p>
            <p className="text-white font-semibold text-sm">12/28</p>
          </div>
        </div>

        {/* Bottom-right logo */}
        <div className="absolute bottom-4 right-5">
          <MastercardLogo />
        </div>

        {/* Decorative circles */}
        <div className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full bg-purple-500/10" />
        <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-blue-500/10" />
      </div>
    </div>
  );
}

/* ── Main Page ── */
const Odeme = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;
  const holderName = user ? `${user.name || ''}`.toUpperCase() : '';

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

  const handlePay = async () => {
    if (!finalAmount || finalAmount < 10) {
      setError('Minimum yükleme tutarı 10 TL');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI(API_ENDPOINTS.WALLET.TOPUP_INIT, {
        method: 'POST',
        body: { amount: finalAmount },
      });
      if (res?.success && res?.data?.paymentPageUrl) {
        window.location.href = res.data.paymentPageUrl;
        return;
      }
      setError(res?.error || 'Ödeme başlatılamadı.');
    } catch (err) {
      setError(err?.message || 'Ödeme işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

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
          <button
            onClick={() => navigate('/wallet')}
            className="px-10 py-4 bg-white text-[#1a103d] rounded-2xl font-bold text-base shadow-xl active:scale-95 transition"
          >
            Cüzdana Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a103d] to-[#0f2444]">
      <div className="relative">
        {/* Custom header for dark background */}
        <div className="flex items-center px-4 pt-12 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 text-white mr-3 active:scale-90 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-black text-xl">Bakiye Yükle</h1>
            <p className="text-white/40 text-xs">iyzico ile güvenli ödeme</p>
          </div>
        </div>

        {/* Card */}
        <div className="px-5 mt-2 mb-8">
          <VirtualCard amount={finalAmount} holderName={holderName} />
        </div>

        {/* Bottom sheet */}
        <div className="mx-2 rounded-t-[32px] bg-white dark:bg-[#1a1a2e] shadow-2xl px-5 pt-6 pb-10">

          {/* Amount label */}
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Yüklenecek Tutar
          </p>

          {/* Preset grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_AMOUNTS.map((tutar) => (
              <button
                key={tutar}
                onClick={() => { setSelectedAmount(tutar); setCustomAmount(''); }}
                className={`py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                  selectedAmount === tutar && !customAmount
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15'
                }`}
              >
                {tutar}₺
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="relative mb-5">
            <input
              type="number"
              min="10"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
              placeholder="Farklı tutar girin..."
              className="w-full pl-4 pr-14 py-4 rounded-2xl border-2 border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-purple-500 transition dark:placeholder-gray-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">TL</span>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-sm text-rose-600 dark:text-rose-400 font-medium mb-4">
              {error}
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={loading || finalAmount < 10}
            className="relative w-full py-4 rounded-2xl font-black text-white text-base overflow-hidden active:scale-[0.98] transition disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
              boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
            }}
          >
            {/* Shine */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }}
            />
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>İşleniyor...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CreditCard size={18} />
                {finalAmount > 0 ? `${finalAmount.toLocaleString('tr-TR')} TL Öde` : 'Öde'}
              </span>
            )}
          </button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 dark:text-gray-500 text-xs font-medium">
            <ShieldCheck size={13} />
            256-bit SSL · iyzico güvencesi ile korunmaktadır
          </div>
        </div>
      </div>
    </div>
  );
};

export default Odeme;
