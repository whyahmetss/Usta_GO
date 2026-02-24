import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { uploadFile, fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, LogOut, Settings, Copy, Share2, Gift, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'

function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null)
  const [uploading, setUploading] = useState(false)
  const [statsData, setStatsData] = useState({
    activeJobs: 0,
    offers: 0,
    completedJobs: 0,
    totalSpent: 0,
    coupons: 0,
    averageRating: '0.0',
    thisMonthEarnings: 0,
    rating: '0.0',
    successRate: 0,
  })

  useEffect(() => {
    setProfilePhoto(user?.profilePhoto || null)
  }, [user])

  useEffect(() => {
    if (!user?.id) return

    const loadStats = async () => {
      // Fetch jobs stats
      try {
        const jobsRes = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
        const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : []

        if (user.role === 'customer') {
          const myJobs = jobs.filter(j => j.customer?.id === user.id || j.customerId === user.id)
          const active = myJobs.filter(j => j.status === 'pending').length
          const completed = myJobs.filter(j => j.status === 'completed' || j.status === 'rated').length
          const totalOffers = myJobs.reduce((sum, j) => sum + (j.offers?.length || 0), 0)
          const ratedJobs = myJobs.filter(j => j.rating?.professionalRating)
          const avgRating = ratedJobs.length > 0
            ? (ratedJobs.reduce((sum, j) => sum + j.rating.professionalRating, 0) / ratedJobs.length).toFixed(1)
            : '0.0'
          setStatsData(prev => ({
            ...prev,
            activeJobs: active,
            completedJobs: completed,
            offers: totalOffers,
            averageRating: avgRating,
          }))
        } else if (user.role === 'professional') {
          const myJobs = jobs.filter(j => j.professional?.id === user.id || j.professionalId === user.id)
          const completed = myJobs.filter(j => j.status === 'completed' || j.status === 'rated').length
          const active = myJobs.filter(j => j.status === 'accepted' || j.status === 'in_progress').length
          const totalJobs = myJobs.length
          const successRate = totalJobs > 0 ? Math.round((completed / totalJobs) * 100) : 0
          const offersGiven = jobs.filter(j =>
            j.offers?.some(o => o.professionalId === user.id || o.professional?.id === user.id)
          ).length
          setStatsData(prev => ({
            ...prev,
            completedJobs: completed,
            activeJobs: active,
            offers: offersGiven,
            successRate,
            rating: user.rating || '0.0',
          }))
        }
      } catch (err) {
        console.error('Stats load error:', err)
      }

      // Fetch wallet stats
      try {
        const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (walletRes.data) {
          setStatsData(prev => ({
            ...prev,
            totalSpent: walletRes.data.totalSpent || 0,
            thisMonthEarnings: walletRes.data.thisMonthEarnings || 0,
            coupons: walletRes.data.coupons?.length ?? prev.coupons,
          }))
        }
      } catch (err) {
        console.error('Wallet stats error:', err)
      }
    }

    loadStats()
  }, [user?.id])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploading(true)
      try {
        const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo')
        const photoUrl = uploadResponse.data?.url
        if (photoUrl) {
          setProfilePhoto(photoUrl)
          alert('Profil fotoğrafı güncellendi!')
        }
      } catch (err) {
        console.error('Photo upload error:', err)
        alert('Fotoğraf yuklemesi basarisiz oldu')
      } finally {
        setUploading(false)
      }
    }
  }

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      logout()
      navigate('/')
    }
  }

  const handleCopyReferral = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(`https://app.ustagochannel.com/?ref=${user.referralCode}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Loyalty calculations
  const loyaltyLevel = statsData.completedJobs >= 20 ? 'Gold' : statsData.completedJobs >= 10 ? 'Silver' : statsData.completedJobs >= 5 ? 'Bronze' : 'Member'
  const nextMilestone = statsData.completedJobs >= 20 ? 20 : statsData.completedJobs >= 10 ? 20 : statsData.completedJobs >= 5 ? 10 : 5
  const loyaltyProgress = Math.min(100, (statsData.completedJobs / nextMilestone) * 100)

  const coupons = user?.coupons || []
  const activeCoupons = coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())

  // Stats card definitions
  const customerCards = [
    { icon: '📋', label: 'Aktif İşler',      value: statsData.activeJobs,    link: '/jobs' },
    { icon: '📝', label: 'Aldığı Teklifler', value: statsData.offers,         link: '/jobs' },
    { icon: '✅', label: 'Tamamlanan',        value: statsData.completedJobs,  link: '/jobs' },
    { icon: '💰', label: 'Toplam Harcama',   value: `${Number(statsData.totalSpent).toLocaleString('tr-TR')} TL`, link: '/wallet' },
    { icon: '🎁', label: 'Kuponlar',          value: statsData.coupons,        link: '/wallet' },
    { icon: '⭐', label: 'Ortalama Puan',     value: statsData.averageRating,  link: '/reviews' },
  ]

  const professionalCards = [
    { icon: '✅', label: 'Tamamlanan İşler',  value: statsData.completedJobs,  link: '/jobs' },
    { icon: '📋', label: 'Aktif İşler',        value: statsData.activeJobs,     link: '/jobs' },
    { icon: '📝', label: 'Verilen Teklifler',  value: statsData.offers,          link: '/jobs' },
    { icon: '💰', label: 'Bu Ay Kazanç',       value: `${Number(statsData.thisMonthEarnings).toLocaleString('tr-TR')} TL`, link: '/wallet' },
    { icon: '⭐', label: 'Ortalama Puan',      value: statsData.rating,          link: '/reviews' },
    { icon: '📈', label: 'Başarı Oranı',       value: `%${statsData.successRate}`, link: '/jobs' },
  ]

  const statCards = user?.role === 'professional' ? professionalCards : customerCards

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-20 pt-4 px-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {/* Avatar with Photo Upload */}
        <div className="text-center">
          <div className="relative mx-auto mb-4 w-fit">
            <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border-4 border-white/30 overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">{user?.avatar || '👤'}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition">
              <Camera size={18} className="text-blue-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">{user?.name}</h1>
          <p className="text-white/80 text-sm">
            {user?.role === 'professional' ? '⚡ Usta' : '👤 Müşteri'}
          </p>
        </div>
      </div>

      <div className="px-4 -mt-12">
        {/* İstatistik Kartları - 2x3 grid */}
        <div className="bg-white rounded-2xl p-5 shadow-lg mb-4">
          <h3 className="font-bold text-gray-900 mb-4">İstatistikler</h3>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card, idx) => (
              <button
                key={idx}
                onClick={() => navigate(card.link)}
                className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 text-left hover:opacity-90 transition active:scale-95"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="text-xl font-black text-white leading-tight">{card.value}</div>
                <div className="text-xs text-white/80 mt-1">{card.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet Button */}
        <button
          onClick={() => navigate('/wallet')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition font-bold mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div className="text-left">
              <p className="font-bold">Cüzdanım</p>
              <p className="text-xs text-white/80">{user?.role === 'professional' ? 'Kazançlarınız' : 'Bakiye ve kuponlar'}</p>
            </div>
          </div>
          <span className="text-xl">→</span>
        </button>

        {/* Loyalty Program (Customers) */}
        {user?.role === 'customer' && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-lg mb-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Sadakat Programı</h3>
              <span className="px-2 py-1 bg-white/20 rounded-lg text-sm font-bold">{loyaltyLevel}</span>
            </div>
            <div className="mb-2">
              <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${loyaltyProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-white/80 mt-1">{statsData.completedJobs} / {nextMilestone} işe kadar ilerleme</p>
            </div>
          </div>
        )}

        {/* Referral Section (Customers) */}
        {user?.role === 'customer' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-lg mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Share2 size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Arkadaş Davet Et</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Arkadaşını davet et, her biriniz ₺50 kupon al</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
                <code className="text-xs text-gray-600 font-mono truncate">{user?.referralCode}</code>
              </div>
              <button
                onClick={handleCopyReferral}
                className="px-3 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition text-sm flex items-center gap-2"
              >
                <Copy size={16} />
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <Gift size={14} className="inline mr-1" />
              <strong>{user?.referralCount || 0}</strong> kişi davet edildi
            </div>
          </div>
        )}

        {/* Active Coupons */}
        {activeCoupons.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 mb-2">Aktif Kuponlar ({activeCoupons.length})</h3>
            <div className="space-y-2">
              {activeCoupons.slice(0, 2).map(coupon => (
                <div key={coupon.id} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{coupon.amount} TL İndirim</p>
                      <p className="text-xs text-gray-500">Süresi: {new Date(coupon.expiresAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <Gift size={20} className="text-purple-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-900">Ayarlar</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg hover:bg-red-600 transition mb-20"
        >
          <LogOut size={20} />
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}

export default ProfilePage
