import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save, Eye, Trash2, Palette, Loader2, Image, Flower, Zap, Gift, Sparkles,
  Heart, Star, PartyPopper, Plus, Tag, ToggleLeft, ToggleRight, Loader, Users,
} from 'lucide-react'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

const ICON_OPTIONS = [
  { value: '', label: 'Yok' },
  { value: 'flower', label: 'Çiçek', Icon: Flower },
  { value: 'zap', label: 'Yıldırım', Icon: Zap },
  { value: 'gift', label: 'Hediye', Icon: Gift },
  { value: 'sparkles', label: 'Parlak', Icon: Sparkles },
  { value: 'heart', label: 'Kalp', Icon: Heart },
  { value: 'star', label: 'Yıldız', Icon: Star },
  { value: 'party', label: 'Parti', Icon: PartyPopper },
]

const presetThemes = [
  { name: 'Koyu', bg_color: '#111827', badge_color: '#34d399', text_color: '#ffffff' },
  { name: 'Kırmızı', bg_color: '#7f1d1d', badge_color: '#fca5a5', text_color: '#ffffff' },
  { name: 'Mavi', bg_color: '#1e3a5f', badge_color: '#93c5fd', text_color: '#ffffff' },
  { name: 'Mor', bg_color: '#4c1d95', badge_color: '#c4b5fd', text_color: '#ffffff' },
  { name: 'Yeşil', bg_color: '#064e3b', badge_color: '#6ee7b7', text_color: '#ffffff' },
  { name: 'Turuncu', bg_color: '#7c2d12', badge_color: '#fdba74', text_color: '#ffffff' },
]

const emptyCampaign = {
  title: '', description: '', badge_text: '', button_text: 'Hemen Başla',
  bg_color: '#111827', badge_color: '#34d399', text_color: '#ffffff',
  bg_image: '', icon_type: '', icon_image: '',
}

// ---------- Campaign Tab ----------
function CampaignTab() {
  const [campaign, setCampaign] = useState({ ...emptyCampaign })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState(null)
  const [hasExisting, setHasExisting] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)

  useEffect(() => {
    fetchAPI(API_ENDPOINTS.ADMIN.CAMPAIGNS?.ACTIVE ?? '/admin/campaigns/active')
      .then(res => {
        if (res?.data?.title) {
          setCampaign({ ...emptyCampaign, ...res.data, bg_image: res.data.bg_image || '', icon_type: res.data.icon_type || '', icon_image: res.data.icon_image || '' })
          setHasExisting(true)
        }
      })
      .catch(() => {})
  }, [])

  const uploadBg = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingBg(true)
    try { const r = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo'); const url = r.data?.url || r.url || r.data; if (url) setCampaign(p => ({ ...p, bg_image: url })) }
    catch (err) { alert('Yükleme hatası: ' + err.message) }
    finally { setUploadingBg(false); e.target.value = '' }
  }

  const uploadIcon = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingIcon(true)
    try { const r = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo'); const url = r.data?.url || r.url || r.data; if (url) setCampaign(p => ({ ...p, icon_image: url, icon_type: '' })) }
    catch (err) { alert('Yükleme hatası: ' + err.message) }
    finally { setUploadingIcon(false); e.target.value = '' }
  }

  const handleSave = async () => {
    if (!campaign.title.trim()) return setMsg({ ok: false, text: 'Kampanya başlığı zorunludur' })
    setSaving(true); setMsg(null)
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.CAMPAIGNS?.SET ?? '/admin/campaigns', {
        method: 'POST', body: { ...campaign, bg_image: campaign.bg_image || null, icon_type: campaign.icon_type || null, icon_image: campaign.icon_image || null },
      })
      setMsg({ ok: true, text: 'Kampanya yayınlandı!' }); setHasExisting(true)
    } catch (err) { setMsg({ ok: false, text: err.message || 'Kaydetme hatası' }) }
    finally { setSaving(false); setTimeout(() => setMsg(null), 4000) }
  }

  const handleDelete = async () => {
    if (!confirm('Aktif kampanyayı silmek istediğinizden emin misiniz?')) return
    setDeleting(true); setMsg(null)
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.CAMPAIGNS?.DELETE ?? '/admin/campaigns', { method: 'DELETE' })
      setCampaign({ ...emptyCampaign }); setHasExisting(false)
      setMsg({ ok: true, text: 'Kampanya kaldırıldı.' })
    } catch (err) { setMsg({ ok: false, text: err.message }) }
    finally { setDeleting(false); setTimeout(() => setMsg(null), 4000) }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${msg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Preview */}
      <Card padding="p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Önizleme</p>
        <div
          className="rounded-3xl p-5 relative overflow-hidden min-h-[140px]"
          style={{ backgroundColor: campaign.bg_color, backgroundImage: campaign.bg_image ? `url(${campaign.bg_image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {campaign.bg_image && <div className="absolute inset-0 bg-black/40 z-[1]" />}
          <div className="relative z-10">
            {campaign.badge_text && (
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: campaign.badge_color }}>
                {campaign.badge_text}
              </span>
            )}
            <h2 className="text-lg font-bold mb-1" style={{ color: campaign.text_color }}>{campaign.title || 'Kampanya Başlığı'}</h2>
            <p className="text-[13px] mb-4" style={{ color: `${campaign.text_color}99` }}>{campaign.description || 'Kampanya açıklaması'}</p>
            {campaign.button_text && (
              <span className="inline-flex items-center px-5 py-2.5 bg-white text-gray-900 rounded-xl text-[13px] font-semibold">{campaign.button_text}</span>
            )}
          </div>
          {(campaign.icon_type || campaign.icon_image) && (() => {
            const opt = ICON_OPTIONS.find(o => o.value === campaign.icon_type)
            const IconComp = opt?.Icon
            return (
              <div className="absolute right-4 bottom-4 top-4 flex items-center justify-center opacity-30 z-[2]">
                {campaign.icon_image ? <img src={campaign.icon_image} alt="" className="w-16 h-16 object-contain" /> : IconComp ? <IconComp size={64} className="text-white" strokeWidth={1.5} /> : null}
              </div>
            )
          })()}
        </div>
      </Card>

      {/* Preset themes */}
      <Card padding="p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2"><Palette size={14} /> Renk Teması</p>
        <div className="grid grid-cols-6 gap-2">
          {presetThemes.map(theme => (
            <button key={theme.name} onClick={() => setCampaign(p => ({ ...p, ...theme }))} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl border-2 transition-all" style={{ backgroundColor: theme.bg_color, borderColor: campaign.bg_color === theme.bg_color ? theme.badge_color : 'transparent' }} />
              <span className="text-[9px] text-gray-500">{theme.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Form */}
      <Card padding="p-4">
        <p className="text-sm font-semibold text-gray-900 mb-4">Kampanya Detayları</p>
        <div className="space-y-3">
          {[
            { key: 'badge_text', label: 'Etiket (badge)', placeholder: 'Örn: 8 MART ÖZEL, %20 İNDİRİM' },
            { key: 'title', label: 'Başlık *', placeholder: 'Örn: Kadınlar Gününe Özel!' },
            { key: 'description', label: 'Açıklama', placeholder: 'Tüm hizmetlerde geçerli özel indirim', textarea: true },
            { key: 'button_text', label: 'Buton Yazısı', placeholder: 'Hemen Başla' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">{f.label}</label>
              {f.textarea ? (
                <textarea value={campaign[f.key]} onChange={e => setCampaign(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={2} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm resize-none" />
              ) : (
                <input value={campaign[f.key]} onChange={e => setCampaign(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm" />
              )}
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-2"><Image size={12} /> Arka Plan Resmi</label>
            <div className="flex gap-2">
              <input type="url" value={campaign.bg_image} onChange={e => setCampaign(p => ({ ...p, bg_image: e.target.value }))} placeholder="https://... veya yükleyin" className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm" />
              <label className={`px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium cursor-pointer whitespace-nowrap ${uploadingBg ? 'opacity-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                {uploadingBg ? '...' : 'Yükle'}
                <input type="file" accept="image/*" onChange={uploadBg} className="hidden" disabled={uploadingBg} />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Sağdaki İkon</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ICON_OPTIONS.filter(o => o.value).map(opt => {
                const Icon = opt.Icon
                return (
                  <button key={opt.value} type="button" onClick={() => setCampaign(p => ({ ...p, icon_type: p.icon_type === opt.value ? '' : opt.value, icon_image: '' }))} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition ${campaign.icon_type === opt.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                    <Icon size={14} /> {opt.label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <input type="url" value={campaign.icon_image} onChange={e => setCampaign(p => ({ ...p, icon_image: e.target.value, icon_type: '' }))} placeholder="Özel ikon URL (opsiyonel)" className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none text-sm" />
              <label className={`px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium cursor-pointer whitespace-nowrap ${uploadingIcon ? 'opacity-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                {uploadingIcon ? '...' : 'Yükle'}
                <input type="file" accept="image/*" onChange={uploadIcon} className="hidden" disabled={uploadingIcon} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[{ key: 'bg_color', label: 'Arka Plan' }, { key: 'badge_color', label: 'Etiket Renk' }, { key: 'text_color', label: 'Yazı Renk' }].map(c => (
              <div key={c.key}>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">{c.label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={campaign[c.key]} onChange={e => setCampaign(p => ({ ...p, [c.key]: e.target.value }))} className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                  <span className="text-[10px] text-gray-400">{campaign[c.key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-3 pb-4">
        <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 active:scale-[0.98] transition disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Kaydediliyor...' : hasExisting ? 'Güncelle' : 'Yayınla'}
        </button>
        {hasExisting && (
          <button onClick={handleDelete} disabled={deleting} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-rose-100 active:scale-[0.98] transition disabled:opacity-60">
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            {deleting ? 'Kaldırılıyor...' : 'Kampanyayı Kaldır'}
          </button>
        )}
      </div>
    </div>
  )
}

// ---------- Coupon Tab ----------
function CouponTab() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: '', amount: '', description: '', maxUses: '', expiresAt: '' })
  const [msg, setMsg] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const res = await fetchAPI(API_ENDPOINTS.ADMIN.COUPONS); setCoupons(Array.isArray(res?.data) ? res.data : []) }
    catch { setCoupons([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.code.trim() || !form.amount) return setMsg({ ok: false, text: 'Kod ve tutar zorunlu' })
    setCreating(true); setMsg(null)
    try {
      const res = await fetchAPI(API_ENDPOINTS.ADMIN.COUPONS, {
        method: 'POST',
        body: { code: form.code.trim().toUpperCase(), amount: Number(form.amount), description: form.description || undefined, maxUses: form.maxUses ? Number(form.maxUses) : undefined, expiresAt: form.expiresAt || undefined },
      })
      if (res?.success) { setMsg({ ok: true, text: 'Kupon oluşturuldu!' }); setForm({ code: '', amount: '', description: '', maxUses: '', expiresAt: '' }); load() }
      else setMsg({ ok: false, text: res?.error || 'Hata oluştu' })
    } catch (err) { setMsg({ ok: false, text: err.message }) }
    finally { setCreating(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu kuponu silmek istiyor musunuz?')) return
    try { await fetchAPI(`${API_ENDPOINTS.ADMIN.COUPONS}/${id}`, { method: 'DELETE' }); setCoupons(prev => prev.filter(c => c.id !== id)) }
    catch (err) { alert(err.message) }
  }

  const handleToggle = async (id) => {
    try {
      const res = await fetchAPI(`${API_ENDPOINTS.ADMIN.COUPONS}/${id}/toggle`, { method: 'PATCH' })
      if (res?.data) setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: res.data.isActive } : c))
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="space-y-4">
      <Card padding="p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus size={16} className="text-primary-500" /> Yeni Kupon Oluştur</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Kupon Kodu *</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="YAZA50" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Bakiye (TL) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="50" min="1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Açıklama</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Yaz kampanyası kuponu" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Maks. Kullanım</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Sınırsız" min="1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Son Kullanma</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
            </div>
          </div>
          {msg && <p className={`text-xs font-medium px-1 ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.text}</p>}
          <button type="submit" disabled={creating} className="w-full py-3 bg-primary-500 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50">
            {creating ? 'Oluşturuluyor...' : 'Kupon Oluştur'}
          </button>
        </form>
      </Card>

      <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 px-1"><Tag size={14} className="text-gray-400" /> Tüm Kuponlar ({coupons.length})</h2>

      {loading ? (
        <div className="flex flex-col items-center py-12"><Loader size={28} className="text-primary-500 animate-spin mb-3" /><p className="text-xs text-gray-500">Yükleniyor...</p></div>
      ) : coupons.length === 0 ? (
        <EmptyState icon={Tag} title="Henüz kupon yok" description="Yukarıdan yeni kupon oluşturabilirsiniz." />
      ) : (
        <div className="space-y-3">
          {coupons.map(coupon => (
            <Card key={coupon.id} className={!coupon.isActive ? 'opacity-60' : ''}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${coupon.isActive ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                    <Tag size={18} className={coupon.isActive ? 'text-emerald-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 font-mono">{coupon.code}</p>
                    <p className="text-xs font-semibold text-primary-600">{coupon.amount} TL bakiye</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleToggle(coupon.id)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                    {coupon.isActive ? <ToggleRight size={22} className="text-emerald-600" /> : <ToggleLeft size={22} className="text-gray-400" />}
                  </button>
                  <button onClick={() => handleDelete(coupon.id)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 transition-colors">
                    <Trash2 size={16} className="text-rose-500" />
                  </button>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {coupon.description && <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{coupon.description}</span>}
                <span className="text-[11px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{coupon.usedCount || 0} kullanım{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</span>
                {coupon.expiresAt && <span className="text-[11px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Son: {new Date(coupon.expiresAt).toLocaleDateString('tr-TR')}</span>}
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${coupon.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{coupon.isActive ? 'Aktif' : 'Devre Dışı'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Referral Tab ----------
function ReferralTab() {
  const [bonus, setBonus] = useState({ referrerBonus: 50, newUserBonus: 50 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    fetchAPI('/admin/config/referral')
      .then(res => { if (res?.data) setBonus(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    try {
      const res = await fetchAPI('/admin/config/referral', {
        method: 'PATCH',
        body: { referrerBonus: Number(bonus.referrerBonus), newUserBonus: Number(bonus.newUserBonus) },
      })
      if (res?.data) setBonus(res.data)
      setMsg({ ok: true, text: 'Davet bonusu güncellendi!' })
    } catch (err) { setMsg({ ok: false, text: err.message }) }
    finally { setSaving(false); setTimeout(() => setMsg(null), 4000) }
  }

  if (loading) return <div className="flex items-center justify-center py-16"><Loader size={28} className="text-primary-500 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <Card padding="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Users size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Arkadaş Davet Bonusu</p>
            <p className="text-xs text-gray-500">Davet eden ve davet edilen kullanıcıya verilecek bonus</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Davet Eden (Referans Sahibi) Bonusu (TL)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                value={bonus.referrerBonus}
                onChange={e => setBonus(p => ({ ...p, referrerBonus: e.target.value }))}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
              <span className="text-sm font-bold text-gray-500">TL</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Arkadaşını davet eden kişi bu kadar bonus alır</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Davet Edilen (Yeni Üye) Bonusu (TL)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                value={bonus.newUserBonus}
                onChange={e => setBonus(p => ({ ...p, newUserBonus: e.target.value }))}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
              <span className="text-sm font-bold text-gray-500">TL</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Davet kodu ile kayıt olan yeni üye bu kadar bonus alır</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">Örnek: Ahmet, Mehmet'i davet etti.</p>
            <p className="text-xs text-blue-600 mt-1">→ Ahmet {bonus.referrerBonus} TL bakiye kazandı</p>
            <p className="text-xs text-blue-600">→ Mehmet hoş geldin bonusu olarak {bonus.newUserBonus} TL bakiye aldı</p>
          </div>

          {msg && <p className={`text-xs font-medium ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.text}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary-500 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </Card>
    </div>
  )
}

// ---------- Main Page ----------
export default function AdminPromotionsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('campaign')

  const tabs = [
    { key: 'campaign', label: 'Kampanya' },
    { key: 'coupon', label: 'Kuponlar' },
    { key: 'referral', label: 'Davet Bonusu' },
  ]

  return (
    <Layout hideNav>
      <PageHeader title="Kampanya & Kuponlar" onBack={() => navigate('/admin')} />
      <div className="max-w-lg mx-auto px-4 pb-10">
        {/* Tabs */}
        <div className="flex gap-2 mt-4 mb-5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'campaign' && <CampaignTab />}
        {tab === 'coupon' && <CouponTab />}
        {tab === 'referral' && <ReferralTab />}
      </div>
    </Layout>
  )
}
