import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react'

function WalletPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview') // overview, transactions

  // Mock data - Backend'e bağlanınca gerçek olacak
  const balance = 12500
  const pendingWithdrawal = 2000
  const thisMonthEarnings = 8500
  const lastMonthEarnings = 7200

  const transactions = [
    {
      id: 1,
      type: 'earning',
      title: 'Elektrik Arızası - Kadıköy',
      amount: 350,
      date: '2024-02-12 15:30',
      status: 'completed'
    },
    {
      id: 2,
      type: 'withdrawal',
      title: 'Para Çekme Talebi',
      amount: -2000,
      date: '2024-02-10 10:00',
      status: 'pending'
    },
    {
      id: 3,
      type: 'earning',
      title: 'Avize Montajı - Beşiktaş',
      amount: 250,
      date: '2024-02-09 16:45',
      status: 'completed'
    },
    {
      id: 4,
      type: 'withdrawal',
      title: 'Para Çekme Talebi',
      amount: -1500,
      date: '2024-02-05 09:15',
      status: 'completed'
    },
    {
      id: 5,
      type: 'earning',
      title: 'Priz Değişimi - Şişli',
      amount: 120,
      date: '2024-02-03 14:20',
      status: 'completed'
    }
  ]

  const growthPercentage = ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Cüzdan</h1>
              <p className="text-xs text-gray-500">Kazançlarınızı yönetin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Bakiye Kartı */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Toplam Bakiye</p>
              <h2 className="text-4xl font-black">₺{balance.toLocaleString()}</h2>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <DollarSign size={28} />
            </div>
          </div>

          {pendingWithdrawal > 0 && (
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 mb-4">
              <p className="text-white/80 text-xs mb-1">Bekleyen Çekim</p>
              <p className="text-xl font-bold">₺{pendingWithdrawal.toLocaleString()}</p>
            </div>
          )}

          <button
            onClick={() => navigate('/withdraw')}
            className="w-full py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-white/90 transition shadow-md flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Para Çek
          </button>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">₺{thisMonthEarnings.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Bu Ay</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${growthPercentage >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                {growthPercentage >= 0 ? (
                  <TrendingUp size={16} className="text-green-600" />
                ) : (
                  <TrendingDown size={16} className="text-red-600" />
                )}
              </div>
            </div>
            <p className={`text-2xl font-black ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthPercentage >= 0 ? '+' : ''}{growthPercentage}%
            </p>
            <p className="text-xs text-gray-600">Büyüme</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'overview'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Özet
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'transactions'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            İşlem Geçmişi
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Son İşlemler</h3>
            <div className="space-y-2">
              {transactions.slice(0, 3).map(transaction => (
                <div key={transaction.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-12 h-12 ${
                    transaction.type === 'earning' ? 'bg-green-100' : 'bg-blue-100'
                  } rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">
                      {transaction.type === 'earning' ? '💰' : '📤'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{transaction.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}₺{Math.abs(transaction.amount)}
                    </p>
                    {transaction.status === 'pending' && (
                      <span className="text-xs text-orange-600 font-semibold">Bekliyor</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Tüm İşlemler</h3>
            <div className="space-y-2">
              {transactions.map(transaction => (
                <div key={transaction.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-12 h-12 ${
                      transaction.type === 'earning' ? 'bg-green-100' : 'bg-blue-100'
                    } rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className="text-2xl">
                        {transaction.type === 'earning' ? '💰' : '📤'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-bold text-gray-900">{transaction.title}</p>
                        <p className={`font-black text-lg ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}₺{Math.abs(transaction.amount)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(transaction.date).toLocaleString('tr-TR')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {transaction.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {transaction.type === 'earning' ? 'Kazanç' : 'Çekim'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletPage
