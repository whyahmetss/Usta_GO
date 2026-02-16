import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, Award, Clock, CheckCircle, MessageSquare } from 'lucide-react'

function ProfessionalProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('about') // about, portfolio, reviews

  // Mock professional data
  const professional = {
    id: id || '1',
    name: 'Ahmet Yılmaz',
    avatar: '⚡',
    title: 'Elektrik Ustası',
    rating: 4.9,
    reviewCount: 127,
    completedJobs: 234,
    memberSince: '2022-03-15',
    location: 'Kadıköy, İstanbul',
    responseTime: '5 dakika',
    about: '10 yıllık deneyimli elektrik ustasıyım. Konut ve işyeri elektrik tesisatı, arıza onarımı, aydınlatma sistemleri konularında uzmanım. Müşteri memnuniyeti benim için en önemli önceliktir.',
    skills: ['Elektrik Tesisatı', 'Arıza Onarımı', 'Aydınlatma', 'Pano Montajı', 'Otomasyon'],
    certificates: [
      { name: 'Elektrik Teknisyeni Sertifikası', year: '2012' },
      { name: 'İSG Eğitimi', year: '2021' }
    ],
    portfolio: [
      { id: 1, image: 'https://placehold.co/400x300/blue/white?text=İş+1', title: 'Villa Elektrik Tesisatı' },
      { id: 2, image: 'https://placehold.co/400x300/green/white?text=İş+2', title: 'Restoran Aydınlatma' },
      { id: 3, image: 'https://placehold.co/400x300/orange/white?text=İş+3', title: 'Ofis Elektrik Panosu' },
      { id: 4, image: 'https://placehold.co/400x300/purple/white?text=İş+4', title: 'Daire Arıza Onarımı' }
    ],
    reviews: [
      {
        id: 1,
        customer: 'Zeynep K.',
        rating: 5,
        comment: 'Çok profesyonel ve hızlı çalıştı. Kesinlikle tavsiye ederim!',
        date: '2024-02-10',
        jobTitle: 'Elektrik Arızası'
      },
      {
        id: 2,
        customer: 'Mehmet D.',
        rating: 5,
        comment: 'İşini titizlikle yaptı, çok memnun kaldık.',
        date: '2024-02-08',
        jobTitle: 'Avize Montajı'
      },
      {
        id: 3,
        customer: 'Ayşe Y.',
        rating: 4,
        comment: 'Güler yüzlü ve işini bilen bir usta. Teşekkürler.',
        date: '2024-02-05',
        jobTitle: 'Priz Değişimi'
      }
    ],
    stats: [
      { label: 'Tamamlanan İş', value: '234', icon: CheckCircle },
      { label: 'Ortalama Süre', value: '1.5 saat', icon: Clock },
      { label: 'Yanıt Süresi', value: '5 dk', icon: MessageSquare },
      { label: 'Memnuniyet', value: '%98', icon: Award }
    ]
  }

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
              <h1 className="text-2xl font-black text-gray-900 mb-1">{professional.name}</h1>
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
