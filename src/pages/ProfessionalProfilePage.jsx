import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Star, MapPin, Award, Clock, CheckCircle, MessageSquare, Shield } from 'lucide-react'

function ProfessionalProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { jobs } = useAuth()
  const [activeTab, setActiveTab] = useState('about')

  // Get real professional data from jobs
  const professional = useMemo(() => {
    const allJobs = jobs || JSON.parse(localStorage.getItem('jobs') || '[]')
    const users = JSON.parse(localStorage.getItem('users') || '[]')

    // Find professional's jobs
    const proJobs = allJobs.filter(j => j.professional?.id === id)
    const completedJobs = proJobs.filter(j => j.status === 'completed' || j.status === 'rated')
    const ratedJobs = completedJobs.filter(j => j.rating)

    // Calculate rating
    const totalRating = ratedJobs.reduce((sum, j) => sum + (j.rating?.customerRating || 0), 0)
    const avgRating = ratedJobs.length > 0 ? (totalRating / ratedJobs.length).toFixed(1) : '0.0'

    // Get user data
    const user = users.find(u => u.id === id) || {
      id,
      name: 'Usta',
      avatar: '⚡',
      createdAt: new Date().toISOString(),
      verificationStatus: 'unverified'
    }

    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      title: 'Profesyonel Usta',
      rating: parseFloat(avgRating),
      reviewCount: ratedJobs.length,
      completedJobs: completedJobs.length,
      memberSince: user.createdAt,
      location: proJobs.length > 0 ? proJobs[0].location.address : 'İstanbul',
      responseTime: '5 dakika',
      about: `Profesyonel hizmet için hazırım. ${completedJobs.length} iş tamamladım.`,
      verified: user.verificationStatus === 'verified',
      skills: ['Elektrik Tesisatı', 'Arıza Onarımı'],
      portfolio: completedJobs.filter(j => j.afterPhotos?.length > 0).map((job, idx) => ({
        id: idx,
        image: job.afterPhotos[0] || 'https://placehold.co/400x300/blue/white',
        title: job.title
      })),
      reviews: ratedJobs.map(job => ({
        id: job.id,
        customer: job.customer.name,
        rating: job.rating.customerRating,
        comment: job.rating.review || 'Harika iş çıkardı.',
        date: job.createdAt,
        jobTitle: job.title
      })),
      stats: [
        { label: 'Tamamlanan İş', value: completedJobs.length.toString(), icon: CheckCircle },
        { label: 'Ortalama Puan', value: avgRating, icon: Star },
        { label: 'Metnli Yorum', value: ratedJobs.length.toString(), icon: MessageSquare },
        { label: 'Durum', value: user.verificationStatus === 'verified' ? '✓' : '?', icon: Award }
      ]
    }
  }, [id, jobs])

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-4 pb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center mb-4 transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          {/* Profile Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
              {professional.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-gray-900">{professional.name}</h1>
                {professional.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                    <Shield size={12} /> Doğrulandı
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{professional.title}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-gray-900">{professional.rating}</span>
                  <span className="text-sm text-gray-500">({professional.reviewCount})</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>{professional.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {professional.stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 text-center">
                  <Icon size={16} className="text-blue-600 mx-auto mb-1" />
                  <p className="font-black text-gray-900 text-sm">{stat.value}</p>
                  <p className="text-[10px] text-gray-600">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="flex px-4">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'about'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Hakkında
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'portfolio'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Yorumlar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* About */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Hakkında</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{professional.about}</p>
            </div>

            {/* Skills */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Uzmanlık Alanları</h3>
              <div className="flex flex-wrap gap-2">
                {professional.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Certificates */}
            {professional.certificates.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Sertifikalar</h3>
                <div className="space-y-2">
                  {professional.certificates.map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Award size={20} className="text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{cert.name}</p>
                        <p className="text-xs text-gray-500">{cert.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600">
                {new Date(professional.memberSince).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })} tarihinden beri üye
              </p>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {professional.portfolio.map(item => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {professional.reviews.map(review => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{review.customer}</p>
                    <p className="text-xs text-gray-500">{review.jobTitle}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                <p className="text-xs text-gray-500">
                  {new Date(review.date).toLocaleDateString('tr-TR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Button */}
      <div className="fixed bottom-6 left-4 right-4 z-40">
        <button
          onClick={() => navigate(`/messages`)}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition"
        >
          Mesaj Gönder
        </button>
      </div>
    </div>
  )
}

export default ProfessionalProfilePage
