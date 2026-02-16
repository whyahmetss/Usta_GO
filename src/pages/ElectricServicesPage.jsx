import { ArrowLeft, Star, MapPin, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ElectricServicesPage() {
  const navigate = useNavigate()

  const services = [
    {
      id: 1,
      title: 'Elektrik Arıza Onarımı',
      description: 'Evinizdeki elektrik arızalarını profesyonel ustalarımızla çözün',
      price: '₺200',
      duration: '1-2 saat',
      icon: '⚡'
    },
    {
      id: 2,
      title: 'Avize Montajı',
      description: 'Avize, lamba ve aydınlatma montajı',
      price: '₺150',
      duration: '30-60 dk',
      icon: '💡'
    },
    {
      id: 3,
      title: 'Priz ve Anahtar Değişimi',
      description: 'Priz, anahtar ve elektrik donanım değişimi',
      price: '₺100',
      duration: '30 dk',
      icon: '🔌'
    },
    {
      id: 4,
      title: 'Elektrik Panosu Montajı',
      description: 'Elektrik panosu kurulumu ve yenileme',
      price: '₺500',
      duration: '3-4 saat',
      icon: '📊'
    }
  ]

  const professionals = [
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      rating: 4.9,
      reviews: 127,
      completedJobs: 234,
      location: 'Kadıköy',
      avatar: '👨‍🔧'
    },
    {
      id: 2,
      name: 'Mehmet Demir',
      rating: 4.8,
      reviews: 98,
      completedJobs: 189,
      location: 'Beşiktaş',
      avatar: '👨‍🔧'
    },
    {
      id: 3,
      name: 'Ali Kaya',
      rating: 4.7,
      reviews: 76,
      completedJobs: 145,
      location: 'Şişli',
      avatar: '👨‍🔧'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Elektrik Hizmetleri</h1>
            <p className="text-white/70 text-sm">Profesyonel elektrikçiler</p>
          </div>
        </div>

        {/* Hero Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex w-24 h-24 bg-white/20 backdrop-blur rounded-3xl items-center justify-center mb-3">
            <span className="text-6xl">⚡</span>
          </div>
          <p className="text-white/90 text-sm">7/24 hizmet • Garantili iş kalitesi</p>
        </div>
      </div>

      {/* Hizmetler */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Hizmetlerimiz</h2>

        <div className="space-y-3">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">{service.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{service.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-green-600 font-bold">
                      <span>{service.price}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock size={14} />
                      <span>{service.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/create-job')}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition"
              >
                Hizmet Al
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Popüler Ustalar */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Popüler Elektrikçiler</h2>

        <div className="space-y-3">
          {professionals.map(pro => (
            <div key={pro.id} className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl">
                  {pro.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{pro.name}</h3>
                  <div className="flex items-center gap-1 mb-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold">{pro.rating}</span>
                    <span className="text-xs text-gray-500">({pro.reviews} değerlendirme)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>✅ {pro.completedJobs} iş</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>{pro.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
                  Profil
                </button>
                <button className="py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold">
                  Mesaj Gönder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ElectricServicesPage
