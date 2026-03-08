import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, ShieldCheck, CheckCircle } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { API_ENDPOINTS } from '../config';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

const PRESET_AMOUNTS = [100, 200, 500, 1000];

const Odeme = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedAmount, setSelectedAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

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
  }, [searchParams, finalAmount]);

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
        body: { amount: finalAmount }
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
      <div className="bg-gray-50 flex items-center justify-center p-4 min-h-[60vh]">
        <Card padding="p-8" className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Ödeme Başarılı!</h2>
          <p className="text-gray-500 mb-1">{(successAmount || finalAmount).toLocaleString('tr-TR')} TL hesabınıza yüklendi.</p>
          <p className="text-sm text-gray-400 mb-8">Bakiyeniz güncellendi.</p>
          <button
            onClick={() => navigate('/wallet')}
            className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold active:scale-[0.98] transition"
          >
            Cüzdana Dön
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pb-10">
      <PageHeader title="Bakiye Yükle" />

      <div className="px-4 pt-4 max-w-md mx-auto space-y-5">
        {/* Tutar Seçimi */}
        <Card padding="p-5">
          <p className="font-bold text-gray-800 mb-4">Yüklenecek Tutar</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PRESET_AMOUNTS.map((tutar) => (
              <button
                key={tutar}
                onClick={() => { setSelectedAmount(tutar); setCustomAmount(''); }}
                className={`py-4 rounded-2xl font-semibold text-base transition-all border-2 active:scale-[0.98] ${
                  selectedAmount === tutar && !customAmount
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-100 text-gray-500 bg-gray-50 hover:border-gray-200'
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
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Card>

        {/* iyzico info */}
        <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100 flex items-center gap-3">
          <CreditCard size={24} className="text-primary-600 flex-shrink-0" />
          <p className="text-primary-800 text-sm font-medium">Ödeme butonuna tıkladığınızda iyzico güvenli ödeme sayfasına yönlendirileceksiniz. Kart bilgilerinizi orada gireceksiniz.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}

        {/* Özet */}
        {finalAmount > 0 && (
          <div className="bg-primary-50 rounded-2xl p-4 flex items-center justify-between border border-primary-100">
            <span className="text-primary-700 font-medium text-sm">Yüklenecek tutar</span>
            <span className="font-black text-primary-700 text-lg">{finalAmount.toLocaleString('tr-TR')} TL</span>
          </div>
        )}

        {/* Ödeme Butonu */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-primary-500 text-white py-5 rounded-2xl font-semibold text-lg hover:bg-primary-600 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
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
