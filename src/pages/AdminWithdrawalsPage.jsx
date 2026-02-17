import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

function AdminWithdrawalsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('pending') // pending, approved, rejected

  // Mock data
  const withdrawals = [
    {
      id: 1,
      professional: { name: 'Ahmet Yılmaz', avatar: '⚡' },
      amount: 2000,
      bankName: 'Ziraat Bankası',
      iban: 'TR12 3456 7890 1234 5678 9012 34',
      accountHolder: 'Ahmet Yılmaz',
      requestDate: '2024-02-12 10:30',
      status: 'pending'
    },
    {
      id: 2,
      professional: { name: 'Mehmet Demir', avatar: '🔧' },
      amount: 1500,
      bankName: 'İş Bankası',
      iban: 'TR98 7654 3210 9876 5432 1098 76',
      accountHolder: 'Mehmet Demir',
      requestDate: '2024-02-11 15:45',
      status: 'pending'
    },
    {
      id: 3,
      professional: { name: 'Ali Kaya', avatar: '🔨' },
      amount: 3000,
      bankName: 'Garanti BBVA',
      iban: 'TR55 1234 5678 9012 3456 7890 12',
      accountHolder: 'Ali Kaya',
      requestDate: '2024-02-10 09:20',
      status: 'approved',
      processedDate: '2024-02-10 14:00'
    },
    {
      id: 4,
      professional: { name: 'Can Öz', avatar: '⚡' },
      amount: 500,
      bankName: 'Akbank',
      iban: 'TR33 9876 5432 1098 7654 3210 98',
      accountHolder: 'Can Öz',
      requestDate: '2024-02-09 11:15',
      status: 'rejected',
      processedDate: '2024-02-09 16:30',
      rejectionReason: 'IBAN bilgisi hatalı'
    }
  ]

  const filteredWithdrawals = withdrawals.filter(w => w.status === filter)

  const handleApprove = (id) => {
    if (confirm('Bu çekim talebini onaylamak istediğinize emin misiniz?')) {
      alert(`Çekim talebi #${id} onaylandı!`)
      // Backend'e istek gönderilecek
    }
  }

  const handleReject = (id) => {
    const reason = prompt('Red nedeni (opsiyonel):')
    if (reason !== null) {
      alert(`Çekim talebi #${id} reddedildi!`)
      // Backend'e istek gönderilecek
    }
  }

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
              <h1 className="text-xl font-black text-gray-900">Para Çekme Talepleri</h1>
              <p className="text-xs text-gray-500">Usta ödemelerini yönetin</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                filter === 'pending'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Bekleyen ({withdrawals.filter(w => w.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                filter === 'approved'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Onaylanan
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                filter === 'rejected'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Reddedilen
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="px-4 py-6 space-y-3">
        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {filter === 'pending' ? '⏳' : filter === 'approved' ? '✅' : '❌'}
            </div>
            <p className="text-gray-600 font-semibold">
              {filter === 'pending' ? 'Bekleyen talep yok' :
               filter === 'approved' ? 'Onaylanan talep yok' :
               'Reddedilen talep yok'}
            </p>
          </div>
        ) : (
          filteredWithdrawals.map(withdrawal => (
            <div key={withdrawal.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                    {withdrawal.professional.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{withdrawal.professional.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(withdrawal.requestDate).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-600">₺{withdrawal.amount.toLocaleString()}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mt-1 ${
                    withdrawal.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    withdrawal.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {withdrawal.status === 'pending' ? 'Bekliyor' :
                     withdrawal.status === 'approved' ? 'Onaylandı' :
                     'Reddedildi'}
                  </span>
                </div>
              </div>

              {/* Banka Bilgileri */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Banka:</span>
                  <span className="font-semibold text-gray-900">{withdrawal.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IBAN:</span>
                  <span className="font-mono text-xs text-gray-900">{withdrawal.iban}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hesap Sahibi:</span>
                  <span className="font-semibold text-gray-900">{withdrawal.accountHolder}</span>
                </div>
              </div>

              {/* Actions / Status */}
              {withdrawal.status === 'pending' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleReject(withdrawal.id)}
                    className="py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reddet
                  </button>
                  <button
                    onClick={() => handleApprove(withdrawal.id)}
                    className="py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Onayla
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm">
                    {withdrawal.status === 'approved' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-red-600" />
                    )}
                    <span className="text-gray-700">
                      {new Date(withdrawal.processedDate).toLocaleString('tr-TR')} tarihinde işlendi
                    </span>
                  </div>
                  {withdrawal.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2">
                      Red nedeni: {withdrawal.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminWithdrawalsPage
