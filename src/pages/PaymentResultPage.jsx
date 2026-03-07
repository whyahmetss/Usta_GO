import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * iyzico callback sonrası - auth gerektirmez, beyaz ekran önlenir
 */
const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const amount = searchParams.get('amount');
  const err = searchParams.get('error');

  const isSuccess = status === 'success' && amount;
  const amountNum = parseFloat(amount || '0') || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Ödeme Başarılı!</h2>
            <p className="text-gray-500 mb-1">
              {amountNum.toLocaleString('tr-TR')} TL hesabınıza yüklendi.
            </p>
            <p className="text-sm text-gray-400 mb-8">Bakiyeniz güncellendi.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Ödeme Başarısız</h2>
            <p className="text-gray-500 mb-8">
              {err ? decodeURIComponent(err) : 'Ödeme işlemi tamamlanamadı.'}
            </p>
          </>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/wallet')}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base active:scale-95 transition-all"
          >
            Cüzdana Dön
          </button>
          {!isSuccess && (
            <button
              onClick={() => navigate('/odeme')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm active:scale-95 transition-all"
            >
              Tekrar Dene
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
