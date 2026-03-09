import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobFromBackend } from '../utils/fieldMapper'
import { AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function CancelJobPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [cancellationCount, setCancellationCount] = useState(0)
  const [cancelRates, setCancelRates] = useState({ pending: 5, accepted: 25, inProgress: 50 })

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetchAPI('/admin/config/cancellation')
        if (r?.data) setCancelRates(r.data)
      } catch { /* default rates */ }
    }
    load()
  }, [])

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true)
        const response = await fetchAPI(API_ENDPOINTS.JOBS.GET(id))
        if (response.data) {
          setJob(mapJobFromBackend(response.data))
          setCancellationCount(user?.cancellationCount || 0)
        } else {
          setError('İş bulunamadı')
        }
      } catch (err) {
        console.error('Load job error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadJob()
    }
  }, [id, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">İş yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-600 mb-4">{error || 'İş bulunamadı'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-primary-500 text-white rounded-2xl font-semibold active:scale-[0.98]"
        >
          Geri Dön
        </button>
      </div>
    )
  }

  const isProfessional = user?.role === 'professional' || user?.role?.toUpperCase() === 'USTA'

  let penalty = 0
  if (isProfessional) {
    if (job.status === 'accepted') penalty = 30
    else if (job.status === 'in_progress') penalty = 100
  }

  const reasons = isProfessional
    ? ['Müsait değilim', 'Malzeme eksikliği', 'Konum çok uzak', 'Acil durum', 'Diğer']
    : ['Vazgeçtim', 'Yanlış adres girdim', 'Başka bir usta buldum', 'Fiyat yüksek', 'Diğer']

  const myOffer = job.status === 'pending' && isProfessional && job.offers?.find(
    o => (o.ustaId || o.usta?.id) === user?.id && (o.status === 'PENDING' || o.status === 'pending')
  )
  const isWithdrawCase = job.status === 'pending' && isProfessional && myOffer
  const isNoOfferCase = job.status === 'pending' && isProfessional && !myOffer

  const handleCancel = async () => {
    if (job.status === 'pending' && isProfessional && myOffer) {
      if (!confirm('Teklifinizi geri çekmek istediğinize emin misiniz?')) return
      setSubmitting(true)
      try {
        await fetchAPI(API_ENDPOINTS.OFFERS.WITHDRAW(myOffer.id), { method: 'PATCH' })
        alert('Teklifiniz geri alındı.')
        navigate('/professional')
      } catch (err) {
        console.error('Withdraw offer error:', err)
        alert(`Hata: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (job.status === 'pending' && isProfessional && !myOffer) {
      alert('Bu işe teklif vermediniz. İptal edilecek bir bağlantınız yok.')
      return
    }

    const finalReason = reason === 'Diğer' ? customReason : reason
    if (!finalReason) {
      alert('Lütfen bir iptal nedeni seçin')
      return
    }

    const warningMsg = penalty > 0
      ? `Bu iş iptal edilecek ve ${penalty} TL sadakatsizlik bedeli kesilecek. Devam etmek istiyor musunuz?`
      : 'Bu iş iptal edilecek. Devam etmek istiyor musunuz?'

    if (confirm(warningMsg)) {
      setSubmitting(true)
      try {
        const response = await fetchAPI(API_ENDPOINTS.JOBS.CANCEL(id), {
          method: 'PUT',
          body: { reason: finalReason, penalty: 0 }
        })

        if (response.data || response.success !== false) {
          const withdrawn = response.data?.withdrawnOffer
          alert(withdrawn ? 'Teklifiniz geri alındı.' : 'İş iptal edildi.')
          navigate(isProfessional ? '/professional' : '/home')
        }
      } catch (err) {
        console.error('Cancel job error:', err)
        alert(`Hata: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="bg-gray-50">
      <PageHeader title="İş iptali" />

      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-gray-500 -mt-1">{job.title}</p>

        {/* Penalty Warning */}
        {penalty > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-3">
            <AlertTriangle size={24} className="text-rose-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-rose-900 mb-1">Sadakatsizlik Bedeli</h3>
              <p className="text-rose-700 text-sm">Bu işi iptal ederseniz <span className="font-black">{penalty} TL</span> sadakatsizlik bedeli kesilecektir.</p>
              {job.status === 'in_progress' && <p className="text-rose-600 text-xs mt-1">Devam eden işler için ceza yüksektir.</p>}
            </div>
          </div>
        )}

        {/* Cancellation Counter Warning */}
        {cancellationCount >= 2 && (
          <div className={`border rounded-2xl p-5 ${
            cancellationCount >= 10 ? 'bg-rose-50 border-rose-300' : cancellationCount >= 5 ? 'bg-amber-50 border-amber-300' : 'bg-amber-50 border-amber-300'
          }`}>
            <p className={`font-bold text-sm ${cancellationCount >= 10 ? 'text-rose-900' : cancellationCount >= 5 ? 'text-amber-900' : 'text-amber-900'}`}>
              Toplam {cancellationCount} iptal ettiniz.
            </p>
            <p className={`text-xs mt-1 ${cancellationCount >= 10 ? 'text-rose-700' : cancellationCount >= 5 ? 'text-amber-700' : 'text-amber-700'}`}>
              {cancellationCount >= 10 ? 'Hesabınız admin tarafından incelenecek!' :
               cancellationCount >= 5 ? 'Profilinizde iptal uyarısı görünecek!' :
               '3 iptalden sonra uyarı alırsınız.'}
            </p>
          </div>
        )}

        {/* PENDING + usta + teklifi yok: iptal edilemez */}
        {job.status === 'pending' && isProfessional && !myOffer && (
          <Card padding="p-6">
            <div className="text-center">
              <p className="text-amber-800 font-semibold">Bu işe teklif vermediniz.</p>
              <p className="text-amber-700 text-sm mt-1">İptal edilecek bir bağlantınız yok.</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-6 py-2.5 bg-amber-500 text-white rounded-2xl font-semibold active:scale-[0.98]"
              >
                Geri Dön
              </button>
            </div>
          </Card>
        )}

        {/* Reason Selection */}
        {!(job.status === 'pending' && isProfessional && !myOffer) && (
          <div className="space-y-4">
            <Card padding="p-6">
              <h3 className="font-bold text-gray-900 mb-4">{myOffer ? 'Teklifinizi geri çekmek için onaylayın' : 'İptal nedeni'}</h3>
              <div className="space-y-2">
                {reasons.map(r => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition font-semibold active:scale-[0.98] ${
                      reason === r ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {reason === 'Diğer' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="İptal nedeninizi yazın..."
                  className="w-full mt-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  rows={3}
                />
              )}
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(-1)}
                disabled={submitting}
                className="py-4 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 active:scale-[0.98] transition disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancel}
                disabled={isWithdrawCase ? submitting : (!reason || (reason === 'Diğer' && !customReason) || submitting)}
                className={`py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2 active:scale-[0.98] ${
                  (isWithdrawCase ? submitting : (!reason || (reason === 'Diğer' && !customReason) || submitting))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    İşleniyor...
                  </>
                ) : (
                  <>
                    {isWithdrawCase ? 'Teklifimi Geri Al' : `İptal Et ${penalty > 0 ? `(${penalty} TL)` : ''}`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CancelJobPage
