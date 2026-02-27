import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { API_ENDPOINTS } from '../config';

const PRESET_AMOUNTS = [100, 200, 500, 1000];

const Odeme = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handlePay = async () => {
    if (!finalAmount || finalAmount < 10) {
      setError('Minimum yükleme tutarı 10 TL');
      return;
    }
    if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 16 || expiry.length < 5 || cvc.length < 3) {
      setError('Lütfen tüm kart bilgilerini eksiksiz girin');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI(API_ENDPOINTS.WALLET.TOPUP, {
        method: 'POST',
        body: { amount: finalAmount }
      });
      if (res?.data || res?.success || res?.message?.toLowerCase().includes('başar')) {
        setSuccess(true);
      } else {
        setError(res?.message || 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      setError(err.message || 'Ödeme işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Ödeme Başarılı!</h2>
          <p className="text-gray-500 mb-1">{finalAmount.toLocaleString('tr-TR')} TL hesabınıza yüklendi.</p>
          <p className="text-sm text-gray-400 mb-8">Bakiyeniz güncellendi.</p>
          <button
            onClick={() => navigate('/wallet')}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base active:scale-95 transition-all"
          >
            Cüzdana Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-4 px-4 py-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center active:scale-95 transition-all">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Bakiye Yükle</h1>
            <p className="text-xs text-gray-500">Güvenli ödeme</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-md mx-auto space-y-5">
        {/* Tutar Seçimi */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-800 mb-4">Yüklenecek Tutar</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PRESET_AMOUNTS.map((tutar) => (
              <button
                key={tutar}
                onClick={() => { setSelectedAmount(tutar); setCustomAmount(''); }}
                className={`py-4 rounded-2xl font-bold text-base transition-all border-2 ${
                  selectedAmount === tutar && !customAmount
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-100 text-gray-500 bg-gray-50'
                }`}
              >
                {tutar} TL
              </button>
            ))}
          </div>
          <input
            type="number"
            min="10"
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
            placeholder="Farklı tutar girin..."
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Kart Bilgileri */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <CreditCard size={20} />
            <span className="font-bold text-gray-800">Kart Bilgileri</span>
          </div>
          <input
            type="text"
            placeholder="Kart Üzerindeki İsim"
            value={cardName}
            onChange={e => setCardName(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="AA/YY"
              value={expiry}
              onChange={e => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              className="w-1/2 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="CVC"
              value={cvc}
              onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              className="w-1/2 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Özet */}
        {finalAmount > 0 && (
          <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-blue-700 font-medium text-sm">Yüklenecek tutar</span>
            <span className="font-black text-blue-700 text-lg">{finalAmount.toLocaleString('tr-TR')} TL</span>
          </div>
        )}

        {/* Ödeme Butonu */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            `${finalAmount > 0 ? finalAmount.toLocaleString('tr-TR') + ' TL ' : ''}Öde`
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-medium pb-4">
          <ShieldCheck size={14} />
          256-bit SSL ile güvenli ödeme
        </div>
      </div>
    </div>
  );
};

export default Odeme;
