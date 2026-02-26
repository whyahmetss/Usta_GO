import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'

function WalletPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Usta State'leri
  const [balance, setBalance] = useState(0)
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0)
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0)
  const [lastMonthEarnings, setLastMonthEarnings] = useState(0)
  const [transactions, setTransactions] = useState([])

  // Müşteri State'leri
  const [customerBalance, setCustomerBalance] = useState(0)


  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading(true);
        
        // 1. ÖNCE İŞLERİ ÇEK (Profil sayfasındaki 1.038 TL'yi bulmak için)
        const jobsResponse = await fetchAPI(API_ENDPOINTS.JOBS.LIST);
        let calculatedTotal = 0;
        
        if (jobsResponse?.data && Array.isArray(jobsResponse.data)) {
          // Senin profil sayfasındaki mantık: Ustanın biten işlerini topla
          const myCompletedJobs = jobsResponse.data.filter(j => 
            (j.ustaId === user?.id || j.professional?.id === user?.id) && 
            (j.status === 'completed' || j.status === 'rated')
          );
          calculatedTotal = myCompletedJobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0);
        }

        // 2. CÜZDAN VERİSİNİ ÇEK (173 TL bakiye buradan geliyor)
        const walletResponse = await fetchAPI(API_ENDPOINTS.WALLET.GET);
        
        if (walletResponse) {
          // Çekilebilir bakiye (image_537d57.png'deki 173 TL)
          setBalance(walletResponse.balance || walletResponse.availableBalance || 0);
          setPendingWithdrawal(walletResponse.pendingWithdrawal || 0);
          
          // KAZANÇ: API'den gelmiyorsa bizim hesapladığımız 1.038 TL'yi bas
          const earnings = walletResponse.thisMonthEarnings || walletResponse.totalEarnings || calculatedTotal;
          setThisMonthEarnings(earnings);
          
          setLastMonthEarnings(walletResponse.lastMonthEarnings || 0);
        } else {
          setThisMonthEarnings(calculatedTotal);
        }

        // 3. İŞLEMLERİ ÇEK
        const transactionsResponse = await fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS);
        if (transactionsResponse?.data) {
          setTransactions(transactionsResponse.data);
        } else if (Array.isArray(transactionsResponse)) {
          setTransactions(transactionsResponse);
        }

      } catch (err) {
        console.error('Cüzdan yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadWalletData();
  }, [user]);

  // Büyüme hesaplama
  const growthPercentage = lastMonthEarnings > 0
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
    : thisMonthEarnings > 0 ? 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // --- MÜŞTERİ GÖRÜNÜMÜ ---
  if (user?.role === 'customer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Cüzdan</h1>
              <p className="text-xs text-gray-500">Bakiye ve işlemleriniz</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg text-white">
            <p className="text-white/80 text-sm mb-1">Hesap Bakiyesi</p>
            <h2 className="text-4xl font-black">{customerBalance.toLocaleString('tr-TR')} TL</h2>
          </div>
          
          <div className="text-center py-10 text-gray-400">
             <p className="text-sm">İşlem geçmişi yakında burada görünecek.</p>
          </div>
        </div>
      </div>
    )
  }

  // --- USTA GÖRÜNÜMÜ ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Usta Cüzdanı</h1>
            <p className="text-xs text-gray-500">Kazançlarınızı yönetin</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-white/80 text-sm mb-1">Çekilebilir Bakiye</p>
          <h2 className="text-4xl font-black mb-4">{balance.toLocaleString('tr-TR')} TL</h2>
          <button 
            onClick={() => navigate('/withdraw')}
            className="w-full py-3 bg-white text-green-600 rounded-xl font-bold"
          >
            Para Çek
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <TrendingUp size={16} className="text-green-600 mb-1" />
            <p className="text-xl font-bold text-gray-900">{thisMonthEarnings.toLocaleString('tr-TR')} TL</p>
            <p className="text-xs text-gray-500">Bu Ay Kazanç</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-1">
              <span className={`text-xl font-bold ${Number(growthPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>%{growthPercentage}</span>
            </div>
            <p className="text-xs text-gray-500">Büyüme</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-1 flex">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeTab === 'overview' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>Özet</button>
          <button onClick={() => setActiveTab('transactions')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeTab === 'transactions' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>İşlemler</button>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">İşlem geçmişi bulunamadı.</div>
          ) : (
            (activeTab === 'overview' ? transactions.slice(0, 5) : transactions).map((tx, idx) => (
              <div key={tx.id || idx} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.amount > 0 ? '💰' : '⚠️'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{tx.description || 'İşlem'}</p>
                    <p className="text-xs text-gray-500">{tx.date ? new Date(tx.date).toLocaleDateString('tr-TR') : 'Süresiz'}</p>
                  </div>
                </div>
                <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} TL
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletPage
