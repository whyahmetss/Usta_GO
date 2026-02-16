import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, MapPin, Phone, Camera, CheckCircle, Navigation } from 'lucide-react'

function JobDetailPage() {
  const { id } = useParams()
  const { user, jobs, acceptJob, startJob, completeJob } = useAuth()
  const navigate = useNavigate()
  
  const job = jobs.find(j => j.id === id)
  const [beforePhotos, setBeforePhotos] = useState(job?.beforePhotos || [])
  const [afterPhotos, setAfterPhotos] = useState(job?.afterPhotos || [])

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">İş bulunamadı</p>
      </div>
    )
  }

  const isProfessional = user?.role === 'professional'
  const isCustomer = user?.role === 'customer'

  const handleAccept = () => {
    if (confirm('Bu işi kabul etmek istiyor musunuz?')) {
      acceptJob(job.id)
      alert('İş kabul edildi! Müşteri bilgilendirild i.')
    }
  }

  const handleStartNavigation = () => {
    // Google Maps'te aç
    const { lat, lng } = job.location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank')
  }

  const handleTakePhoto = (type) => {
    // Gerçek uygulamada kamera açılacak
    const photoUrl = `https://placehold.co/400x300/blue/white?text=${type === 'before' ? 'Once' : 'Sonra'}`
    
    if (type === 'before') {
      setBeforePhotos([...beforePhotos, photoUrl])
    } else {
      setAfterPhotos([...afterPhotos, photoUrl])
    }
  }

  const handleStartJob = () => {
    if (beforePhotos.length === 0) {
      alert('Lütfen işe başlamadan önce fotoğraf çekin')
      return
    }
    startJob(job.id, beforePhotos)
    alert('İş başlatıldı! İyi çalışmalar.')
  }

  const handleCompleteJob = () => {
    if (afterPhotos.length === 0) {
      alert('Lütfen iş bitim fotoğrafı çekin')
      return
    }
    completeJob(job.id, afterPhotos)
    alert('İş tamamlandı! Müşteri değerlendirme yapacak.')
    navigate('/professional')
  }

  const otherPerson = isProfessional ? job.customer : job.professional

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        <h1 className="text-2xl font-black text-white mb-2">{job.title}</h1>
        <div className="flex items-center gap-2 text-white/90">
          <MapPin size={16} />
          <span className="text-sm">{job.location.address}</span>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Status Badge */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Durum</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              job.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
              job.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
              job.status === 'in_progress' ? 'bg-purple-100 text-purple-600' :
              'bg-green-100 text-green-600'
            }`}>
              {job.status === 'pending' ? 'Bekliyor' :
               job.status === 'accepted' ? 'Kabul Edildi' :
               job.status === 'in_progress' ? 'Devam Ediyor' :
               'Tamamlandı'}
            </span>
          </div>
        </div>

        {/* Job Info */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-3">İş Detayları</h3>
          <p className="text-gray-700 mb-4">{job.description}</p>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">Ücret</span>
            <span className="text-2xl font-black text-green-600">₺{job.price}</span>
          </div>
        </div>

        {/* Customer/Professional Info */}
        {otherPerson && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3">
              {isProfessional ? 'Müşteri Bilgileri' : 'Usta Bilgileri'}
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">{otherPerson.avatar}</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{otherPerson.name}</p>
                {otherPerson.phone && (
                  <a 
                    href={`tel:${otherPerson.phone}`}
                    className="flex items-center gap-2 text-blue-600 text-sm mt-1"
                  >
                    <Phone size={14} />
                    {otherPerson.phone}
                  </a>
                )}
              </div>
            </div>
            {!isProfessional && job.professional && (
              <button
                onClick={() => navigate(`/professional-profile/${job.professional.id}`)}
                className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-100 transition"
              >
                Profili Görüntüle →
              </button>
            )}
          </div>
        )}

        {/* Photos */}
        {(job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed') && isProfessional && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3">📸 Fotoğraflar</h3>
            
            {/* Before Photos */}
            {job.status === 'accepted' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Başlangıç Fotoğrafları</p>
                  <button
                    onClick={() => handleTakePhoto('before')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-xl text-sm font-bold"
                  >
                    <Camera size={16} />
                    Fotoğraf Çek
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {beforePhotos.map((photo, idx) => (
                    <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      <img src={photo} alt="Önce" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* After Photos */}
            {job.status === 'in_progress' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Bitim Fotoğrafları</p>
                  <button
                    onClick={() => handleTakePhoto('after')}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-600 rounded-xl text-sm font-bold"
                  >
                    <Camera size={16} />
                    Fotoğraf Çek
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {afterPhotos.map((photo, idx) => (
                    <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      <img src={photo} alt="Sonra" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Photos */}
            {job.status === 'completed' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Başlangıç</p>
                  <div className="grid grid-cols-3 gap-2">
                    {job.beforePhotos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img src={photo} alt="Önce" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Bitim</p>
                  <div className="grid grid-cols-3 gap-2">
                    {job.afterPhotos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img src={photo} alt="Sonra" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions for Professional */}
        {isProfessional && (
          <div className="space-y-3">
            {job.status === 'pending' && (
              <button
                onClick={handleAccept}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition"
              >
                ✅ İşi Kabul Et
              </button>
            )}

            {job.status === 'accepted' && (
              <>
                <button
                  onClick={handleStartNavigation}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  <Navigation size={20} />
                  Yola Çık (Google Maps)
                </button>
                <button
                  onClick={handleStartJob}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition"
                  disabled={beforePhotos.length === 0}
                >
                  🚀 İşe Başla
                </button>
              </>
            )}

            {job.status === 'in_progress' && (
              <button
                onClick={handleCompleteJob}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                disabled={afterPhotos.length === 0}
              >
                <CheckCircle size={20} />
                İşi Tamamla
              </button>
            )}
          </div>
        )}

        {/* Actions for Customer */}
        {isCustomer && job.status === 'completed' && !job.rating && (
          <button
            onClick={() => navigate(`/rate/${job.id}`)}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition"
          >
            ⭐ Değerlendir
          </button>
        )}

        {/* Message Button */}
        {otherPerson && job.status !== 'pending' && (
          <button
            onClick={() => navigate(`/messages/${job.id}`)}
            className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition"
          >
            💬 Mesaj Gönder
          </button>
        )}

        {/* Cancel Button */}
        {job.status !== 'completed' && job.status !== 'cancelled' && (
          <button
            onClick={() => navigate(`/cancel-job/${job.id}`)}
            className="w-full py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition"
          >
            ❌ İşi İptal Et
          </button>
        )}
      </div>
    </div>
  )
}

export default JobDetailPage
