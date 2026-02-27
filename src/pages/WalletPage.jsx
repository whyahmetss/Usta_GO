import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
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

      const jobsResponse = await fetchAPI(API_ENDPOINTS.JOBS.LIST);
      if (jobsResponse?.data && Array.isArray(jobsResponse.data)) {
        const mapped = mapJobsFromBackend(jobsResponse.data);
        const myJobs = mapped.filter(j =>
          j.ustaId === user?.id &&
          (j.status === 'completed' || j.status === 'rated')
        );

        // Toplam bakiye
        const totalBalance = myJobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0);
        setBalance(totalBalance);

        // Bu ay kazanç
        const now = new Date();
        const thisMonthJobs = myJobs.filter(j => {
          const d = j.completedAt ? new Date(j.completedAt) : null;
          return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        setThisMonthEarnings(thisMonthJobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0));

        // Geçen ay kazanç
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthJobs = myJobs.filter(j => {
          const d = j.completedAt ? new Date(j.completedAt) : null;
          return d && d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
        });
        setLastMonthEarnings(lastMonthJobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0));

        // Tamamlanan işleri işlem geçmişi olarak göster
        const jobTransactions = myJobs
          .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
          .map(j => ({
            id: j.id,
            description: j.title || 'Tamamlanan İş',
            amount: Number(j.budget) || 0,
            date: j.completedAt || null,
          }));
        setTransactions(jobTransactions);
      }

    } catch (err) {
      console.error('Cüzdan yükleme hatası:', err);
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
