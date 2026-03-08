import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Save, Eye, Trash2, Plus, Palette } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

const CAMPAIGN_STORAGE_KEY = 'ustago_active_campaign'

const presetThemes = [
  { name: 'Koyu', bg_color: '#111827', badge_color: '#34d399', text_color: '#ffffff' },
  { name: 'Kırmızı', bg_color: '#7f1d1d', badge_color: '#fca5a5', text_color: '#ffffff' },
  { name: 'Mavi', bg_color: '#1e3a5f', badge_color: '#93c5fd', text_color: '#ffffff' },
  { name: 'Mor', bg_color: '#4c1d95', badge_color: '#c4b5fd', text_color: '#ffffff' },
  { name: 'Yeşil', bg_color: '#064e3b', badge_color: '#6ee7b7', text_color: '#ffffff' },
  { name: 'Turuncu', bg_color: '#7c2d12', badge_color: '#fdba74', text_color: '#ffffff' },
]

function AdminCampaignsPage() {
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState({
    title: '',
    description: '',
    badge_text: '',
    button_text: 'Hemen Başla',
    bg_color: '#111827',
    badge_color: '#34d399',
    text_color: '#ffffff',
    active: true,
  })
  const [saved, setSaved] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CAMPAIGN_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setCampaign(parsed)
        setHasExisting(true)
      }
    } catch { /* no stored campaign */ }
  }, [])

  const handleSave = () => {
    if (!campaign.title.trim()) {
      alert('Kampanya başlığı zorunludur')
      return
    }
    try {
      localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({ ...campaign, updatedAt: new Date().toISOString() }))
      setSaved(true)
      setHasExisting(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert('Kaydetme hatası: ' + err.message)
    }
  }

  const handleDelete = () => {
    if (!confirm('Aktif kampanyayı silmek istediğinizden emin misiniz?')) return
    localStorage.removeItem(CAMPAIGN_STORAGE_KEY)
    setCampaign({
      title: '',
      description: '',
      badge_text: '',
      button_text: 'Hemen Başla',
      bg_color: '#111827',
      badge_color: '#34d399',
      text_color: '#ffffff',
      active: true,
    })
    setHasExisting(false)
  }

  const applyTheme = (theme) => {
    setCampaign(prev => ({ ...prev, ...theme }))
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHeader title="Kampanya Yönetimi" onBack={() => navigate('/admin')} />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <Save size={18} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">Kampanya kaydedildi! Ana sayfada görünecek.</p>
          </div>
        )}

        {/* Preview */}
        <Card padding="p-0">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={14} className="text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Önizleme</h3>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div
              className="rounded-3xl p-5 relative overflow-hidden"
              style={{ backgroundColor: campaign.bg_color || '#111827' }}
            >
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
                  {campaign.title || 'Kampanya Başlığı'}
                </h2>
                <p className="text-[13px] mb-4" style={{ color: `${campaign.text_color || '#fff'}99` }}>
                  {campaign.description || 'Kampanya açıklaması'}
                </p>
                {campaign.button_text && (
                  <span className="inline-flex items-center px-5 py-2.5 bg-white text-gray-900 rounded-xl text-[13px] font-semibold">
                    {campaign.button_text}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Color Themes */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Renk Teması</h3>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {presetThemes.map(theme => (
              <button
                key={theme.name}
                onClick={() => applyTheme(theme)}
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
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Kampanya Detayları</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Etiket (badge)</label>
              <input
                type="text"
                value={campaign.badge_text}
                onChange={(e) => setCampaign(p => ({ ...p, badge_text: e.target.value }))}
                placeholder="Örn: 8 MART ÖZEL, %20 İNDİRİM"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Başlık *</label>
              <input
                type="text"
                value={campaign.title}
                onChange={(e) => setCampaign(p => ({ ...p, title: e.target.value }))}
                placeholder="Örn: Kadınlar Günü'ne Özel!"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Açıklama</label>
              <textarea
                value={campaign.description}
                onChange={(e) => setCampaign(p => ({ ...p, description: e.target.value }))}
                placeholder="Örn: Tüm hizmetlerde geçerli özel indirim"
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Buton Yazısı</label>
              <input
                type="text"
                value={campaign.button_text}
                onChange={(e) => setCampaign(p => ({ ...p, button_text: e.target.value }))}
                placeholder="Örn: Hemen Başla"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">Arka Plan</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={campaign.bg_color}
                    onChange={(e) => setCampaign(p => ({ ...p, bg_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                  <span className="text-[10px] text-gray-400">{campaign.bg_color}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">Etiket Renk</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={campaign.badge_color}
                    onChange={(e) => setCampaign(p => ({ ...p, badge_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                  <span className="text-[10px] text-gray-400">{campaign.badge_color}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">Yazı Renk</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={campaign.text_color}
                    onChange={(e) => setCampaign(p => ({ ...p, text_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
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
            className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 active:scale-[0.98] transition"
          >
            <Save size={18} />
            {hasExisting ? 'Kampanyayı Güncelle' : 'Kampanyayı Yayınla'}
          </button>

          {hasExisting && (
            <button
              onClick={handleDelete}
              className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-rose-100 active:scale-[0.98] transition"
            >
              <Trash2 size={18} />
              Kampanyayı Kaldır
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminCampaignsPage
