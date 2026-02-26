import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react'

function WalletPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [balance, setBalance] = useState(0)
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0)
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0)
  const [lastMonthEarnings, setLastMonthEarnings] = useState(0)
  const [transactions, setTransactions] = useState([])

  const [customerBalance, setCustomerBalance] = useState(0)
  const [customerEscrow, setCustomerEscrow] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [coupons, setCoupons] = useState([])
  const [customerJobs, setCustomerJobs] = useState([])
  const [completedJobs, setCompletedJobs] = useState([])

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (user?.role?.toUpperCase() === 'USTA' || user?.role === 'professional') {
         try {
  const walletResponse = await fetchAPI(API_ENDPOINTS.WALLET.GET);
  console.log("Gelen Cüzdan Verisi:", walletResponse); // Tarayıcı konsoluna bak, ne geldiğini görelim!

  if (walletResponse) {
    // 1. Çekilebilir Bakiye (173 TL olan yer)
    // Backend'den 'balance' veya 'available_balance' olarak gelebilir
    const bakiye = walletResponse.balance ?? walletResponse.available_balance ?? walletResponse.data?.balance ?? 0;
    setBalance(bakiye);

    // 2. Toplam Kazanç (Profilde 1.038 TL olan yer)
    // Profil sayfası muhtemelen 'totalEarnings' okuyor. Hepsine bakalım:
    const kazanc = walletResponse.thisMonthEarnings ?? 
                   walletResponse.totalEarnings ?? 
                   walletResponse.earnings ?? 
                   walletResponse.data?.totalEarnings ?? 0;
    
    // Eğer hala 0 geliyorsa, profil sayfasındaki 1.038 TL'yi yakalamak için 'user' objesine de bakabiliriz
    setThisMonthEarnings(kazanc === 0 && user?.totalEarnings ? user.totalEarnings : kazanc);

    setPendingWithdrawal(walletResponse.pendingWithdrawal ?? walletResponse.data?.pendingWithdrawal ?? 0);
  }
} catch (walletErr) {
  console.warn('Cüzdan verisi çekilemedi:', walletErr);
}
          try {
            const transactionsResponse = await fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS)
            if (transactionsResponse.data) {
              setTransactions(transactionsResponse.data)
            }
          } catch (txErr) {
            console.warn('Transactions failed:', txErr)
          }
        } else if (user?.role === 'customer') {
          try {
            const response = await fetchAPI(API_ENDPOINTS.AUTH.ME)
            if (response.data) {
              setCustomerBalance(response.data.balance || 0)
              setCustomerEscrow(response.data.escrowBalance || 0)
              setTotalSpent(response.data.totalSpent || 0)
              setCoupons(response.data.coupons || [])
            }
          } catch (userErr) {
            console.warn('User data failed:', userErr)
          }

          try {
            const jobsResponse = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
            if (jobsResponse.data) {
              const mapped = mapJobsFromBackend(jobsResponse.data)
              const userJobs = mapped.filter(j => j.customer?.id === user?.id)
              setCustomerJobs(userJobs)
              setCompletedJobs(userJobs.filter(j => j.status === 'completed' || j.status === 'rated'))
            }
          } catch (jobsErr) {
            console.warn('Jobs failed:', jobsErr)
          }
        }
      } catch (err) {
        setError('Veriler yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (user) loadWalletData()
  }, [user])

  const activeCoupons = coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
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
              <p className="text-xs text-gray-500">Bakiye ve kuponlarınız</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Hesap Bakiyesi</p>
                <h2 className="text-4xl font-black">{customerBalance.toLocaleString('tr-TR')} TL</h2>
              </div>
              <button onClick={() => navigate('/odeme')} className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-xs font-bold">
                Bakiye Yükle
              </button>
            </div>
            {customerEscrow > 0 && (
              <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                <p className="text-white/80 text-xs mb-1">Bloke Edilen Tutar</p>
                <p className="text-lg font-bold">{customerEscrow.toLocaleString('tr-TR')} TL</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-2xl font-black text-gray-900">{totalSpent.toLocaleString('tr-TR')} TL</p>
              <p className="text-xs text-gray-600">Toplam Harcama</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-2xl font-black text-gray-900">{completedJobs.length}</p>
              <p className="text-xs text-gray-600">Tamamlanan İş</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3">Aktif Kuponlar ({activeCoupons.length})</h3>
            {activeCoupons.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">Kuponunuz bulunmuyor.</div>
            ) : (
              <div className="space-y-2">
                {activeCoupons.map(coupon => (
                  <div key={coupon.id} className="bg-white border border-purple-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-purple-700">{coupon.amount} TL İndirim</p>
                      <p className="text-xs text-gray-400">Kod: {coupon.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- USTA / PROFESYONEL GÖRÜNÜMÜ ---
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
            disabled={balance < 100}
            className="w-full py-3 bg-white text-green-600 rounded-xl font-bold disabled:opacity-50"
          >
            Para Çek (Min. 100 TL)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <TrendingUp size={16} className="text-green-600 mb-1" />
            <p className="text-xl font-bold text-gray-900">{thisMonthEarnings} TL</p>
            <p className="text-xs text-gray-500">Bu Ay</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-1">
              {growthPercentage >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
              <span className={`text-xl font-bold ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{growthPercentage}%</span>
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
            (activeTab === 'overview' ? transactions.slice(0, 5) : transactions).map(tx => (
              <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.type === 'earning' ? '💰' : '⚠️'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{tx.description || tx.title || 'İşlem'}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt || tx.date).toLocaleDateString('tr-TR')}</p>
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
