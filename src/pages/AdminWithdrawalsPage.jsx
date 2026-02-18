import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

function AdminWithdrawalsPage() {
  const navigate = useNavigate()
  const { withdrawals, approveWithdrawal, rejectWithdrawal } = useAuth()
  const [filter, setFilter] = useState('pending')

  const filteredWithdrawals = withdrawals.filter(w => w.status === filter)

  const handleApprove = (id) => {
    if (confirm('Bu cekim talebini onaylamak istediginize emin misiniz?')) {
      approveWithdrawal(id)
      alert('Cekim talebi onaylandi!')
    }
  }

  const handleReject = (id) => {
    const reason = prompt('Red nedeni (opsiyonel):')
    if (reason !== null) {
      rejectWithdrawal(id, reason || 'Belirtilmedi')
      alert('Cekim talebi reddedildi!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Para Cekme Talepleri</h1>
              <p className="text-xs text-gray-500">Usta odemelerini yonetin</p>
            </div>
          </div>
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
            {['pending', 'approved', 'rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>
                {f === 'pending' ? `Bekleyen (${withdrawals.filter(w => w.status === 'pending').length})` : f === 'approved' ? 'Onaylanan' : 'Reddedilen'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{filter === 'pending' ? '⏳' : filter === 'approved' ? '✅' : '❌'}</div>
            <p className="text-gray-600 font-semibold">
              {filter === 'pending' ? 'Bekleyen talep yok' : filter === 'approved' ? 'Onaylanan talep yok' : 'Reddedilen talep yok'}
            </p>
          </div>
        ) : (
          filteredWithdrawals.map(w => (
            <div key={w.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">{w.professional?.avatar || '⚡'}</div>
                  <div>
                    <p className="font-bold text-gray-900">{w.professional?.name || 'Usta'}</p>
                    <p className="text-xs text-gray-500">{new Date(w.requestDate).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-600">{w.amount.toLocaleString('tr-TR')} TL</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mt-1 ${
                    w.status === 'pending' ? 'bg-orange-100 text-orange-700' : w.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{w.status === 'pending' ? 'Bekliyor' : w.status === 'approved' ? 'Onaylandi' : 'Reddedildi'}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Banka:</span><span className="font-semibold text-gray-900">{w.bankName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">IBAN:</span><span className="font-mono text-xs text-gray-900">{w.iban}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Hesap Sahibi:</span><span className="font-semibold text-gray-900">{w.accountHolder}</span></div>
              </div>
              {w.status === 'pending' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleReject(w.id)} className="py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition flex items-center justify-center gap-2">
                    <XCircle size={18} /> Reddet
                  </button>
                  <button onClick={() => handleApprove(w.id)} className="py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Onayla
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm">
                    {w.status === 'approved' ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                    <span className="text-gray-700">{w.processedDate && new Date(w.processedDate).toLocaleString('tr-TR')} tarihinde islendi</span>
                  </div>
                  {w.rejectionReason && <p className="text-xs text-red-600 mt-2">Red nedeni: {w.rejectionReason}</p>}
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
