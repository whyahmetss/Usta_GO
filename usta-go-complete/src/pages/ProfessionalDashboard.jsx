import { useState } from 'react'
import { Bell, Menu, Home, Briefcase, MessageSquare, User, DollarSign, Star, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import HamburgerMenu from '../components/HamburgerMenu.jsx'

function ProfessionalDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [showMenu, setShowMenu] = useState(false)

  const stats = [
    { label: 'Bu Ay Kazanç', value: '₺12.500', icon: DollarSign, color: 'green' },
    { label: 'Tamamlanan İş', value: '42', icon: Briefcase, color: 'blue' },
    { label: 'Ortalama Puan', value: '4.9', icon: Star, color: 'yellow' },
    { label: 'Büyüme', value: '+18%', icon: TrendingUp, color: 'purple' },
  ]

  const { jobs, getPendingJobs } = useAuth()
  const jobRequests = getPendingJobs()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 pb-24">
      {/* Header - Yeşil Gradient */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 pb-6 pt-4 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Usta Paneli</h1>
              <p className="text-white/70 text-xs">Hoş geldin, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center relative"
            >
              <Bell size={20} className="text-white" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
            </button>
            <button
              onClick={() => setShowMenu(true)}
              className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
            >
              <Menu size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            const isWallet = stat.label === 'Bu Ay Kazanç'
            return (
              <div
                key={idx}
                onClick={() => isWallet && navigate('/wallet')}
                className={`bg-white/20 backdrop-blur rounded-2xl p-4 ${isWallet ? 'cursor-pointer hover:bg-white/30 transition' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 bg-${stat.color}-500/30 rounded-lg flex items-center justify-center`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="text-2xl font-black text-white">{stat.value}</span>
                </div>
                <p className="text-white/80 text-xs font-medium">{stat.label}</p>
                {isWallet && (
                  <p className="text-white/90 text-xs font-semibold mt-1">→ Cüzdanı Gör</p>
                )}
              </div>
            )
          })}
        </div>
      </div>


      {/* Yeni İş Talepleri */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Yeni İş Talepleri</h2>
          <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
            {jobRequests.length} Yeni
          </span>
        </div>

        <div className="space-y-3">
          {jobRequests.map(job => (
            <div
              key={job.id}
              onClick={() => navigate(`/job/${job.id}`)}
              className="bg-white rounded-2xl p-5 shadow-lg border-l-4 border-green-500 cursor-pointer hover:shadow-xl transition"
            >
              {job.urgent && (
                <div className="inline-block px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold mb-3">
                  🔥 Acil
                </div>
              )}

              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-sm text-gray-600 mb-2">📍 {job.location.address}</p>
                <p className="text-sm text-gray-700">{job.description}</p>
              </div>

              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Müşteri</p>
                  <p className="text-sm font-bold text-gray-900">{job.customer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tarih</p>
                  <p className="text-sm font-bold text-gray-900">{new Date(job.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ücret</p>
                  <p className="text-lg font-black text-green-600">₺{job.price}</p>
                </div>
              </div>

              <div className="text-center text-sm text-blue-600 font-semibold">
                Detayları Görüntüle →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Son Tamamlanan İşler */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Son Tamamlanan İşler</h2>

        <div className="space-y-2">
          <div className="bg-white rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Priz Montajı</p>
              <p className="text-xs text-gray-600">Dün, 15:30 • Kadıköy</p>
            </div>
            <div className="text-right">
              <p className="font-black text-green-600">₺200</p>
              <div className="flex items-center gap-1 text-xs">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold">5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 shadow-xl">
        <div className="flex items-center justify-around">
          <button
            onClick={() => navigate('/professional')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-green-600' : 'text-gray-400'
              }`}
          >
            <Home size={24} />
            <span className="text-xs font-semibold">Ana Sayfa</span>
          </button>
          <button
            onClick={() => navigate('/my-jobs')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'jobs' ? 'text-green-600' : 'text-gray-400'
              }`}
          >
            <Briefcase size={24} />
            <span className="text-xs font-semibold">İşlerim</span>
          </button>
          <button
            onClick={() => navigate('/messages')}
            className={`flex flex-col items-center gap-1 relative ${activeTab === 'messages' ? 'text-green-600' : 'text-gray-400'
              }`}
          >
            <MessageSquare size={24} />
            <span className="text-xs font-semibold">Mesajlar</span>
            <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              8
            </span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-green-600' : 'text-gray-400'
              }`}
          >
            <User size={24} />
            <span className="text-xs font-semibold">Profil</span>
          </button>
        </div>
      </div>
      <HamburgerMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  )
}

export default ProfessionalDashboard
