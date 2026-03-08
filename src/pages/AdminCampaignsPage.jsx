import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Eye, Trash2, Palette, Loader2, Image, Flower, Zap, Gift, Sparkles, Heart, Star, PartyPopper } from 'lucide-react'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'

const ICON_OPTIONS = [
  { value: '', label: 'Yok' },
  { value: 'flower', label: 'Cicek (Kadinlar Gunu)', Icon: Flower },
  { value: 'zap', label: 'Yildirim', Icon: Zap },
  { value: 'gift', label: 'Hediye', Icon: Gift },
  { value: 'sparkles', label: 'Parlak', Icon: Sparkles },
  { value: 'heart', label: 'Kalp', Icon: Heart },
  { value: 'star', label: 'Yildiz', Icon: Star },
  { value: 'party', label: 'Parti', Icon: PartyPopper },
]
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

const presetThemes = [
  { name: 'Koyu', bg_color: '#111827', badge_color: '#34d399', text_color: '#ffffff' },
  { name: 'Kirmizi', bg_color: '#7f1d1d', badge_color: '#fca5a5', text_color: '#ffffff' },
  { name: 'Mavi', bg_color: '#1e3a5f', badge_color: '#93c5fd', text_color: '#ffffff' },
  { name: 'Mor', bg_color: '#4c1d95', badge_color: '#c4b5fd', text_color: '#ffffff' },
  { name: 'Yesil', bg_color: '#064e3b', badge_color: '#6ee7b7', text_color: '#ffffff' },
  { name: 'Turuncu', bg_color: '#7c2d12', badge_color: '#fdba74', text_color: '#ffffff' },
]

const emptyCampaign = {
  title: '',
  description: '',
  badge_text: '',
  button_text: 'Hemen Basla',
  bg_color: '#111827',
  badge_color: '#34d399',
  text_color: '#ffffff',
  bg_image: '',
  icon_type: '',
  icon_image: '',
}

function AdminCampaignsPage() {
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState({ ...emptyCampaign })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState(null)
  const [hasExisting, setHasExisting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)

  const handleUploadBg = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBg(true)
    try {
      const res = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo')
      const url = res.data?.url || res.url || res.data
      if (url) setCampaign(p => ({ ...p, bg_image: url }))
    } catch (err) { alert('Yukleme hatasi: ' + (err.message || 'Bilinmeyen')) }
    finally { setUploadingBg(false); e.target.value = '' }
  }

  const handleUploadIcon = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIcon(true)
    try {
      const res = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo')
      const url = res.data?.url || res.url || res.data
      if (url) setCampaign(p => ({ ...p, icon_image: url, icon_type: '' }))
    } catch (err) { alert('Yukleme hatasi: ' + (err.message || 'Bilinmeyen')) }
    finally { setUploadingIcon(false); e.target.value = '' }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAPI(API_ENDPOINTS.CAMPAIGNS.ACTIVE, { includeAuth: false })
        if (res.data && res.data.title) {
          setCampaign({
            ...emptyCampaign,
            ...res.data,
            bg_image: res.data.bg_image || '',
            icon_type: res.data.icon_type || '',
            icon_image: res.data.icon_image || '',
          })
          setHasExisting(true)
        }
      } catch { /* no campaign */ }
      finally { setLoadingExisting(false) }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!campaign.title.trim()) {
      setMsg({ ok: false, text: 'Kampanya basligi zorunludur' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      await fetchAPI(API_ENDPOINTS.CAMPAIGNS.SET, {
        method: 'POST',
        body: {
          ...campaign,
          bg_image: campaign.bg_image || null,
          icon_type: campaign.icon_type || null,
          icon_image: campaign.icon_image || null,
        },
      })
      setMsg({ ok: true, text: 'Kampanya yayinlandi! Tum kullanicilar gorecek.' })
      setHasExisting(true)
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'Kaydetme hatasi' })
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Aktif kampanyayi silmek istediginizden emin misiniz?')) return
    setDeleting(true)
    setMsg(null)
    try {
      await fetchAPI(API_ENDPOINTS.CAMPAIGNS.DELETE, { method: 'DELETE' })
      setCampaign({ ...emptyCampaign })
      setHasExisting(false)
      setMsg({ ok: true, text: 'Kampanya kaldirildi.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'Silme hatasi' })
    } finally {
      setDeleting(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHeader title="Kampanya Yonetimi" onBack={() => navigate('/admin')} />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {msg && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 text-sm font-medium ${msg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
            {msg.text}
          </div>
        )}

        {/* Preview */}
        <Card padding="p-0">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={14} className="text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Onizleme</h3>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div
              className="rounded-3xl p-5 relative overflow-hidden min-h-[140px]"
              style={{
                backgroundColor: campaign.bg_color || '#111827',
                backgroundImage: campaign.bg_image ? `url(${campaign.bg_image})` : undefined,
                backgroundSize: campaign.bg_image ? 'cover' : undefined,
                backgroundPosition: campaign.bg_image ? 'center' : undefined,
              }}
            >
              {campaign.bg_image && <div className="absolute inset-0 bg-black/40 z-[1]" />}
              <div className="relative z-10">
                {campaign.badge_text && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold mb-3 tracking-wide"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: campaign.badge_color || '#34d399' }}
                  >
                    {campaign.badge_text}
                  </span>
                )}
                <h2 className="text-lg font-bold mb-1 leading-snug" style={{ color: campaign.text_color || '#fff' }}>
                  {campaign.title || 'Kampanya Basligi'}
                </h2>
                <p className="text-[13px] mb-4" style={{ color: `${campaign.text_color || '#fff'}99` }}>
                  {campaign.description || 'Kampanya aciklamasi'}
                </p>
                {campaign.button_text && (
                  <span className="inline-flex items-center px-5 py-2.5 bg-white text-gray-900 rounded-xl text-[13px] font-semibold">
                    {campaign.button_text}
                  </span>
                )}
              </div>
              {(campaign.icon_type || campaign.icon_image) && (() => {
                const opt = ICON_OPTIONS.find(o => o.value === campaign.icon_type)
                const IconComp = opt?.Icon
                return (
                  <div className="absolute right-4 bottom-4 top-4 flex items-center justify-center opacity-30 z-[2]">
                    {campaign.icon_image ? (
                      <img src={campaign.icon_image} alt="" className="w-16 h-16 object-contain" />
                    ) : IconComp ? (
                      <IconComp size={64} className="text-white" strokeWidth={1.5} />
                    ) : null}
                  </div>
                )
              })()}
            </div>
          </div>
        </Card>

        {/* Color Themes */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Renk Temasi</h3>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {presetThemes.map(theme => (
              <button
                key={theme.name}
                onClick={() => setCampaign(prev => ({ ...prev, bg_color: theme.bg_color, badge_color: theme.badge_color, text_color: theme.text_color }))}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-10 h-10 rounded-xl border-2 transition-all"
                  style={{
                    backgroundColor: theme.bg_color,
                    borderColor: campaign.bg_color === theme.bg_color ? theme.badge_color : 'transparent',
                  }}
                />
                <span className="text-[9px] text-gray-500">{theme.name}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Form */}
        <Card padding="p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Kampanya Detaylari</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Etiket (badge)</label>
              <input
                type="text"
                value={campaign.badge_text}
                onChange={(e) => setCampaign(p => ({ ...p, badge_text: e.target.value }))}
                placeholder="Orn: 8 MART OZEL, %20 INDIRIM"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Baslik *</label>
              <input
                type="text"
                value={campaign.title}
                onChange={(e) => setCampaign(p => ({ ...p, title: e.target.value }))}
                placeholder="Orn: Kadinlar Gunune Ozel!"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Aciklama</label>
              <textarea
                value={campaign.description}
                onChange={(e) => setCampaign(p => ({ ...p, description: e.target.value }))}
                placeholder="Orn: Tum hizmetlerde gecerli ozel indirim"
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Buton Yazisi</label>
              <input
                type="text"
                value={campaign.button_text}
                onChange={(e) => setCampaign(p => ({ ...p, button_text: e.target.value }))}
                placeholder="Orn: Hemen Basla"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-2">
                <Image size={12} /> Arka Plan Resmi
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={campaign.bg_image}
                  onChange={(e) => setCampaign(p => ({ ...p, bg_image: e.target.value }))}
                  placeholder="https://... veya yukleyin"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm"
                />
                <label className={`px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium cursor-pointer whitespace-nowrap ${uploadingBg ? 'opacity-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  {uploadingBg ? '...' : 'Yukle'}
                  <input type="file" accept="image/*" onChange={handleUploadBg} className="hidden" disabled={uploadingBg} />
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Sagdaki Ikon (orn. Kadinlar Gunu icin cicek)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {ICON_OPTIONS.filter(o => o.value).map(opt => {
                  const Icon = opt.Icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCampaign(p => ({ ...p, icon_type: campaign.icon_type === opt.value ? '' : opt.value, icon_image: '' }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                        campaign.icon_type === opt.value
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={14} /> {opt.label.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={campaign.icon_image}
                  onChange={(e) => setCampaign(p => ({ ...p, icon_image: e.target.value, icon_type: '' }))}
                  placeholder="Ozel ikon resmi URL (opsiyonel)"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm"
                />
                <label className={`px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium cursor-pointer whitespace-nowrap ${uploadingIcon ? 'opacity-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  {uploadingIcon ? '...' : 'Yukle'}
                  <input type="file" accept="image/*" onChange={handleUploadIcon} className="hidden" disabled={uploadingIcon} />
                </label>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Ikon veya ozel resim secin. Ozel resim onceliklidir.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">Arka Plan</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={campaign.bg_color} onChange={(e) => setCampaign(p => ({ ...p, bg_color: e.target.value }))} className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                  <span className="text-[10px] text-gray-400">{campaign.bg_color}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">Etiket Renk</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={campaign.badge_color} onChange={(e) => setCampaign(p => ({ ...p, badge_color: e.target.value }))} className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                  <span className="text-[10px] text-gray-400">{campaign.badge_color}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">Yazi Renk</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={campaign.text_color} onChange={(e) => setCampaign(p => ({ ...p, text_color: e.target.value }))} className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                  <span className="text-[10px] text-gray-400">{campaign.text_color}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 active:scale-[0.98] transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Kaydediliyor...' : hasExisting ? 'Kampanyayi Guncelle' : 'Kampanyayi Yayinla'}
          </button>

          {hasExisting && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-rose-100 active:scale-[0.98] transition disabled:opacity-60"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {deleting ? 'Kaldiriliyor...' : 'Kampanyayi Kaldir'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminCampaignsPage
