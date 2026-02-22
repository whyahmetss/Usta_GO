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

  // Professional wallet data
  const [walletData, setWalletData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(0)
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0)
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0)
  const [lastMonthEarnings, setLastMonthEarnings] = useState(0)

  // Customer wallet data
  const [customerBalance, setCustomerBalance] = useState(0)
  const [customerEscrow, setCustomerEscrow] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [coupons, setCoupons] = useState([])
  const [customerJobs, setCustomerJobs] = useState([])
  const [completedJobs, setCompletedJobs] = useState([])

  // Load wallet data based on user role
  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading(true)
        setError(null)

        // user.role is already mapped (professional/customer/admin) by AuthContext
        if (user?.role === 'professional') {
          // Load professional wallet data
          const walletResponse = await fetchAPI(API_ENDPOINTS.WALLET.GET)
          if (walletResponse.data) {
            setWalletData(walletResponse.data)
            setBalance(walletResponse.data.balance || 0)
            setPendingWithdrawal(walletResponse.data.pendingWithdrawal || 0)
            setThisMonthEarnings(walletResponse.data.thisMonthEarnings || 0)
            setLastMonthEarnings(walletResponse.data.lastMonthEarnings || 0)
          }

          const transactionsResponse = await fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS)
          if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
            setTransactions(transactionsResponse.data)
          }
        } else if (user?.role === 'customer') {
          // Load customer wallet data
          const response = await fetchAPI(API_ENDPOINTS.AUTH.ME)
          if (response.data) {
            setCustomerBalance(response.data.balance || 0)
            setCustomerEscrow(response.data.escrowBalance || 0)
            setTotalSpent(response.data.totalSpent || 0)
            setCoupons(response.data.coupons || [])
          }

          // Load customer's jobs and map from backend format
          const jobsResponse = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
          if (jobsResponse.data && Array.isArray(jobsResponse.data)) {
            const mapped = mapJobsFromBackend(jobsResponse.data)
            const userJobs = mapped.filter(j => j.customer?.id === user?.id)
            setCustomerJobs(userJobs)
            // After mapping, statuses are lowercase
            setCompletedJobs(userJobs.filter(j => j.status === 'completed' || j.status === 'rated'))
          }
        }
      } catch (err) {
        console.error('Load wallet error:', err)
        setError(err.message || 'Cuzdan verileri yuklenirken hata olustu')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadWalletData()
    }
  }, [user])

  const activeCoupons = coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())

  const growthPercentage = lastMonthEarnings > 0
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
    : thisMonthEarnings > 0 ? 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cuzdan yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Yenile
          </button>
        </div>
      </div>
    )
  }

  // user.role is already mapped by AuthContext (professional/customer/admin)
  if (user?.role === 'professional') {
    return renderProfessionalWallet()
  }

  if (user?.role === 'customer') {
    return renderCustomerWallet()
  }

  function renderProfessionalWallet() {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-black text-gray-900">Cuzdan (Usta)</h1>
                <p className="text-xs text-gray-500">Kazanclarinizi yonetin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Toplam Bakiye</p>
                <h2 className="text-4xl font-black">{balance.toLocaleString('tr-TR')} TL</h2>
              </div>
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <DollarSign size={28} />
              </div>
            </div>
            {pendingWithdrawal > 0 && (
              <div className="bg-white/20 backdrop-blur rounded-xl p-3 mb-4">
                <p className="text-white/80 text-xs mb-1">Bekleyen Cekim</p>
                <p className="text-xl font-bold">{pendingWithdrawal.toLocaleString('tr-TR')} TL</p>
              </div>
            )}
            <button
              onClick={() => navigate('/withdraw')}
              className={`w-full py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition ${balance <= 0 ? 'bg-white/50 text-green-800 cursor-not-allowed' : 'bg-white text-green-600 hover:bg-white/90'}`}
              disabled={balance <= 0}
            >
              <Download size={20} /> Para Cek
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{thisMonthEarnings.toLocaleString('tr-TR')} TL</p>
              <p className="text-xs text-gray-600">Bu Ay</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 ${growthPercentage >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                  {growthPercentage >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                </div>
              </div>
              <p className={`text-2xl font-black ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage}%
              </p>
              <p className="text-xs text-gray-600">Buyume</p>
            </div>
          </div>

          <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1">
            <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'overview' ? 'bg-green-600 text-white' : 'text-gray-600'}`}>Ozet</button>
            <button onClick={() => setActiveTab('transactions')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'transactions' ? 'bg-green-600 text-white' : 'text-gray-600'}`}>Islem Gecmisi</button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-600 font-semibold">Henuz islem yok</p>
              <p className="text-gray-400 text-sm mt-2">Is tamamladiginizda kazanclariniz burada gorunur</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">{activeTab === 'overview' ? 'Son Islemler' : 'Tum Islemler'}</h3>
              {(activeTab === 'overview' ? transactions.slice(0, 3) : transactions).map(tx => (
                <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-12 h-12 ${tx.type === 'earning' ? 'bg-green-100' : tx.type === 'penalty' ? 'bg-red-100' : 'bg-blue-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">{tx.type === 'earning' ? '💰' : tx.type === 'penalty' ? '⚠️' : '📤'}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{tx.title}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <p className={`font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} TL
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderCustomerWallet() {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-black text-gray-900">Cuzdan</h1>
                <p className="text-xs text-gray-500">Bakiye ve kuponlariniz</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg text-white pointer-events-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Hesap Bakiyesi</p>
                <h2 className="text-4xl font-black">{customerBalance.toLocaleString('tr-TR')} TL</h2>
              </div>
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <DollarSign size={28} />
              </div>
            </div>
            {customerEscrow > 0 && (
              <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                <p className="text-white/80 text-xs mb-1">Escrow'da Tutulan</p>
                <p className="text-lg font-bold">{customerEscrow.toLocaleString('tr-TR')} TL</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl mb-1">💸</div>
              <p className="text-2xl font-black text-gray-900">{totalSpent.toLocaleString('tr-TR')} TL</p>
              <p className="text-xs text-gray-600">Toplam Harcama</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl mb-1">✅</div>
              <p className="text-2xl font-black text-gray-900">{completedJobs.length}</p>
              <p className="text-xs text-gray-600">Tamamlanan İş</p>
            </div>
          </div>

          {/* Coupons */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Kuponlarım ({activeCoupons.length})</h3>
            {activeCoupons.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🎟️</div>
                <p className="text-gray-600 text-sm">Aktif kupon yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeCoupons.map(coupon => (
                  <div key={coupon.id} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{coupon.amount} TL İndirim</p>
                      <p className="text-xs text-gray-500">Süresi: {new Date(coupon.expiresAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition">
                      Kullan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Jobs */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Son İşler</h3>
            {customerJobs.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600 text-sm">Henüz hiç iş oluşturmadınız</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerJobs.slice(0, 5).map(job => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{job.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        job.status === 'completed' || job.status === 'rated' ? 'bg-green-100 text-green-700' :
                        job.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {job.status === 'pending' ? 'Beklemede' : job.status === 'accepted' ? 'Kabul Edildi' : 'Tamamlandı'}
                      </span>
                    </div>
                    {/* job.address is the mapped field; job.price is also mapped from budget */}
                    <p className="text-sm text-gray-600 mb-2">{job.address || job.location || ''}</p>
                    <p className="text-lg font-black text-gray-900">{job.price ?? job.budget ?? 0} TL</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Değerlendirmelerim */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">⭐ Değerlendirmelerim</h3>
            {!customerJobs.some(j => j.rating) ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">⭐</div>
                <p className="text-gray-600 text-sm">Henüz değerlendirme yapmadınız</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerJobs.filter(j => j.rating && (j.rating?.customerRating || j.rating?.professionalRating)).map(job => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{job.professional?.name || 'Usta'}</p>
                        <p className="text-xs text-gray-500">{job.title}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => {
                          const stars = job.rating?.customerRating || job.rating?.professionalRating || 0
                          return <span key={i} className={i < stars ? '⭐' : '☆'} />
                        })}
                      </div>
                    </div>
                    {job.rating?.review && (
                      <p className="text-sm text-gray-600 mb-2">"{job.rating.review}"</p>
                    )}
                    <p className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Şikayetlerim */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">🚨 Şikayetlerim</h3>
            {!customerJobs.some(j => j.complaint) ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-600 text-sm">Şikayet göndermediniz</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerJobs.filter(j => j.complaint).map(job => (
                  <div key={job.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.complaint?.reason}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        job.complaint?.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        job.complaint?.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {job.complaint?.status === 'open' ? 'Açık' : job.complaint?.status === 'resolved' ? 'Çözüldü' : 'Reddedildi'}
                      </span>
                    </div>
                    {job.complaint?.details && (
                      <p className="text-sm text-gray-600 mb-2">{job.complaint.details}</p>
                    )}
                    <p className="text-xs text-gray-500">{new Date(job.complaint?.filedAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

}

export default WalletPage
