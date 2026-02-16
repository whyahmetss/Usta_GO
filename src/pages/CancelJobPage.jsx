import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, AlertCircle } from 'lucide-react'

function CancelJobPage() {
  const { id } = useParams()
  const { user, jobs } = useAuth()
  const navigate = useNavigate()
  
  const job = jobs.find(j => j.id === id)
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const isProfessional = user?.role === 'professional'

  // İptal nedenleri
  const cancelReasons = isProfessional ? [
    'Ulaşım sorunu yaşıyorum',
    'Hastalandım',
    'Acil bir durum çıktı',
    'Müşteri ile iletişim kuramadım',
    'Başka bir iş geldi',
    'Diğer'
  ] : [
    'Fikrim değişti',
    'Başka bir usta buldum',
    'İşi ertelemem gerekiyor',
    'Bütçe sorunu',
    'Usta ile iletişim kuramadım',
    'Diğer'
  ]

  // Ceza hesaplama
  const calculatePenalty = () => {
    if (!job) return 0

    const now = new Date()
    const jobDate = new Date(job.date)
    const timeDiff = (jobDate - now) / 1000 / 60 // dakika cinsinden

    if (job.status === 'pending') return 0 // İş henüz kabul edilmedi
    
    if (job.status === 'accepted') {
      if (timeDiff > 30) return 0 // 30 dk'dan fazla
      if (timeDiff > 0) return isProfessional ? 30 : 20 // 30 dk'dan az
      return 0 // Geçmiş iş
    }

    if (job.status === 'in_progress') {
      return isProfessional ? 100 : 0 // İş başladıysa usta için yüksek ceza
    }

    return 0
  }

  const penalty = calculatePenalty()

  const handleCancel = () => {
    if (!reason) {
      alert('Lütfen iptal nedenini seçin')
      return
    }

    if (reason === 'Diğer' && !customReason.trim()) {
      alert('Lütfen iptal nedeninizi yazın')
      return
    }

    const finalReason = reason === 'Diğer' ? customReason : reason

    // İptal işlemi (backend'e bağlanınca)
    const message = penalty > 0 
      ? `İş iptal edildi. ₺${penalty} ceza uygulanacaktır.`
      : 'İş başarıyla iptal edildi.'

    alert(message)
    navigate('/my-jobs')
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">İş bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">İşi İptal Et</h1>
              <p className="text-xs text-gray-500">{job.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* İş Bilgisi */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">İş Detayları</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">İş:</span>
              <span className="font-semibold text-gray-900">{job.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Durum:</span>
              <span className="font-semibold text-gray-900">
                {job.status === 'pending' ? 'Bekliyor' :
                 job.status === 'accepted' ? 'Kabul Edildi' :
                 job.status === 'in_progress' ? 'Devam Ediyor' :
                 'Tamamlandı'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ücret:</span>
              <span className="font-semibold text-gray-900">₺{job.price}</span>
            </div>
          </div>
        </div>

        {/* İptal Nedeni */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">İptal Nedeni</h3>
          <div className="space-y-2">
            {cancelReasons.map((r, idx) => (
              <button
                key={idx}
                onClick={() => setReason(r)}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${
                  reason === r
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{r}</p>
              </button>
            ))}
          </div>

          {reason === 'Diğer' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="İptal nedeninizi yazın..."
              className="w-full mt-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
            />
          )}
        </div>

        {/* Ceza Bilgisi */}
        {penalty > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900 mb-2">İptal Cezası</h4>
                <p className="text-sm text-red-800 mb-3">
                  Bu işi iptal ederseniz <strong>₺{penalty}</strong> ceza uygulanacaktır.
                </p>
                <p className="text-xs text-red-700">
                  {job.status === 'in_progress' 
                    ? 'İş başladıktan sonra iptal cezası yüksektir.'
                    : 'İş zamanına 30 dakikadan az kaldığı için ceza uygulanır.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Uyarı Sistemi */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-bold text-orange-900 mb-2">Önemli Bilgi</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• 3 iptal: Uyarı mesajı alırsınız</li>
                <li>• 5 iptal: Profilinizde gösterilir</li>
                <li>• 10 iptal: Admin incelemesi yapılır</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCancel}
            disabled={!reason}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition ${
              !reason
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            İptal Et {penalty > 0 && `(₺${penalty} ceza)`}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelJobPage
