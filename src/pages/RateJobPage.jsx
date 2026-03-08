import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobFromBackend } from '../utils/fieldMapper'
import { Star, User } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function RateJobPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true)
        const response = await fetchAPI(API_ENDPOINTS.JOBS.GET(id))
        if (response.data) {
          setJob(mapJobFromBackend(response.data))
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
  }, [id])

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-600">Lütfen giriş yapın</p>
      </div>
    )
  }

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
        <p className="text-gray-600 text-xl mb-4">{error || 'İş bulunamadı'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-primary-500 text-white rounded-2xl font-semibold active:scale-[0.98]"
        >
          Geri Dön
        </button>
      </div>
    )
  }

  const isProfessional = user?.role === 'professional'
  const otherPerson = isProfessional ? job?.customer : (job?.professional || job?.usta)

  if (!otherPerson) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-600 text-xl mb-2">Değerlendirme yapılamıyor</p>
        <p className="text-gray-500 text-sm mb-4">Usta veya müşteri bilgisi eksik</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-primary-500 text-white rounded-2xl font-semibold active:scale-[0.98]"
        >
          Geri Dön
        </button>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Lütfen yıldız puanı verin')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetchAPI(API_ENDPOINTS.JOBS.RATE(job.id), {
        method: 'PUT',
        body: {
          rating,
          review
        }
      })

      if (response.data) {
        alert('Değerlendirme kaydedildi. Teşekkürler!')
        navigate(isProfessional ? '/professional' : '/home')
      }
    } catch (error) {
      console.error('Rating error:', error)
      alert(`Değerlendirme kaydedilirken hata oluştu: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50">
      <PageHeader title="Değerlendirme" />

      <div className="px-4 py-4 space-y-4">
        {/* Job title context */}
        <p className="text-sm text-gray-500 -mt-1">{job.title}</p>

        {/* Person Info */}
        <Card padding="p-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 mx-auto mb-3">
              {otherPerson?.profileImage ? (
                <img src={otherPerson.profileImage} alt={otherPerson.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User size={32} className="text-gray-400" /></div>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{otherPerson?.name}</h3>
            <p className="text-sm text-gray-600">
              {isProfessional ? 'Müşteriyi Değerlendir' : 'Ustayı Değerlendir'}
            </p>
          </div>
        </Card>

        {/* Star Rating */}
        <Card padding="p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-center">Puanınız</h3>
          <div className="flex justify-center gap-3 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 active:scale-[0.98]"
              >
                <Star
                  size={48}
                  className={`${
                    star <= (hoverRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-gray-600 font-semibold">
            {rating === 0 ? 'Puan seçin' :
             rating === 1 ? 'Çok Kötü' :
             rating === 2 ? 'Kötü' :
             rating === 3 ? 'Orta' :
             rating === 4 ? 'İyi' :
             'Mükemmel'}
          </p>
        </Card>

        {/* Review */}
        <Card padding="p-6">
          <h3 className="font-bold text-gray-900 mb-3">Yorumunuz (İsteğe bağlı)</h3>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Deneyiminizi paylaşın..."
            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={5}
          />
        </Card>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className={`w-full py-4 rounded-2xl font-semibold text-base transition flex items-center justify-center gap-2 active:scale-[0.98] ${
            rating === 0 || submitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Gönderiliyor...
            </>
          ) : (
            'Değerlendirmeyi Gönder'
          )}
        </button>
      </div>
    </div>
  )
}

export default RateJobPage
