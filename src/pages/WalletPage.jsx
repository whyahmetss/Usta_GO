import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react'

function WalletPage() {
  const { user, getWalletBalance, getThisMonthEarnings, getLastMonthEarnings, getPendingWithdrawals, getUserTransactions } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const balance = getWalletBalance()
  const pendingWithdrawal = getPendingWithdrawals()
  const thisMonthEarnings = getThisMonthEarnings()
  const lastMonthEarnings = getLastMonthEarnings()
  const transactions = getUserTransactions()

  const growthPercentage = lastMonthEarnings > 0
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
    : thisMonthEarnings > 0 ? 100 : 0

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

export default WalletPage
