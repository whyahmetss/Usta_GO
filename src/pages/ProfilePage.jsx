import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { uploadFile, fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, LogOut, Copy, Share2, Gift, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'
import { mapJobsFromBackend } from '../utils/fieldMapper'

function ProfilePage() {
  const { user, logout, setUser } = useAuth()
  const navigate = useNavigate()

  // --- DURUM DEĞİŞKENLERİ ---
  const [customerCompletedJobs, setCustomerCompletedJobs] = useState(0)
  const [statsData, setStatsData] = useState({
    activeJobs: 0,
    offers: 0,
    completedJobs: 0,
    totalSpent: 0,
    coupons: 0,
    averageRating: 0,
    thisMonthEarnings: 0,
    rating: 0,
    successRate: 0
  })
  const [activePackage, setActivePackage] = useState(null)
  const [profilePhoto, setProfilePhoto] = useState(user?.profileImage || null)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)

  // --- VERİ ÇEKME (Wallet Mantığı) ---
  const fetchStats = async () => {
    try {
      if (!user?.id) return
      const jobsResponse = await fetchAPI(`${API_ENDPOINTS.JOBS.MY_JOBS}?limit=500`)

      if (jobsResponse.data && Array.isArray(jobsResponse.data)) {
        const mapped = mapJobsFromBackend(jobsResponse.data)

        if (user?.role === 'customer') {
         const userJobs = mapped
          const completedCount = userJobs.filter(j => j.status === 'completed' || j.status === 'rated').length
          const activeCount = userJobs.filter(j => j.status === 'pending' || j.status === 'in_progress').length
          const totalSpent = userJobs
            .filter(j => j.status === 'completed' || j.status === 'rated')
            .reduce((sum, j) => sum + (Number(j.budget) || 0), 0)
          const ratings = userJobs.filter(j => j.rating).map(j => j.rating)
          const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1) : 0

          // Kupon ve aktif paket verilerini API'den çek
          let couponCount = 0
          try {
            const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET)
            couponCount = (walletRes?.data?.coupons || []).length
          } catch { /* kupon 0 kalır */ }

          try {
            const pkgRes = await fetchAPI(API_ENDPOINTS.PACKAGES.MY)
            setActivePackage(pkgRes?.data || null)
          } catch { /* paket yok */ }

          setCustomerCompletedJobs(completedCount)
          setStatsData({
            activeJobs: activeCount,
            offers: 0,
            completedJobs: completedCount,
            totalSpent,
            coupons: couponCount,
            averageRating: avgRating,
            thisMonthEarnings: 0,
            rating: 0,
            successRate: 0
          })
        } else {
          // Professional
         const userJobs = mapped
          const completedCount = userJobs.filter(j => j.status === 'completed' || j.status === 'rated').length
          const activeCount = userJobs.filter(j => j.status === 'in_progress' || j.status === 'pending').length
          const offersCount = userJobs.filter(j => j.professional?.id === user?.id).length
          const ratings = userJobs.filter(j => j.rating).map(j => j.rating)
          const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1) : 0
          const successRate = userJobs.length > 0 ? Math.round((completedCount / userJobs.length) * 100) : 0

          // Calculate this month earnings
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          const thisMonthJobs = userJobs.filter(j => {
            const completedDate = j.completedAt ? new Date(j.completedAt) : null
            return completedDate && completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear
          })
          const thisMonthEarnings = thisMonthJobs.reduce((sum, j) => sum + (j.budget || 0), 0)

          setCustomerCompletedJobs(completedCount)
          setStatsData({
            activeJobs: activeCount,
            offers: offersCount,
            completedJobs: completedCount,
            totalSpent: 0,
            coupons: 0,
            averageRating: avgRating,
            thisMonthEarnings: thisMonthEarnings,
            rating: avgRating,
            successRate: successRate
          })
        }
      }
    } catch (err) {
      console.error('İstatistik yüklenirken hata:', err)
    }
  }

  // --- YÜKLEME VE FOTOĞRAF AYARLARI ---
  useEffect(() => {
    if (user?.id) {
      fetchStats()
      setProfilePhoto(user?.profileImage || null)
    }
  }, [user])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploading(true)
      try {
        const uploadResponse = await uploadFile('/upload/photo', file, 'photo')
        const photoUrl = uploadResponse.data?.url || uploadResponse.url || uploadResponse.data
        if (photoUrl) {
          // Save photo URL to user profile in DB
          await fetchAPI(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
            method: 'PUT',
            body: { profileImage: photoUrl }
          })
          setProfilePhoto(photoUrl)
          setUser(prev => ({ ...prev, profileImage: photoUrl }))
          alert('Profil fotoğrafı güncellendi!')
        }
      } catch (err) {
        console.error('Yükleme hatası:', err)
        alert('Fotoğraf yüklenirken hata oluştu')
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
    const codeToCopy = user?.referralCode || '';
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // --- HESAPLAMALAR ---
 // Sadakat seviyeleri hesaplaması (Türkçeleştirilmiş)
  const loyaltyLevel = customerCompletedJobs >= 20 ? 'Efsane' : 
                       customerCompletedJobs >= 10 ? 'Usta Müşteri' : 
                       customerCompletedJobs >= 5 ? 'Sadık Üye' : 'Yeni Üye';

  // Bir sonraki seviye hedefi
  const nextMilestone = customerCompletedJobs >= 20 ? 20 : 
                        customerCompletedJobs >= 10 ? 20 : 
                        customerCompletedJobs >= 5 ? 10 : 5;

  // İlerleme çubuğu yüzdesi
  const loyaltyProgress = Math.min(100, (customerCompletedJobs / nextMilestone) * 100);

  // Aktif kupon filtresi
  const activeCoupons = (user?.coupons || []).filter(c => !c.used && new Date(c.expiresAt) > new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-20 pt-4 px-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6">
          <ArrowLeft size={20} className="text-white" />
        </button>
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
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">{user?.name}</h1>
          <p className="text-white/80 text-sm">{user?.role === 'professional' ? '⚡ Usta' : '👤 Müşteri'}</p>
        </div>
      </div>

      <div className="px-4 -mt-12">
        {/* Cüzdan Butonu */}
        <button onClick={() => navigate('/wallet')} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition font-bold mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div className="text-left">
              <p className="font-bold">Cüzdanım</p>
              <p className="text-xs text-white/80">Bakiye ve kuponlar</p>
            </div>
          </div>
          <span className="text-xl">→</span>
        </button>

        {/* İstatistik Kartları */}
        {user?.role === 'customer' && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-xs text-white/80">Aktif İşler</p>
              <p className="text-2xl font-black">{statsData.activeJobs}</p>
            </div>
            <div
              onClick={() => navigate('/wallet')}
              className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white cursor-pointer active:scale-95"
            >
              <div className="text-2xl mb-2">📦</div>
              <p className="text-xs text-white/80">Aktif Paketim</p>
              <p className="text-lg font-black leading-tight">
                {activePackage ? activePackage.packageName : 'Yok'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-xs text-white/80">Tamamlanan</p>
              <p className="text-2xl font-black">{statsData.completedJobs}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-xs text-white/80">Toplam Harcama</p>
              <p className="text-lg font-black">{Number(statsData.totalSpent).toLocaleString('tr-TR')} TL</p>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">🎁</div>
              <p className="text-xs text-white/80">Kuponlar</p>
              <p className="text-2xl font-black">{statsData.coupons}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-xs text-white/80">Ortalama Puan</p>
              <p className="text-2xl font-black">{statsData.averageRating}</p>
            </div>
          </div>
        )}

       { (user?.role?.toLowerCase() === 'professional' || user?.role?.toUpperCase() === 'USTA') && (
  <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-xs text-white/80">Tamamlanan</p>
              <p className="text-2xl font-black">{statsData.completedJobs}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-xs text-white/80">Aktif İşler</p>
              <p className="text-2xl font-black">{statsData.activeJobs}</p>
              </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-xs text-white/80">Verilen Teklifler</p>
              <p className="text-2xl font-black">{statsData.offers}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-xs text-white/80">Bu Ay Kazanç</p>
              <p className="text-lg font-black">{Number(statsData.thisMonthEarnings).toLocaleString('tr-TR')} TL</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-xs text-white/80">Ortalama Puan</p>
              <p className="text-2xl font-black">{statsData.rating}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-white">
              <div className="text-2xl mb-2">📈</div>
              <p className="text-xs text-white/80">Başarı Oranı</p>
              <p className="text-2xl font-black">%{statsData.successRate}</p>
            </div>
          </div>
        )}

        {/* Sadakat Programı */}
        {user?.role === 'customer' && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-lg mb-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Sadakat Programı</h3>
              <span className="px-2 py-1 bg-white/20 rounded-lg text-sm font-bold">{loyaltyLevel}</span>
            </div>
            <div className="mb-2">
              <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-300" style={{ width: `${loyaltyProgress}%` }}></div>
              </div>
              <p className="text-xs text-white/80 mt-1">{customerCompletedJobs} / {nextMilestone} işe kadar ilerleme</p>
            </div>
          </div>
        )}

        {/* Referral Section (Düzeltilmiş Halı) */}
        {user?.role === 'customer' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-lg mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Share2 size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Arkadaş Davet Et</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Arkadaşına davet kodunu ver, her ikiniz de <strong>50 TL</strong> bakiye kazanın!</p>

            <div className="flex gap-2 mb-2">
              <div className="flex-1 flex items-center bg-white border-2 border-blue-200 rounded-xl px-3 py-2">
                <code className="text-sm text-blue-700 font-black font-mono tracking-wider">
                  {user?.referralCode || 'Yükleniyor...'}
                </code>
              </div>
              <button
                onClick={handleCopyReferral}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition text-sm flex items-center gap-2"
              >
                <Copy size={16} />
                {copied ? '✓ Kopyalandı!' : 'Kopyala'}
              </button>
            </div>
            <p className="text-xs text-gray-500">Arkadaşın kayıt olurken bu kodu girsin → ikinize de 50 TL yüklenir</p>
          </div>
        )}

        {/* Çıkış Yap */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg hover:bg-red-600 transition mb-20">
          <LogOut size={20} /> Çıkış Yap
        </button>
      </div>
    </div>
  )
}

export default ProfilePage
