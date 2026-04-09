
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { Plus, Pencil, Trash2, Check, X, Info, Users, TrendingUp, Loader, Coins, Wrench, Zap, Hammer, Sparkles, Paintbrush, Axe, LayoutGrid, Construction } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

const toKey = (label) => {
  const map = { ç:'C',Ç:'C',ö:'O',Ö:'O',ş:'S',Ş:'S',ı:'I',İ:'I',ü:'U',Ü:'U',ğ:'G',Ğ:'G' }
  return label
    .split('').map(c => map[c] || c).join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30)
}

const PKG_COLORS = {
  klasik: { bg: 'bg-zinc-800/50', border: 'border-white/[0.06]', text: 'text-zinc-300', accent: 'text-zinc-400' },
  pro:    { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-300', accent: 'text-blue-400' },
  plus:   { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300', accent: 'text-amber-400' },
}

function AdminPricingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('services')
  const [cancelRates, setCancelRates] = useState({ pending: 5, accepted: 25, inProgress: 50 })
  const [cancelSaving, setCancelSaving] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  const [services, setServices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [form, setForm] = useState({ label: '', basePrice: '', minPrice: '', maxPrice: '', homeCategory: '' })
  const generatedKey = toKey(form.label || '')

  const [packages, setPackages]         = useState([])
  const [pkgLoading, setPkgLoading]     = useState(false)
  const [editingPkg, setEditingPkg]     = useState(null)
  const [pkgSaving, setPkgSaving]       = useState(false)
  const [pkgError, setPkgError]         = useState(null)

  const HOME_SVC_META = [
    { id: 'electric',   name: 'Elektrik', Icon: Zap,       bgColor: 'bg-amber-500/10',  iconColor: 'text-amber-400' },
    { id: 'plumbing',   name: 'Tesisat',  Icon: Wrench,    bgColor: 'bg-blue-500/10',   iconColor: 'text-blue-400' },
    { id: 'renovation', name: 'Tadilat',  Icon: Hammer,    bgColor: 'bg-orange-500/10', iconColor: 'text-orange-400' },
    { id: 'cleaning',   name: 'Temizlik', Icon: Sparkles,  bgColor: 'bg-purple-500/10', iconColor: 'text-purple-400' },
    { id: 'painting',   name: 'Boyacı',   Icon: Paintbrush,bgColor: 'bg-green-500/10',  iconColor: 'text-green-400' },
    { id: 'carpentry',  name: 'Marangoz', Icon: Axe,       bgColor: 'bg-yellow-500/10', iconColor: 'text-yellow-400' },
  ]

  const [homeServices, setHomeServices]   = useState(null)
  const [homeLoading, setHomeLoading]     = useState(false)
  const [homeSaving, setHomeSaving]       = useState(false)
  const [homeError, setHomeError]         = useState(null)

  const loadServices = async () => {
    try {
      setLoading(true)
      const res = await fetchAPI(API_ENDPOINTS.SERVICES.LIST)
      setServices(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError('Servisler yüklenemedi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadPackages = async () => {
    try {
      setPkgLoading(true)
      const res = await fetchAPI(API_ENDPOINTS.PACKAGES.ADMIN_LIST)
      setPackages(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setPkgError('Paketler yüklenemedi: ' + err.message)
    } finally {
      setPkgLoading(false)
    }
  }

  const loadCancelRates = async () => {
    try {
      const r = await fetchAPI(API_ENDPOINTS.CONFIG.CANCELLATION)
      if (r?.data) setCancelRates(r.data)
    } catch { /* ignore */ }
  }
  const saveCancelRates = async () => {
    setCancelSaving(true); setCancelError(null)
    try {
      await fetchAPI(API_ENDPOINTS.CONFIG.CANCELLATION, {
        method: 'PATCH',
        body: cancelRates,
      })
      setCancelError(null)
    } catch (e) { setCancelError(e.message || 'Kaydetme başarısız') }
    finally { setCancelSaving(false) }
  }

  const loadHomeServices = async () => {
    try {
      setHomeLoading(true)
      const res = await fetchAPI(API_ENDPOINTS.CONFIG.HOME_SERVICES, { includeAuth: false })
      setHomeServices(res.data || {})
    } catch (e) {
      setHomeError('Yüklenemedi: ' + e.message)
    } finally {
      setHomeLoading(false)
    }
  }

  const saveHomeServices = async () => {
    setHomeSaving(true); setHomeError(null)
    try {
      await fetchAPI(API_ENDPOINTS.CONFIG.HOME_SERVICES, { method: 'PATCH', body: homeServices })
    } catch (e) {
      setHomeError(e.message || 'Kaydetme başarısız')
    } finally {
      setHomeSaving(false)
    }
  }

  const toggleHomeSvc = (id) => {
    setHomeServices(prev => ({ ...prev, [id]: { active: !prev[id]?.active } }))
  }

  useEffect(() => { loadServices(); loadHomeServices() }, [])
  useEffect(() => { if (activeTab === 'packages') loadPackages() }, [activeTab])
  useEffect(() => { if (activeTab === 'cancellation') loadCancelRates() }, [activeTab])

  const openCreate = (catId = '') => {
    setEditingId(null)
    setForm({ label: '', basePrice: '', minPrice: '', maxPrice: '', homeCategory: catId })
    setError(null)
    setShowForm(true)
  }

  const openEdit = (svc) => {
    setEditingId(svc.id)
    setForm({
      label: svc.label,
      basePrice: String(svc.basePrice),
      minPrice: svc.minPrice != null ? String(svc.minPrice) : '',
      maxPrice: svc.maxPrice != null ? String(svc.maxPrice) : '',
      homeCategory: svc.homeCategory || '',
    })
    setError(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.label.trim() || !form.basePrice) {
      setError('Hizmet adı ve temel fiyat zorunludur.')
      return
    }
    const price    = Number(form.basePrice)
    const minPrice = form.minPrice !== '' ? Number(form.minPrice) : null
    const maxPrice = form.maxPrice !== '' ? Number(form.maxPrice) : null
    if (isNaN(price) || price <= 0) {
      setError('Geçerli bir orta fiyat girin.')
      return
    }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      setError('Alt fiyat, üst fiyattan büyük olamaz.')
      return
    }
    if (!editingId && generatedKey.length < 2) {
      setError('Daha uzun bir hizmet adı girin.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const hc = form.homeCategory || null
      const body = { label: form.label.trim(), basePrice: price, minPrice, maxPrice, homeCategory: hc }
      if (editingId) {
        await fetchAPI(API_ENDPOINTS.SERVICES.UPDATE(editingId), { method: 'PATCH', body })
      } else {
        await fetchAPI(API_ENDPOINTS.SERVICES.CREATE, {
          method: 'POST',
          body: { category: generatedKey, ...body },
        })
      }
      setShowForm(false)
      loadServices()
    } catch (err) {
      setError(err.message || 'Kayıt başarısız')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (svc) => {
    try {
      await fetchAPI(API_ENDPOINTS.SERVICES.UPDATE(svc.id), {
        method: 'PATCH',
        body: { isActive: !svc.isActive },
      })
      loadServices()
    } catch (err) {
      alert('Güncelleme başarısız: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) return
    try {
      await fetchAPI(API_ENDPOINTS.SERVICES.DELETE(id), { method: 'DELETE' })
      loadServices()
    } catch (err) {
      alert('Silme başarısız: ' + err.message)
    }
  }

  const handlePkgSave = async () => {
    if (!editingPkg) return
    const price = Number(editingPkg.price)
    if (isNaN(price) || price <= 0) { setPkgError('Geçerli bir fiyat girin.'); return }
    setPkgSaving(true)
    setPkgError(null)
    try {
      const body = { price }
      if (editingPkg.features && Array.isArray(editingPkg.features)) {
        body.features = editingPkg.features.filter(Boolean)
      }
      await fetchAPI(API_ENDPOINTS.PACKAGES.ADMIN_UPDATE(editingPkg.packageId), {
        method: 'PATCH',
        body,
      })
      setEditingPkg(null)
      await loadPackages()
    } catch (err) {
      setPkgError(err.message || 'Kayıt başarısız')
    } finally {
      setPkgSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Fiyat Yönetimi"
        onBack={() => navigate('/admin')}
        rightAction={activeTab === 'services' ? (
          <button
            onClick={openCreate}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={18} />
          </button>
        ) : null}
      />

      {/* Tab bar */}
      <div className="bg-zinc-900/80 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${activeTab === 'services' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500'}`}
          >
            Hizmet Fiyatları
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${activeTab === 'packages' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500'}`}
          >
            Bakım Paketleri
          </button>
          <button
            onClick={() => setActiveTab('cancellation')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${activeTab === 'cancellation' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500'}`}
          >
            İptal Oranları
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* ── PACKAGES TAB ── */}
        {activeTab === 'packages' && (
          <>
            {pkgError && (
              <Card className="!bg-rose-500/10 !border-rose-500/20">
                <p className="text-xs text-rose-400 font-medium">{pkgError}</p>
              </Card>
            )}

            {/* Edit Form */}
            {editingPkg && (
              <Card className="!border-blue-500/20">
                <h3 className="text-sm font-semibold text-white mb-4">
                  {editingPkg.badge} {editingPkg.name} Paketini Düzenle
                </h3>
                {pkgError && <p className="text-xs text-rose-400 mb-3 bg-rose-500/10 p-2 rounded-lg">{pkgError}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Aylık Fiyat (TL)</label>
                    <input
                      type="number" min="1"
                      value={editingPkg.price}
                      onChange={e => setEditingPkg(p => ({ ...p, price: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none"
                      disabled={pkgSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-2">Özellikler</label>
                    <div className="space-y-2">
                      {editingPkg.features.map((f, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            value={f}
                            onChange={e => setEditingPkg(p => {
                              const features = [...p.features]; features[i] = e.target.value; return { ...p, features }
                            })}
                            className="flex-1 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                            disabled={pkgSaving}
                          />
                          <button
                            onClick={() => setEditingPkg(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))}
                            className="w-8 h-8 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-500/20 transition flex-shrink-0"
                          ><X size={14} /></button>
                        </div>
                      ))}
                      <button
                        onClick={() => setEditingPkg(p => ({ ...p, features: [...p.features, ''] }))}
                        className="flex items-center gap-1 text-[11px] text-blue-400 font-semibold px-3 py-1.5 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition"
                      ><Plus size={12} /> Özellik Ekle</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setEditingPkg(null); setPkgError(null) }}
                    className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-2xl font-semibold text-sm active:scale-[0.98] transition">
                    İptal
                  </button>
                  <button onClick={handlePkgSave} disabled={pkgSaving}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {pkgSaving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                    {pkgSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </Card>
            )}

            {pkgLoading ? (
              <div className="flex flex-col items-center py-16">
                <Loader size={28} className="text-blue-500 animate-spin mb-3" />
                <p className="text-xs text-zinc-500">Paketler yükleniyor...</p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                {packages.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-zinc-500 font-medium">Toplam Aylık Gelir</p>
                        <p className="text-xl font-bold text-blue-400">
                          {packages.reduce((s, p) => s + p.monthlyRevenue, 0).toLocaleString('tr-TR')} TL
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-zinc-500 font-medium">Toplam Abone</p>
                        <p className="text-xl font-bold text-white">
                          {packages.reduce((s, p) => s + p.activeSubscribers, 0)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Package detail cards */}
                <div className="space-y-3">
                  {packages.map(pkg => {
                    const colors = PKG_COLORS[pkg.packageId] || PKG_COLORS.klasik
                    return (
                      <Card key={pkg.packageId}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{pkg.badge}</span>
                            <div>
                              <p className="text-sm font-bold text-white">{pkg.name}</p>
                              <p className="text-lg font-bold text-blue-400">{pkg.price.toLocaleString('tr-TR')} <span className="text-xs text-zinc-500 font-normal">TL/ay</span></p>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingPkg({ ...pkg })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-xl font-semibold text-xs hover:bg-blue-500/20 transition"
                          >
                            <Pencil size={12} /> Düzenle
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                            <p className="text-sm font-bold text-white">{pkg.activeSubscribers}</p>
                            <p className="text-[11px] text-zinc-500">Aktif</p>
                          </div>
                          <div className="bg-emerald-500/10 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-bold text-emerald-400">+{pkg.newThisMonth}</p>
                            <p className="text-[11px] text-zinc-500">Bu Ay</p>
                          </div>
                          <div className="bg-blue-500/10 rounded-xl p-2.5 text-center">
                            <p className="text-xs font-bold text-blue-400">{pkg.monthlyRevenue.toLocaleString('tr-TR')} TL</p>
                            <p className="text-[11px] text-zinc-500">Gelir</p>
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-1">
                          {(pkg.features || []).map((f, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                              <Check size={14} className="text-emerald-400 flex-shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── CANCELLATION TAB ── */}
        {activeTab === 'cancellation' && (
          <Card>
            <h3 className="text-sm font-semibold text-white mb-1">Sadakatsizlik Bedeli Oranları</h3>
            <p className="text-[11px] text-zinc-500 mb-4">İşi kim iptal ederse (müşteri veya usta) iş bütçesinin yüzdesi olarak ceza kesilir.</p>
            {cancelError && <p className="text-xs text-rose-400 mb-3">{cancelError}</p>}
            <div className="space-y-4">
              {[
                { key: 'pending', label: 'Beklemede (PENDING)', desc: 'Teklif verilmeden önce' },
                { key: 'accepted', label: 'Kabul Sonrası (ACCEPTED)', desc: 'İş kabul edildi, henüz başlamadı' },
                { key: 'inProgress', label: 'Devam Eden (IN_PROGRESS)', desc: 'İş başladı' },
              ].map(({ key, label, desc }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">{label}</label>
                  <p className="text-[10px] text-zinc-600 mb-1">{desc}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={cancelRates[key] ?? 0}
                      onChange={e => setCancelRates(p => ({ ...p, [key]: Number(e.target.value) || 0 }))}
                      className="w-24 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm text-white"
                    />
                    <span className="text-sm text-zinc-500">%</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={saveCancelRates}
              disabled={cancelSaving}
              className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {cancelSaving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
              {cancelSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </Card>
        )}

        {/* ── SERVICES TAB ── */}
        {activeTab === 'services' && (
          <>
            {/* Form */}
            {showForm && (
              <Card className="!border-blue-500/20">
                <h3 className="text-sm font-semibold text-white mb-4">
                  {editingId ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
                </h3>
                {error && <p className="text-xs text-rose-400 mb-3 bg-rose-500/10 p-2 rounded-xl">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Hizmet Adı</label>
                    <input
                      value={form.label}
                      onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Örn: Priz Tamiri, Su Sızıntısı..."
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none"
                      disabled={saving}
                    />
                    {!editingId && form.label.trim().length > 1 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Info size={12} className="text-blue-400 shrink-0" />
                        <span className="text-[11px] text-blue-400">
                          Kod: <strong className="font-mono">{generatedKey}</strong>
                        </span>
                      </div>
                    )}
                    {editingId && (
                      <p className="text-[11px] text-zinc-600 mt-1">Sistem kodu değişmez.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Orta Fiyat / Temel Fiyat (TL) <span className="text-rose-400">*</span></label>
                    <input
                      type="number" min="1"
                      value={form.basePrice}
                      onChange={(e) => setForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="Örn: 350"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none"
                      disabled={saving}
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">AI basit iş için alt, karmaşık için üst fiyatı kullanır</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Alt Fiyat (TL) <span className="text-zinc-600">(opsiyonel)</span></label>
                      <input
                        type="number" min="0"
                        value={form.minPrice}
                        onChange={(e) => setForm(prev => ({ ...prev, minPrice: e.target.value }))}
                        placeholder="Örn: 200"
                        className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Üst Fiyat (TL) <span className="text-zinc-600">(opsiyonel)</span></label>
                      <input
                        type="number" min="0"
                        value={form.maxPrice}
                        onChange={(e) => setForm(prev => ({ ...prev, maxPrice: e.target.value }))}
                        placeholder="Örn: 600"
                        className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none"
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Ana Sayfa Kategorisi</label>
                    <select
                      value={form.homeCategory}
                      onChange={(e) => setForm(prev => ({ ...prev, homeCategory: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none"
                      disabled={saving}
                    >
                      <option value="">Atanmamış (Genel)</option>
                      {HOME_SVC_META.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => { setShowForm(false); setError(null) }}
                    className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-2xl font-semibold text-sm active:scale-[0.98] transition"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </Card>
            )}

            {/* Category blocks + merged home toggle */}
            {loading || homeLoading ? (
              <div className="flex flex-col items-center py-16">
                <Loader size={28} className="text-blue-500 animate-spin mb-3" />
                <p className="text-xs text-zinc-500">Yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {HOME_SVC_META.map(({ id, name, Icon, bgColor, iconColor }) => {
                  const isActive = homeServices ? (homeServices[id]?.active ?? false) : false
                  const catSvcs = services.filter(s => s.homeCategory === id)
                  return (
                    <Card key={id}>
                      {/* Category header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? bgColor : 'bg-white/[0.06]'}`}>
                          <Icon size={20} className={isActive ? iconColor : 'text-zinc-600'} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{name}</p>
                          <p className="text-[11px] text-zinc-500">{catSvcs.length} fiyat tanımı</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                              <Construction size={10} /> Yakında
                            </span>
                          )}
                          <button
                            onClick={() => toggleHomeSvc(id)}
                            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isActive ? 'left-[22px]' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Services under this category */}
                      {catSvcs.length > 0 && (
                        <div className="space-y-2 mb-3 border-t border-white/[0.06] pt-3">
                          {catSvcs.map(svc => (
                            <div key={svc.id} className={`flex items-center gap-2 px-2 py-2 rounded-xl bg-white/[0.04] ${!svc.isActive ? 'opacity-50' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-white truncate">{svc.label}</p>
                                <p className="text-[10px] text-zinc-500 font-mono">{svc.category}</p>
                              </div>
                              <p className="text-sm font-bold text-blue-400 flex-shrink-0">{svc.basePrice.toLocaleString('tr-TR')} TL</p>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => handleToggle(svc)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${ svc.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                                  {svc.isActive ? <Check size={12} /> : <X size={12} />}
                                </button>
                                <button onClick={() => openEdit(svc)}
                                  className="w-7 h-7 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center">
                                  <Pencil size={11} />
                                </button>
                                <button onClick={() => handleDelete(svc.id)}
                                  className="w-7 h-7 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => openCreate(id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-white/[0.08] rounded-xl text-[12px] font-semibold text-zinc-500 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5 transition"
                      >
                        <Plus size={13} /> Fiyat Ekle
                      </button>
                    </Card>
                  )
                })}

                {/* Unassigned services */}
                {services.filter(s => !s.homeCategory).length > 0 && (
                  <Card>
                    <div className="flex items-center gap-2 mb-3">
                      <LayoutGrid size={16} className="text-zinc-500" />
                      <p className="text-sm font-bold text-zinc-300">Atanmamış Hizmetler</p>
                    </div>
                    <div className="space-y-2">
                      {services.filter(s => !s.homeCategory).map(svc => (
                        <div key={svc.id} className={`flex items-center gap-2 px-2 py-2 rounded-xl bg-white/[0.04] ${!svc.isActive ? 'opacity-50' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">{svc.label}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{svc.category}</p>
                          </div>
                          <p className="text-sm font-bold text-blue-400 flex-shrink-0">{svc.basePrice.toLocaleString('tr-TR')} TL</p>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => handleToggle(svc)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${ svc.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                              {svc.isActive ? <Check size={12} /> : <X size={12} />}
                            </button>
                            <button onClick={() => openEdit(svc)}
                              className="w-7 h-7 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center">
                              <Pencil size={11} />
                            </button>
                            <button onClick={() => handleDelete(svc.id)}
                              className="w-7 h-7 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {homeServices && (
                  <button
                    onClick={saveHomeServices}
                    disabled={homeSaving}
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {homeSaving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                    {homeSaving ? 'Kaydediliyor...' : 'Ana Sayfa Durumlarını Kaydet'}
                  </button>
                )}

                <Card className="!bg-blue-500/10 !border-blue-500/20">
                  <p className="text-[11px] text-blue-300 font-medium leading-relaxed">
                    <strong>Nasıl çalışır?</strong> Müşteri sorununu tanımladığında Gemini AI,
                    <strong> buradaki aktif hizmetleri</strong> baz alarak en uygun olanı seçer ve fiyat tahmini üretir.
                    Toggle ile ana sayfada görünürlüğü değiştirirsiniz.
                  </p>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminPricingPage
