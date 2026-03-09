import { useState, useEffect } from 'react'
import { Search, Bell, Settings, Zap, Wrench, Hammer, Sparkles, Paintbrush, Axe, X, ArrowRight, Clock, TrendingUp, Flower, Gift, Heart, Star, PartyPopper } from 'lucide-react'

const CAMPAIGN_ICONS = { flower: Flower, zap: Zap, gift: Gift, sparkles: Sparkles, heart: Heart, star: Star, party: PartyPopper }
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import Logo from '../components/Logo'

function HomePage() {
  const { user, getUnreadNotificationCount } = useAuth()
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [campaign, setCampaign] = useState(null)
  const [campaignLoading, setCampaignLoading] = useState(true)

  const unreadNotifs = getUnreadNotificationCount()

  const greeting = (() => {
    const h = parseInt(new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false }).format(new Date()), 10)
    if (h >= 5 && h < 12) return 'Günaydın'
    if (h >= 12 && h < 18) return 'Tünaydın'
    if (h >= 18 && h < 22) return 'İyi Akşamlar'
    return 'İyi Geceler'
  })()

  const loadCampaign = async () => {
    try {
      setCampaignLoading(true)
      const res = await fetchAPI(API_ENDPOINTS.CAMPAIGNS.ACTIVE + '?t=' + Date.now(), { includeAuth: false })
      if (res.data && res.data.title) setCampaign(res.data)
      else setCampaign(null)
    } catch { setCampaign(null) }
    finally { setCampaignLoading(false) }
  }

  useEffect(() => { loadCampaign() }, [])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadCampaign() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const allServices = [
    { id: 'electric', name: 'Elektrik', desc: 'Priz, kablo, sigorta tamiri', Icon: Zap, active: true, bgColor: 'bg-amber-50', iconColor: 'text-amber-600', keywords: ['elektrik', 'priz', 'sigorta', 'kablo', 'aydınlatma'] },
    { id: 'plumbing', name: 'Tesisat', desc: 'Su kaçağı, tıkanıklık, musluk', Icon: Wrench, active: false, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', keywords: ['tesisat', 'su', 'kaçak', 'musluk', 'tıkanıklık'] },
    { id: 'renovation', name: 'Tadilat', desc: 'Duvar, zemin, kapı tamiri', Icon: Hammer, active: false, bgColor: 'bg-orange-50', iconColor: 'text-orange-600', keywords: ['tadilat', 'duvar', 'zemin', 'kapı', 'pencere'] },
    { id: 'cleaning', name: 'Temizlik', desc: 'Ev, ofis, derin temizlik', Icon: Sparkles, active: false, bgColor: 'bg-purple-50', iconColor: 'text-purple-600', keywords: ['temizlik', 'ev', 'ofis', 'derin'] },
    { id: 'painting', name: 'Boyacı', desc: 'İç cephe, dış cephe boyama', Icon: Paintbrush, active: false, bgColor: 'bg-green-50', iconColor: 'text-green-600', keywords: ['boya', 'boyacı', 'badana', 'cephe'] },
    { id: 'carpentry', name: 'Marangoz', desc: 'Mobilya, dolap, ahşap işleri', Icon: Axe, active: false, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-700', keywords: ['marangoz', 'mobilya', 'dolap', 'ahşap'] },
  ]

  const filteredServices = searchQuery.trim()
    ? allServices.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keywords.some(k => k.includes(searchQuery.toLowerCase()))
      )
    : allServices

  const popularSearches = ['Priz tamiri', 'Su kaçağı', 'Boya badana', 'Kapı tamiri']

  return (
    <div className="bg-[#F5F7FB] dark:bg-[#0F172A] min-h-screen">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <Logo size="xs" />
              )}
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium leading-none mb-0.5">{greeting}</p>
              <h1 className="text-[15px] font-semibold text-gray-900 leading-tight">{user?.name || 'Müşteri'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center relative"
            >
              <Bell size={18} strokeWidth={1.8} className="text-gray-700" />
              {unreadNotifs > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"
            >
              <Settings size={18} strokeWidth={1.8} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] shadow-sm text-left"
        >
          <Search size={17} strokeWidth={1.8} className="text-primary-400 flex-shrink-0" />
          <span className="text-[13px] text-gray-400">Hangi hizmete ihtiyacınız var?</span>
        </button>
      </div>

      {/* Campaign Banner */}
      <div className="px-5 mb-5">
        {campaign ? (
          <div
            onClick={() => navigate('/create-job')}
            className="rounded-3xl p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform min-h-[140px]"
            style={{
              backgroundColor: campaign.bg_color || '#111827',
              backgroundImage: campaign.bg_image ? `url(${campaign.bg_image})` : undefined,
              backgroundSize: campaign.bg_image ? 'cover' : undefined,
              backgroundPosition: campaign.bg_image ? 'center' : undefined,
            }}
          >
            {campaign.bg_image && <div className="absolute inset-0 bg-black/40 z-[1]" />}
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold mb-3 tracking-wide"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: campaign.badge_color || '#34d399' }}>
                {campaign.badge_text || 'KAMPANYA'}
              </span>
              <h2 className="text-lg font-bold text-white mb-1 leading-snug">{campaign.title}</h2>
              <p className="text-gray-400 text-[13px] mb-4">{campaign.description}</p>
              {campaign.button_text && (
                <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-[13px] font-semibold">
                  {campaign.button_text}
                </span>
              )}
            </div>
            {(campaign.icon_type || campaign.icon_image) && (() => {
              const IconComp = campaign.icon_type && CAMPAIGN_ICONS[campaign.icon_type]
              return (
                <div className="absolute right-4 bottom-4 top-4 flex items-center justify-center opacity-20 z-[2]">
                  {campaign.icon_image ? (
                    <img src={campaign.icon_image} alt="" className="w-20 h-20 object-contain" />
                  ) : IconComp ? (
                    <IconComp size={80} className="text-white" strokeWidth={1.5} />
                  ) : null}
                </div>
              )
            })()}
          </div>
        ) : !campaignLoading && (
          <div
            onClick={() => navigate('/create-job')}
            className="rounded-3xl p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform min-h-[150px]"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 60%, #0c4a6e 100%)' }}
          >
            {/* decorative circles */}
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -right-2 top-12 w-20 h-20 rounded-full bg-white/5" />
            <div className="absolute right-8 bottom-3 opacity-[0.12]">
              <Zap size={72} className="text-white" />
            </div>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white mb-3 tracking-wide">
                ✨ HOŞ GELDİN FIRSATI
              </span>
              <h2 className="text-xl font-bold text-white mb-1.5 leading-snug">İlk Siparişe <br />%20 İndirim!</h2>
              <p className="text-blue-100 text-[13px] mb-4">Profesyonel ustaları hemen keşfet</p>
              <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-primary-700 rounded-xl text-[13px] font-bold shadow-md">
                Hemen Başla →
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Hizmetler</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {allServices.map(svc => {
            const CatIcon = svc.Icon
            return (
              <button
                key={svc.id}
                onClick={() => svc.active ? navigate('/create-job') : null}
                disabled={!svc.active}
                className={`relative rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition-all aspect-square border shadow-sm ${
                  svc.active
                    ? 'bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] active:scale-95'
                    : 'bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] opacity-50'
                }`}
              >
                {!svc.active && (
                  <span className="absolute top-1.5 right-1.5 bg-gray-400 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full">
                    Yakında
                  </span>
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${svc.active ? svc.bgColor : 'bg-gray-100 dark:bg-[#1f1f1f]'}`}>
                  <CatIcon size={24} className={svc.active ? svc.iconColor : 'text-gray-400'} strokeWidth={1.8} />
                </div>
                <span className={`text-[12px] font-semibold ${svc.active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>
                  {svc.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-[60] bg-[#F5F7FB] dark:bg-[#0F172A]">
          {/* Search Header */}
          <div className="px-4 pt-4 pb-3 border-b border-[#E5E7EB] dark:border-[#334155]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowSearch(false); setSearchQuery('') }}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center flex-shrink-0"
              >
                <X size={20} className="text-gray-600" />
              </button>
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sorununu yaz veya hizmet ara..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] text-sm text-[#111827] dark:text-[#F1F5F9] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-80px)] px-5 py-5">
            {/* Popular searches */}
            {!searchQuery.trim() && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-gray-400" />
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Popüler Aramalar</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map(q => (
                    <button
                      key={q}
                      onClick={() => setSearchQuery(q)}
                      className="px-4 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-[13px] text-[#6B7280] dark:text-[#94A3B8] font-medium hover:bg-[#F5F7FB] dark:hover:bg-[#273548] transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent label */}
            {!searchQuery.trim() && (
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-gray-400" />
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tüm Hizmetler</h4>
              </div>
            )}

            {searchQuery.trim() && (
              <p className="text-xs text-gray-400 mb-3">{filteredServices.length} sonuç</p>
            )}

            {/* Service list */}
            <div className="space-y-2">
              {filteredServices.map(svc => {
                const SvcIcon = svc.Icon
                return (
                  <button
                    key={svc.id}
                    onClick={() => {
                      if (svc.active) {
                        setShowSearch(false)
                        setSearchQuery('')
                        navigate('/create-job')
                      }
                    }}
                    disabled={!svc.active}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border ${
                      svc.active
                        ? 'bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F5F7FB] dark:hover:bg-[#273548] active:scale-[0.98]'
                        : 'bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] opacity-40'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${svc.bgColor}`}>
                      <SvcIcon size={22} className={svc.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{svc.name}</h3>
                        {!svc.active && (
                          <span className="bg-gray-200 text-gray-500 text-[9px] font-semibold px-2 py-0.5 rounded-full">Yakında</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{svc.desc}</p>
                    </div>
                    {svc.active && <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />}
                  </button>
                )
              })}

              {filteredServices.length === 0 && searchQuery.trim() && (
                <div className="text-center py-12">
                  <Search size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium mb-1">Sonuç bulunamadı</p>
                  <p className="text-xs text-gray-300">Farklı bir arama deneyin</p>
                </div>
              )}
            </div>

            {/* Direct create button */}
            <div className="mt-6 pb-6">
              <button
                onClick={() => { setShowSearch(false); navigate('/create-job') }}
                className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <Zap size={18} />
                Direkt İş Talebi Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
