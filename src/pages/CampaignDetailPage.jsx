import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowRight, Clock, Tag, Sparkles, Gift, Zap, Star, Heart, Flower, PartyPopper } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

const CAMPAIGN_ICONS = { flower: Flower, zap: Zap, gift: Gift, sparkles: Sparkles, heart: Heart, star: Star, party: PartyPopper }

function CampaignDetailPage() {
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAPI(API_ENDPOINTS.CAMPAIGNS.ACTIVE, { includeAuth: false })
        if (res.data && res.data.title) setCampaign(res.data)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div>
        <PageHeader title="Kampanya" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div>
        <PageHeader title="Kampanya" />
        <div className="px-4 py-20 text-center">
          <Sparkles size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Aktif kampanya bulunamadı</p>
          <p className="text-xs text-gray-300 mt-1">Yeni kampanyaları takip etmek için bildirimleri açın.</p>
        </div>
      </div>
    )
  }

  const IconComp = campaign.icon_type && CAMPAIGN_ICONS[campaign.icon_type]
  const expiresAt = campaign.expires_at ? new Date(campaign.expires_at) : null
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - new Date()) / 86400000)) : null

  return (
    <div>
      <PageHeader title="Kampanya Detayı" />

      {/* Hero Banner */}
      <div
        className="relative overflow-hidden min-h-[200px]"
        style={{
          backgroundColor: campaign.bg_color || '#111827',
          backgroundImage: campaign.bg_image ? `url(${campaign.bg_image})` : undefined,
          backgroundSize: campaign.bg_image ? 'cover' : undefined,
          backgroundPosition: campaign.bg_image ? 'center' : undefined,
        }}
      >
        {campaign.bg_image && <div className="absolute inset-0 bg-black/50 z-[1]" />}
        <div className="relative z-10 px-5 py-8">
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold mb-3 tracking-wide"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: campaign.badge_color || '#34d399' }}
          >
            {campaign.badge_text || 'KAMPANYA'}
          </span>
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{campaign.title}</h1>
          <p className="text-gray-300 text-sm leading-relaxed">{campaign.description}</p>
        </div>
        {(campaign.icon_image || IconComp) && (
          <div className="absolute right-4 bottom-4 opacity-15 z-[2]">
            {campaign.icon_image ? (
              <img src={campaign.icon_image} alt="" className="w-24 h-24 object-contain" />
            ) : IconComp ? (
              <IconComp size={96} className="text-white" strokeWidth={1} />
            ) : null}
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Campaign Details */}
        {daysLeft !== null && (
          <Card className="flex items-center gap-3 !p-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                {daysLeft === 0 ? 'Son gün!' : `${daysLeft} gün kaldı`}
              </p>
              <p className="text-[10px] text-gray-400">
                {expiresAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihine kadar geçerli
              </p>
            </div>
            {daysLeft <= 3 && (
              <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full animate-pulse">
                Acele Et!
              </span>
            )}
          </Card>
        )}

        {/* Terms */}
        {campaign.terms && (
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Kampanya Koşulları</h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
              {campaign.terms}
            </div>
          </Card>
        )}

        {/* Discount Info */}
        {(campaign.discount_amount || campaign.discount_percent) && (
          <Card className="!bg-gradient-to-r from-emerald-500 to-teal-500 !border-0 text-white !p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider mb-1">İndirim</p>
                <p className="text-3xl font-black">
                  {campaign.discount_percent ? `%${campaign.discount_percent}` : `${campaign.discount_amount} TL`}
                </p>
              </div>
              <Tag size={40} className="text-white/20" />
            </div>
            {campaign.min_order && (
              <p className="text-[11px] text-white/60 mt-2">Min. sipariş: {campaign.min_order} TL</p>
            )}
          </Card>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate('/create-job')}
          className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
        >
          {campaign.button_text || 'Hemen Hizmet Al'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default CampaignDetailPage
