import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

function CancelJobPage() {
  const { id } = useParams()
  const { user, jobs, cancelJob, getCancellationCount } = useAuth()
  const navigate = useNavigate()
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const job = jobs.find(j => j.id === id)
  const cancellationCount = getCancellationCount()

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Is bulunamadi</p></div>
  }

  const isProfessional = user?.role === 'professional'

  // Calculate penalty
  let penalty = 0
  if (job.status === 'accepted') {
    penalty = isProfessional ? 30 : 20
  } else if (job.status === 'in_progress') {
    penalty = isProfessional ? 100 : 50
  }

  const reasons = isProfessional
    ? ['Musait degilim', 'Malzeme eksikligi', 'Konum cok uzak', 'Acil durum', 'Diger']
    : ['Vazgectim', 'Yanlis adres girdim', 'Baska usta buldum', 'Fiyat yuksek', 'Diger']

  const handleCancel = () => {
    const finalReason = reason === 'Diger' ? customReason : reason
    if (!finalReason) {
      alert('Lutfen bir iptal nedeni secin')
      return
    }

    const warningMsg = penalty > 0
      ? `Bu is iptal edilecek ve ${penalty} TL ceza kesilecek. Devam etmek istiyor musunuz?`
      : 'Bu is iptal edilecek. Devam etmek istiyor musunuz?'

    if (confirm(warningMsg)) {
      cancelJob(id, finalReason, penalty)
      alert('Is iptal edildi.')
      navigate(isProfessional ? '/professional' : '/home')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-2xl font-black text-white mb-2">Is Iptali</h1>
        <p className="text-white/80 text-sm">{job.title}</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Penalty Warning */}
        {penalty > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-900 mb-1">Iptal Cezasi</h3>
              <p className="text-red-700 text-sm">Bu isi iptal ederseniz <span className="font-black">{penalty} TL</span> ceza kesilecektir.</p>
              {job.status === 'in_progress' && <p className="text-red-600 text-xs mt-1">Devam eden isler icin ceza yuksektir.</p>}
            </div>
          </div>
        )}

        {/* Cancellation Counter Warning */}
        {cancellationCount >= 2 && (
          <div className={`border rounded-2xl p-5 ${
            cancellationCount >= 10 ? 'bg-red-50 border-red-300' : cancellationCount >= 5 ? 'bg-orange-50 border-orange-300' : 'bg-yellow-50 border-yellow-300'
          }`}>
            <p className={`font-bold text-sm ${cancellationCount >= 10 ? 'text-red-900' : cancellationCount >= 5 ? 'text-orange-900' : 'text-yellow-900'}`}>
              Toplam {cancellationCount} iptal yaptiniz.
            </p>
            <p className={`text-xs mt-1 ${cancellationCount >= 10 ? 'text-red-700' : cancellationCount >= 5 ? 'text-orange-700' : 'text-yellow-700'}`}>
              {cancellationCount >= 10 ? 'Hesabiniz admin tarafindan incelenecek!' :
               cancellationCount >= 5 ? 'Profilinizde iptal uyarisi gorunecek!' :
               '3 iptalden sonra uyari alirsiniz.'}
            </p>
          </div>
        )}

        {/* Reason Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4">Iptal Nedeni</h3>
          <div className="space-y-2">
            {reasons.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition font-medium ${
                  reason === r ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}>
                {r}
              </button>
            ))}
          </div>
          {reason === 'Diger' && (
            <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Iptal nedeninizi yazin..."
              className="w-full mt-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" rows={3} />
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate(-1)} className="py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition">Vazgec</button>
          <button onClick={handleCancel} disabled={!reason || (reason === 'Diger' && !customReason)}
            className={`py-4 rounded-xl font-bold transition ${
              !reason || (reason === 'Diger' && !customReason)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}>
            Iptal Et {penalty > 0 && `(${penalty} TL)`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelJobPage
