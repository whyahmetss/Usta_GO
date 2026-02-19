import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Star } from 'lucide-react'

function RateJobPage() {
  const { id } = useParams()
  const { user, jobs: contextJobs, rateJob } = useAuth()
  const navigate = useNavigate()

  // Use context jobs or fallback to localStorage
  const jobs = contextJobs || JSON.parse(localStorage.getItem('jobs') || '[]')
  const job = jobs.find(j => j.id === id)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Lütfen giriş yapın</p>
    </div>
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 text-xl mb-4">İş bulunamadı</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-xl">Geri Dön</button>
      </div>
    </div>
  }

  const isProfessional = user?.role === 'professional'
  const otherPerson = isProfessional ? job.customer : job.professional

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Lütfen yıldız puanı verin')
      return
    }

    const ratingData = isProfessional
      ? { professionalRating: rating, professionalReview: review }
      : { customerRating: rating, customerReview: review }

    rateJob(job.id, ratingData, review)
    alert('Değerlendirme kaydedildi. Teşekkürler!')
    navigate(isProfessional ? '/professional' : '/home')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        <h1 className="text-2xl font-black text-white mb-2">Değerlendirme</h1>
        <p className="text-white/80 text-sm">{job.title}</p>
      </div>

      <div className="px-4 py-6">
        {/* Person Info */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6 text-center">
          <div className="text-6xl mb-3">{otherPerson?.avatar}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{otherPerson?.name}</h3>
          <p className="text-sm text-gray-600">
            {isProfessional ? 'Müşteriyi Değerlendir' : 'Ustayı Değerlendir'}
          </p>
        </div>

        {/* Star Rating */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-bold text-gray-900 mb-4 text-center">Puanınız</h3>
          <div className="flex justify-center gap-3 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={48}
                  className={`${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
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
        </div>

        {/* Review */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Yorumunuz (Opsiyonel)</h3>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Deneyiminizi paylaşın..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={5}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition ${
            rating === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
          }`}
        >
          Değerlendirmeyi Gönder
        </button>
      </div>
    </div>
  )
}

export default RateJobPage
