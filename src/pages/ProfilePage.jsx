import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { uploadFile, fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { LogOut, Copy, Share2, Camera, Star, Wallet, ChevronRight, Briefcase, CheckCircle, TrendingUp, Award, Tag, DollarSign, User, Headphones } from 'lucide-react'
import { useState, useEffect } from 'react'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import ImageCropper from '../components/ImageCropper'

function ProfilePage() {
  const { user, logout, setUser } = useAuth()
  const navigate = useNavigate()

  const [customerCompletedJobs, setCustomerCompletedJobs] = useState(0)
  const [statsData, setStatsData] = useState({
    activeJobs: 0, offers: 0, completedJobs: 0, totalSpent: 0,
    coupons: 0, averageRating: 0, thisMonthEarnings: 0, rating: 0, successRate: 0
  })
  const [activePackage, setActivePackage] = useState(null)
  const [profilePhoto, setProfilePhoto] = useState(user?.profileImage || null)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ustaReviews, setUstaReviews] = useState([])
  const [cropperSrc, setCropperSrc] = useState(null)

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
          const totalSpent = userJobs.filter(j => j.status === 'completed' || j.status === 'rated').reduce((sum, j) => sum + (Number(j.budget) || 0), 0)
          const ratings = userJobs.filter(j => j.rating).map(j => j.rating)
          const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1) : 0
          let couponCount = 0
          try { const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET); couponCount = (walletRes?.data?.coupons || []).length } catch {}
          try { const pkgRes = await fetchAPI(API_ENDPOINTS.PACKAGES.MY); setActivePackage(pkgRes?.data || null) } catch {}
          setCustomerCompletedJobs(completedCount)
          setStatsData({ activeJobs: activeCount, offers: 0, completedJobs: completedCount, totalSpent, coupons: couponCount, averageRating: avgRating, thisMonthEarnings: 0, rating: 0, successRate: 0 })
        } else {
          const userJobs = mapped
          const completedCount = userJobs.filter(j => j.status === 'completed' || j.status === 'rated').length
          // Usta için aktif işler: pending, accepted ve in_progress durumları
          const activeCount = userJobs.filter(j =>
            j.status === 'pending' ||
            j.status === 'accepted' ||
            j.status === 'in_progress'
          ).length
          const offersCount = userJobs.filter(j => j.professional?.id === user?.id).length
          const ratings = userJobs.filter(j => j.rating).map(j => j.rating)
          const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1) : 0
          const successRate = userJobs.length > 0 ? Math.round((completedCount / userJobs.length) * 100) : 0
          const now = new Date()
          const thisMonthJobs = userJobs.filter(j => {
            const d = j.completedAt ? new Date(j.completedAt) : null
            return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })
          const thisMonthEarnings = thisMonthJobs.reduce((sum, j) => sum + (j.budget || 0), 0)
          setCustomerCompletedJobs(completedCount)
          setStatsData({ activeJobs: activeCount, offers: offersCount, completedJobs: completedCount, totalSpent: 0, coupons: 0, averageRating: avgRating, thisMonthEarnings, rating: avgRating, successRate })
          const ratedJobs = userJobs.filter(j => (j.rating || j.ratingReview) && (j.professional?.id === user?.id || j.professionalId === user?.id))
          setUstaReviews(ratedJobs)
        }
      }
    } catch (err) { console.error('İstatistik yüklenirken hata:', err) }
  }

  useEffect(() => {
    if (user?.id) { fetchStats(); setProfilePhoto(user?.profileImage || null) }
  }, [user])

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropperSrc(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCroppedPhoto = async (blob) => {
    setCropperSrc(null)
    setUploading(true)
    try {
      const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' })
      const uploadResponse = await uploadFile('/upload/photo', file, 'photo')
      const photoUrl = uploadResponse.data?.url || uploadResponse.url || uploadResponse.data
      if (photoUrl) {
        await fetchAPI(API_ENDPOINTS.AUTH.UPDATE_PROFILE, { method: 'PUT', body: { profileImage: photoUrl } })
        setProfilePhoto(photoUrl)
        setUser(prev => ({ ...prev, profileImage: photoUrl }))
      }
    } catch (err) { console.error('Yukleme hatasi:', err); alert('Fotograf yuklenirken hata olustu') }
    finally { setUploading(false) }
  }

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) { logout(); navigate('/') }
  }

  const handleCopyReferral = () => {
    const codeToCopy = user?.referralCode || ''
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const loyaltyLevel = customerCompletedJobs >= 20 ? 'Efsane' : customerCompletedJobs >= 10 ? 'Usta Müşteri' : customerCompletedJobs >= 5 ? 'Sadık Üye' : 'Yeni Üye'
  const nextMilestone = customerCompletedJobs >= 20 ? 20 : customerCompletedJobs >= 10 ? 20 : customerCompletedJobs >= 5 ? 10 : 5
  const loyaltyProgress = Math.min(100, (customerCompletedJobs / nextMilestone) * 100)

  const isPro = user?.role?.toLowerCase() === 'professional' || user?.role?.toUpperCase() === 'USTA'

  return (
    <div>
      <PageHeader title="Profil" onBack={false} />

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-4 pb-6 px-4">
        <div className="relative mb-3">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-card">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-gray-400" />
            )}
          </div>
          <label className={`absolute bottom-0 right-0 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:bg-primary-600 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading
              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Camera size={14} className="text-white" />
            }
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" disabled={uploading} />
          </label>
        </div>
        <h1 className="text-lg font-bold text-gray-900">{user?.name}</h1>
        <span className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-3 py-1 rounded-full ${isPro ? 'bg-accent-50 text-accent-600' : 'bg-primary-50 text-primary-600'}`}>
          {isPro ? 'Usta' : 'Müşteri'}
        </span>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Wallet Button */}
        <Card onClick={() => navigate('/wallet')} className="flex items-center gap-3 !p-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Wallet size={20} className="text-primary-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Cüzdanım</p>
            <p className="text-xs text-gray-400">Bakiye ve kuponlar</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </Card>

        {/* Stats */}
        {user?.role === 'customer' && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Briefcase} label="Aktif İşler" value={statsData.activeJobs} color="primary" />
            <StatCard icon={Award} label="Aktif Paket" value={activePackage ? activePackage.packageName : '—'} color="violet" onClick={() => navigate('/wallet')} />
            <StatCard icon={CheckCircle} label="Tamamlanan" value={statsData.completedJobs} color="emerald" />
            <StatCard icon={DollarSign} label="Toplam Harcama" value={`${Number(statsData.totalSpent).toLocaleString('tr-TR')} TL`} color="amber" />
            <StatCard icon={Tag} label="Kuponlar" value={statsData.coupons} color="rose" />
            <StatCard icon={Star} label="Ortalama Puan" value={statsData.averageRating || '—'} color="amber" />
          </div>
        )}

        {isPro && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={CheckCircle} label="Tamamlanan" value={statsData.completedJobs} color="emerald" />
            <StatCard icon={Briefcase} label="Aktif İşler" value={statsData.activeJobs} color="primary" />
            <StatCard icon={TrendingUp} label="Verilen Teklifler" value={statsData.offers} color="violet" />
            <StatCard icon={DollarSign} label="Bu Ay Kazanç" value={`${Number(statsData.thisMonthEarnings).toLocaleString('tr-TR')} TL`} color="amber" />
            <StatCard icon={Star} label="Ortalama Puan" value={statsData.rating || '—'} color="amber" />
            <StatCard icon={TrendingUp} label="Başarı Oranı" value={`%${statsData.successRate}`} color="accent" />
          </div>
        )}

        {/* Reviews */}
        {isPro && ustaReviews.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              Değerlendirmeler
            </h3>
            <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-hide">
              {ustaReviews.map((j, idx) => (
                <div key={j.id || idx} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">{j.title || 'İş'}</span>
                    <span className="flex items-center gap-0.5 text-amber-400">
                      {[1,2,3,4,5].map(n => <Star key={n} size={11} fill={n <= (j.rating || 0) ? 'currentColor' : 'none'} />)}
                    </span>
                  </div>
                  {(j.ratingReview || j.review) && <p className="text-xs text-gray-500">{j.ratingReview || j.review}</p>}
                  <p className="text-[10px] text-gray-300 mt-1">{j.completedAt ? new Date(j.completedAt).toLocaleDateString('tr-TR') : ''}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Loyalty */}
        {user?.role === 'customer' && (
          <Card className="!bg-gradient-to-br from-violet-500 to-pink-500 !border-0 text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Sadakat Programı</h3>
              <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-semibold">{loyaltyLevel}</span>
            </div>
            <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${loyaltyProgress}%` }} />
            </div>
            <p className="text-[11px] text-white/70">{customerCompletedJobs} / {nextMilestone} iş tamamlandı</p>
          </Card>
        )}

        {/* Referral */}
        {user?.role === 'customer' && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Share2 size={16} className="text-primary-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Arkadaş Davet Et</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Arkadaşına davet kodunu ver, her ikiniz de <strong>50 TL</strong> bakiye kazanın!</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <code className="text-sm text-gray-900 font-bold font-mono tracking-wider">
                  {user?.referralCode || 'Yükleniyor...'}
                </code>
              </div>
              <button
                onClick={handleCopyReferral}
                className="px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition text-sm flex items-center gap-1.5"
              >
                <Copy size={14} />
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
          </Card>
        )}

        {/* Canlı Destek */}
        <button
          onClick={() => navigate('/live-support')}
          className="w-full flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl font-semibold hover:bg-blue-100 transition text-sm border border-blue-100 dark:border-blue-500/20"
        >
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Headphones size={16} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">Canlı Destek</p>
            <p className="text-[11px] text-blue-400 font-normal">Destek ekibiyle sohbet et</p>
          </div>
          <ChevronRight size={16} className="text-blue-400" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3.5 bg-rose-50 text-rose-600 rounded-2xl font-semibold hover:bg-rose-100 transition text-sm border border-rose-100"
        >
          <LogOut size={18} /> Çıkış Yap
        </button>
      </div>

      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCropDone={handleCroppedPhoto}
          onCancel={() => setCropperSrc(null)}
        />
      )}
    </div>
  )
}

export default ProfilePage
