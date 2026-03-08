import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { Plus, Pencil, Trash2, Check, X, Info, Users, TrendingUp, Loader, Coins, Wrench } from 'lucide-react'
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
  klasik: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', accent: 'text-gray-600' },
  pro:    { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-700', accent: 'text-primary-600' },
  plus:   { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'text-amber-600' },
}

function AdminPricingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('services')

  const [services, setServices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [form, setForm] = useState({ label: '', basePrice: '' })
  const generatedKey = toKey(form.label || '')

  const [packages, setPackages]         = useState([])
  const [pkgLoading, setPkgLoading]     = useState(false)
  const [editingPkg, setEditingPkg]     = useState(null)
  const [pkgSaving, setPkgSaving]       = useState(false)
  const [pkgError, setPkgError]         = useState(null)

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

  useEffect(() => { loadServices() }, [])
  useEffect(() => { if (activeTab === 'packages') loadPackages() }, [activeTab])

  const openCreate = () => {
    setEditingId(null)
    setForm({ label: '', basePrice: '' })
    setError(null)
    setShowForm(true)
  }

  const openEdit = (svc) => {
    setEditingId(svc.id)
    setForm({ label: svc.label, basePrice: String(svc.basePrice) })
    setError(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.label.trim() || !form.basePrice) {
      setError('Hizmet adı ve temel fiyat zorunludur.')
      return
    }
    const price = Number(form.basePrice)
    if (isNaN(price) || price <= 0) {
      setError('Geçerli bir fiyat girin.')
      return
    }
    if (!editingId && generatedKey.length < 2) {
      setError('Daha uzun bir hizmet adı girin.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await fetchAPI(API_ENDPOINTS.SERVICES.UPDATE(editingId), {
          method: 'PATCH',
          body: { label: form.label.trim(), basePrice: price },
        })
      } else {
        await fetchAPI(API_ENDPOINTS.SERVICES.CREATE, {
          method: 'POST',
          body: { category: generatedKey, label: form.label.trim(), basePrice: price },
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
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Fiyat Yönetimi"
        onBack={() => navigate('/admin')}
        rightAction={activeTab === 'services' ? (
          <button
            onClick={openCreate}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
          >
            <Plus size={18} />
          </button>
        ) : null}
      />

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 flex gap-1">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${activeTab === 'services' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}
          >
            Hizmet Fiyatları
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${activeTab === 'packages' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}
          >
            Bakım Paketleri
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* ── PACKAGES TAB ── */}
        {activeTab === 'packages' && (
          <>
            {pkgError && (
              <Card className="!bg-rose-50 !border-rose-200">
                <p className="text-xs text-rose-600 font-medium">{pkgError}</p>
              </Card>
            )}

            {/* Edit Form */}
            {editingPkg && (
              <Card className="!border-primary-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {editingPkg.badge} {editingPkg.name} Paketini Düzenle
                </h3>
                {pkgError && <p className="text-xs text-rose-600 mb-3 bg-rose-50 p-2 rounded-lg">{pkgError}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Aylık Fiyat (TL)</label>
                    <input
                      type="number" min="1"
                      value={editingPkg.price}
                      onChange={e => setEditingPkg(p => ({ ...p, price: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none"
                      disabled={pkgSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-2">Özellikler</label>
                    <div className="space-y-2">
                      {editingPkg.features.map((f, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            value={f}
                            onChange={e => setEditingPkg(p => {
                              const features = [...p.features]; features[i] = e.target.value; return { ...p, features }
                            })}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                            disabled={pkgSaving}
                          />
                          <button
                            onClick={() => setEditingPkg(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))}
                            className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition flex-shrink-0"
                          ><X size={14} /></button>
                        </div>
                      ))}
                      <button
                        onClick={() => setEditingPkg(p => ({ ...p, features: [...p.features, ''] }))}
                        className="flex items-center gap-1 text-[11px] text-primary-600 font-semibold px-3 py-1.5 bg-primary-50 rounded-xl hover:bg-primary-100 transition"
                      ><Plus size={12} /> Özellik Ekle</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setEditingPkg(null); setPkgError(null) }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm active:scale-[0.98] transition">
                    İptal
                  </button>
                  <button onClick={handlePkgSave} disabled={pkgSaving}
                    className="flex-1 py-2.5 bg-primary-500 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {pkgSaving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                    {pkgSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </Card>
            )}

            {pkgLoading ? (
              <div className="flex flex-col items-center py-16">
                <Loader size={28} className="text-primary-500 animate-spin mb-3" />
                <p className="text-xs text-gray-500">Paketler yükleniyor...</p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                {packages.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium">Toplam Aylık Gelir</p>
                        <p className="text-xl font-bold text-primary-600">
                          {packages.reduce((s, p) => s + p.monthlyRevenue, 0).toLocaleString('tr-TR')} TL
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-500 font-medium">Toplam Abone</p>
                        <p className="text-xl font-bold text-gray-900">
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
                              <p className="text-sm font-bold text-gray-900">{pkg.name}</p>
                              <p className="text-lg font-bold text-primary-600">{pkg.price.toLocaleString('tr-TR')} <span className="text-xs text-gray-400 font-normal">TL/ay</span></p>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingPkg({ ...pkg })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-xl font-semibold text-xs hover:bg-primary-100 transition"
                          >
                            <Pencil size={12} /> Düzenle
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-bold text-gray-900">{pkg.activeSubscribers}</p>
                            <p className="text-[11px] text-gray-500">Aktif</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-bold text-emerald-600">+{pkg.newThisMonth}</p>
                            <p className="text-[11px] text-gray-500">Bu Ay</p>
                          </div>
                          <div className="bg-primary-50 rounded-xl p-2.5 text-center">
                            <p className="text-xs font-bold text-primary-600">{pkg.monthlyRevenue.toLocaleString('tr-TR')} TL</p>
                            <p className="text-[11px] text-gray-500">Gelir</p>
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-1">
                          {(pkg.features || []).map((f, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                              <Check size={14} className="text-emerald-500 flex-shrink-0" />{f}
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

        {/* ── SERVICES TAB ── */}
        {activeTab === 'services' && (
          <>
            {/* Form */}
            {showForm && (
              <Card className="!border-primary-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {editingId ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
                </h3>
                {error && <p className="text-xs text-rose-600 mb-3 bg-rose-50 p-2 rounded-xl">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Hizmet Adı</label>
                    <input
                      value={form.label}
                      onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Örn: Priz Tamiri, Su Sızıntısı..."
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none"
                      disabled={saving}
                    />
                    {!editingId && form.label.trim().length > 1 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Info size={12} className="text-primary-400 shrink-0" />
                        <span className="text-[11px] text-primary-500">
                          Kod: <strong className="font-mono">{generatedKey}</strong>
                        </span>
                      </div>
                    )}
                    {editingId && (
                      <p className="text-[11px] text-gray-400 mt-1">Sistem kodu değişmez.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Temel Fiyat (TL)</label>
                    <input
                      type="number" min="1"
                      value={form.basePrice}
                      onChange={(e) => setForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="150"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => { setShowForm(false); setError(null) }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm active:scale-[0.98] transition"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-primary-500 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </Card>
            )}

            {/* Services list */}
            {loading ? (
              <div className="flex flex-col items-center py-16">
                <Loader size={28} className="text-primary-500 animate-spin mb-3" />
                <p className="text-xs text-gray-500">Hizmetler yükleniyor...</p>
              </div>
            ) : services.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="Henüz hizmet eklenmemiş"
                description="Yeni Hizmet butonuyla hizmetlerinizi ekleyin."
              />
            ) : (
              <div className="space-y-3">
                {services.map(svc => (
                  <Card key={svc.id} className={!svc.isActive ? 'opacity-50' : ''}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                        <Wrench size={18} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{svc.label}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{svc.category}</p>
                      </div>
                      <div className="text-right shrink-0 mr-1">
                        <p className="text-base font-bold text-primary-600">{svc.basePrice} TL</p>
                        <p className="text-[10px] text-gray-400">temel fiyat</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggle(svc)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                            svc.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {svc.isActive ? <Check size={14} /> : <X size={14} />}
                        </button>
                        <button
                          onClick={() => openEdit(svc)}
                          className="w-8 h-8 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id)}
                          className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Info note */}
            <Card className="!bg-primary-50 !border-primary-100">
              <p className="text-[11px] text-primary-700 font-medium leading-relaxed">
                <strong>Nasıl çalışır?</strong> Müşteri sorununu tanımladığında Gemini AI,
                <strong> buradaki aktif hizmetleri</strong> baz alarak en uygun olanı seçer ve
                fiyat tahmini üretir.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminPricingPage
