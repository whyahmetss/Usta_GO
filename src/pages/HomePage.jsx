import { useState, useEffect, useRef } from 'react'
import { Search, Bell, Settings, Zap, Wrench, Hammer, Sparkles, Paintbrush, Axe, X, ArrowRight, ChevronRight, Clock, TrendingUp, Flower, Gift, Heart, Star, PartyPopper, Mic } from 'lucide-react'

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
  const [svcStatus, setSvcStatus] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const unreadNotifs = getUnreadNotificationCount()

  const startVoiceSearch = (e) => {
    e.stopPropagation()
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setShowSearch(true)
      return
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'tr-TR'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition
    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      setSearchQuery(text)
      setShowSearch(true)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }

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

  const loadSvcStatus = async () => {
    try {
      const res = await fetchAPI(API_ENDPOINTS.CONFIG.HOME_SERVICES, { includeAuth: false })
      if (res?.data) setSvcStatus(res.data)
    } catch { /* fallback to defaults */ }
  }

  useEffect(() => { loadCampaign(); loadSvcStatus() }, [])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadCampaign() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const SERVICE_DEFS = [
    { id: 'electric',   name: 'Elektrik', desc: 'Priz, kablo, sigorta tamiri',    Icon: Zap,       gradient: 'from-amber-400 to-orange-500', iconColor: 'text-white', bgColor: 'bg-amber-50', keywords: ['elektrik', 'priz', 'sigorta', 'kablo', 'aydınlatma'],
      subServices: ['Priz/Anahtar değişimi', 'Sigorta tamiri', 'Kablo döşeme', 'Aydınlatma montajı', 'Elektrik tablo tamiri', 'Kısa devre tespiti'] },
    { id: 'plumbing',   name: 'Tesisat',  desc: 'Su kacağı, tıkanıklık, musluk',  Icon: Wrench,    gradient: 'from-blue-400 to-blue-600',    iconColor: 'text-white', bgColor: 'bg-blue-50',  keywords: ['tesisat', 'su', 'kaçak', 'musluk', 'tıkanıklık'],
      subServices: ['Musluk değişimi', 'Musluk tamiri', 'Tıkanıklık açma', 'Su kacağı tamiri', 'Batarya değişimi', 'Tuvalet tamiri', 'Pıs su gideri temizleme'] },
    { id: 'renovation', name: 'Tadilat',  desc: 'Duvar, zemin, kapı tamiri',      Icon: Hammer,    gradient: 'from-orange-400 to-red-500',   iconColor: 'text-white', bgColor: 'bg-orange-50', keywords: ['tadilat', 'duvar', 'zemin', 'kapı', 'pencere'],
      subServices: ['Duvar tamiri', 'Zemin kaplama', 'Kapı değişimi', 'Pencere tamiri', 'Alçıpan işleri', 'Seramik döşeme'] },
    { id: 'cleaning',   name: 'Temizlik', desc: 'Ev, ofis, derin temizlik',       Icon: Sparkles,  gradient: 'from-purple-400 to-purple-600',iconColor: 'text-white', bgColor: 'bg-purple-50', keywords: ['temizlik', 'ev', 'ofis', 'derin'],
      subServices: ['Ev temizliği', 'Ofis temizliği', 'Derin temizlik', 'Inşaat sonrası temizlik', 'Halı yıkama', 'Cam temizliği'] },
    { id: 'painting',   name: 'Boyacı',   desc: 'İç cephe, dış cephe boyama',    Icon: Paintbrush,gradient: 'from-emerald-400 to-green-600',iconColor: 'text-white', bgColor: 'bg-green-50', keywords: ['boya', 'boyacı', 'badana', 'cephe'],
      subServices: ['İç cephe boyama', 'Dış cephe boyama', 'Badana', 'Dekoratif boya', 'Tavan boyama', 'Ahşap boyama'] },
    { id: 'carpentry',  name: 'Marangoz', desc: 'Mobilya, dolap, ahşap işleri',   Icon: Axe,       gradient: 'from-yellow-400 to-amber-600', iconColor: 'text-white', bgColor: 'bg-yellow-50', keywords: ['marangoz', 'mobilya', 'dolap', 'ahşap'],
      subServices: ['Dolap tamiri', 'Mobilya montajı', 'Menteşe değişimi', 'Raf montajı', 'Ahşap kaplama', 'Kapı menteşe tamiri'] },
  ]

  const [expandedService, setExpandedService] = useState(null)

  const FALLBACK_STATUS = { electric: true, plumbing: false, renovation: false, cleaning: false, painting: false, carpentry: false }

  const allServices = SERVICE_DEFS.map(s => ({
    ...s,
    active: svcStatus ? (svcStatus[s.id]?.active ?? false) : FALLBACK_STATUS[s.id],
  }))

  const filteredServices = searchQuery.trim()
    ? allServices.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keywords.some(k => k.includes(searchQuery.toLowerCase())) ||
        s.subServices?.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allServices

  // Autocomplete suggestions from sub-services
  const autocompleteSuggestions = searchQuery.trim().length >= 2
    ? allServices.flatMap(s =>
        (s.subServices || []).filter(sub => sub.toLowerCase().includes(searchQuery.toLowerCase())).map(sub => ({ label: sub, serviceId: s.id, serviceName: s.name })))
    : []

  const popularSearches = ['Priz tamiri', 'Su kacağı', 'Boya badana', 'Kapı tamiri', 'Musluk değişimi', 'Tıkanıklık açma']

  return (
    <div className="bg-[#F5F7FB] dark:bg-[#0d0d0d] min-h-screen">
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
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-none mb-0.5">{greeting}</p>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">{user?.name || 'Müşteri'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] shadow-sm flex items-center justify-center relative"
            >
              <Bell size={18} strokeWidth={1.8} className="text-gray-700 dark:text-gray-300" />
              {unreadNotifs > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] shadow-sm flex items-center justify-center"
            >
              <Settings size={18} strokeWidth={1.8} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] shadow-lg shadow-gray-300/40 dark:shadow-none text-left transition-all hover:shadow-xl hover:shadow-gray-300/50 active:scale-[0.98]"
        >
          <Search size={20} strokeWidth={2} className="text-[#0A66C2] flex-shrink-0" />
          <span className="text-[14px] text-gray-400 flex-1">Ne tamir edilecek? <span className='text-gray-300'>(Örn: Musluk damlatıyor)</span></span>
          <div
            role="button"
            onClick={startVoiceSearch}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              listening ? 'bg-red-500 animate-pulse' : 'bg-[#0A66C2]/10'
            }`}
          >
            <Mic size={16} className={listening ? 'text-white' : 'text-[#0A66C2]'} />
          </div>
        </button>
      </div>

      {/* Campaign Banner */}
      <div className="px-5 mb-5">
        {campaign ? (
          <div
            onClick={() => navigate('/campaign')}
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
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Hizmetler</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {allServices.map(svc => {
            const CatIcon = svc.Icon
            return (
              <button
                key={svc.id}
                onClick={() => svc.active ? navigate('/create-job?service=' + svc.id) : null}
                disabled={!svc.active}
                className={`relative rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition-all duration-200 aspect-square border ${
                  svc.active
                    ? 'bg-white dark:bg-[#141414] border-gray-100 dark:border-[#262626] shadow-lg shadow-gray-200/70 dark:shadow-none active:scale-[0.93] hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-white dark:bg-[#141414] border-gray-200 dark:border-[#262626] shadow-sm opacity-50'
                }`}
              >
                {!svc.active && (
                  <span className="absolute top-1.5 right-1.5 bg-gray-400 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full">
                    Yakında
                  </span>
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                  svc.active ? `bg-gradient-to-br ${svc.gradient} shadow-lg` : 'bg-gray-100 dark:bg-[#1f1f1f]'
                }`}>
                  <CatIcon size={26} className={svc.active ? 'text-white drop-shadow-sm' : 'text-gray-400'} strokeWidth={1.8} />
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
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#0c0c0c]">
          {/* Search Header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-[#262626]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowSearch(false); setSearchQuery('') }}
                className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center flex-shrink-0"
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-80px)] px-5 py-5">
            {/* Autocomplete suggestions */}
            {autocompleteSuggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Öneriler</p>
                <div className="space-y-1">
                  {autocompleteSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowSearch(false)
                        setSearchQuery('')
                        navigate(`/create-job?service=${s.serviceId}&sub=${encodeURIComponent(s.label)}`)
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition text-left"
                    >
                      <Search size={14} className="text-primary-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.label}</p>
                        <p className="text-[10px] text-gray-400">{s.serviceName}</p>
                      </div>
                      <ArrowRight size={14} className="text-primary-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                      className="px-4 py-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl text-[13px] text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 transition"
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

            {searchQuery.trim() && autocompleteSuggestions.length === 0 && (
              <p className="text-xs text-gray-400 mb-3">{filteredServices.length} sonuç</p>
            )}

            {/* Service list with expandable sub-services */}
            <div className="space-y-2">
              {filteredServices.map(svc => {
                const SvcIcon = svc.Icon
                const isExpanded = expandedService === svc.id
                return (
                  <div key={svc.id}>
                    <button
                      onClick={() => {
                        if (!svc.active) return
                        if (svc.subServices?.length) {
                          setExpandedService(isExpanded ? null : svc.id)
                        } else {
                          setShowSearch(false)
                          setSearchQuery('')
                          navigate('/create-job?service=' + svc.id)
                        }
                      }}
                      disabled={!svc.active}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                        svc.active
                          ? 'bg-gray-50 dark:bg-[#141414] hover:bg-gray-100 dark:hover:bg-[#1f1f1f] active:scale-[0.98]'
                          : 'bg-gray-50/50 opacity-40'
                      } ${isExpanded ? 'ring-2 ring-primary-200 dark:ring-primary-800' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${svc.bgColor}`}>
                        <SvcIcon size={22} className={svc.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{svc.name}</h3>
                          {!svc.active && (
                            <span className="bg-gray-200 text-gray-500 text-[9px] font-semibold px-2 py-0.5 rounded-full">Yakında</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{svc.desc}</p>
                        {svc.active && svc.subServices?.length > 0 && (
                          <p className="text-[10px] text-primary-500 font-medium mt-1">{svc.subServices.length} alt hizmet</p>
                        )}
                      </div>
                      {svc.active && (
                        <ChevronRight size={16} className={`text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </button>

                    {/* Sub-services list */}
                    {isExpanded && svc.subServices && (
                      <div className="ml-6 mt-1 mb-2 space-y-1 border-l-2 border-primary-200 dark:border-primary-800 pl-3">
                        {svc.subServices.map(sub => (
                          <button
                            key={sub}
                            onClick={() => {
                              setShowSearch(false)
                              setSearchQuery('')
                              navigate(`/create-job?service=${svc.id}&sub=${encodeURIComponent(sub)}`)
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition active:scale-[0.98]"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                            <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">{sub}</span>
                            <ArrowRight size={12} className="text-gray-300 ml-auto flex-shrink-0" />
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setShowSearch(false)
                            setSearchQuery('')
                            navigate('/create-job?service=' + svc.id)
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left text-[12px] text-primary-500 font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition"
                        >
                          Diğer {svc.name} sorunları →
                        </button>
                      </div>
                    )}
                  </div>
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
