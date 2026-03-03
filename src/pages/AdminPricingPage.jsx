import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Info, Users, TrendingUp } from 'lucide-react'

/** Türkçe label → büyük harfli kategori kodu (PRIZ_TAMIRI, SU_SIZINTISI...) */
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
  klasik: { grad: 'from-gray-500 to-gray-600', light: 'bg-gray-50 border-gray-200' },
  pro:    { grad: 'from-blue-500 to-blue-700',  light: 'bg-blue-50 border-blue-200' },
  plus:   { grad: 'from-amber-500 to-orange-500', light: 'bg-amber-50 border-amber-200' },
}

function AdminPricingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('services') // services | packages

  // Hizmet Fiyatları state
  const [services, setServices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [form, setForm] = useState({ label: '', basePrice: '' })
  const generatedKey = toKey(form.label || '')

  // Bakım Paketleri state
  const [packages, setPackages]         = useState([])
  const [pkgLoading, setPkgLoading]     = useState(false)
  const [editingPkg, setEditingPkg]     = useState(null)   // { packageId, price, features }
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
      await fetchAPI(API_ENDPOINTS.PACKAGES.ADMIN_UPDATE(editingPkg.packageId), {
        method: 'PATCH',
        body: { price, features: editingPkg.features },
      })
      setEditingPkg(null)
      loadPackages()
    } catch (err) {
      setPkgError(err.message || 'Kayıt başarısız')
    } finally {
      setPkgSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fiyat Yönetimi</h1>
            <p className="text-sm text-gray-500">Hizmet fiyatları ve abonelik paketleri</p>
          </div>
        </div>
        {activeTab === 'services' && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            <Plus size={18} /> Yeni Hizmet
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1 max-w-3xl mx-auto">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${activeTab === 'services' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🔧 Hizmet Fiyatları
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${activeTab === 'packages' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            📦 Bakım Paketleri
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        {/* ── BAKM PAKETLERİ SEKMESİ ── */}
        {activeTab === 'packages' && (
          <>
            {pkgError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">{pkgError}</div>
            )}

            {/* Düzenleme Formu */}
            {editingPkg && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-200">
                <h3 className="font-bold text-gray-900 mb-4">
                  {editingPkg.badge} {editingPkg.name} Paketini Düzenle
                </h3>
                {pkgError && <p className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{pkgError}</p>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Aylık Fiyat (TL)</label>
                    <input
                      type="number" min="1"
                      value={editingPkg.price}
                      onChange={e => setEditingPkg(p => ({ ...p, price: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      disabled={pkgSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Özellikler</label>
                    <div className="space-y-2">
                      {editingPkg.features.map((f, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            value={f}
                            onChange={e => setEditingPkg(p => {
                              const features = [...p.features]; features[i] = e.target.value; return { ...p, features }
                            })}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            disabled={pkgSaving}
                          />
                          <button
                            onClick={() => setEditingPkg(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))}
                            className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-200 transition flex-shrink-0"
                          ><X size={14} /></button>
                        </div>
                      ))}
                      <button
                        onClick={() => setEditingPkg(p => ({ ...p, features: [...p.features, ''] }))}
                        className="flex items-center gap-1 text-xs text-indigo-600 font-semibold px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                      ><Plus size={12} /> Özellik Ekle</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setEditingPkg(null); setPkgError(null) }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">
                    İptal
                  </button>
                  <button onClick={handlePkgSave} disabled={pkgSaving}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                    {pkgSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                    {pkgSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            )}

            {/* Paket Kartları */}
            {pkgLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Özet İstatistik */}
                <div className="grid grid-cols-3 gap-3">
                  {packages.map(pkg => {
                    const colors = PKG_COLORS[pkg.packageId] || PKG_COLORS.klasik
                    return (
                      <div key={pkg.packageId} className={`bg-gradient-to-br ${colors.grad} rounded-2xl p-4 text-white`}>
                        <p className="text-2xl mb-1">{pkg.badge}</p>
                        <p className="font-black text-lg">{pkg.name}</p>
                        <p className="text-white/80 text-xs">{pkg.price.toLocaleString('tr-TR')} TL/ay</p>
                        <div className="mt-3 pt-3 border-t border-white/20">
                          <div className="flex items-center gap-1">
                            <Users size={12} className="text-white/70" />
                            <span className="text-xs text-white/90 font-semibold">{pkg.activeSubscribers} abone</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <TrendingUp size={12} className="text-white/70" />
                            <span className="text-xs text-white/90 font-semibold">{pkg.monthlyRevenue.toLocaleString('tr-TR')} TL/ay</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Toplam Gelir Özeti */}
                {packages.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Toplam Aylık Paket Geliri</p>
                      <p className="text-3xl font-black text-indigo-600">
                        {packages.reduce((s, p) => s + p.monthlyRevenue, 0).toLocaleString('tr-TR')} TL
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Toplam Abone</p>
                      <p className="text-2xl font-black text-gray-900">
                        {packages.reduce((s, p) => s + p.activeSubscribers, 0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Detay Listesi */}
                <div className="space-y-3">
                  {packages.map(pkg => {
                    const colors = PKG_COLORS[pkg.packageId] || PKG_COLORS.klasik
                    return (
                      <div key={pkg.packageId} className={`bg-white rounded-2xl p-5 shadow-lg border-2 ${colors.light}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{pkg.badge}</span>
                            <div>
                              <p className="font-black text-gray-900 text-lg">{pkg.name}</p>
                              <p className="text-2xl font-black text-indigo-600">{pkg.price.toLocaleString('tr-TR')} <span className="text-sm text-gray-400 font-normal">TL/ay</span></p>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingPkg({ ...pkg })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-200 transition"
                          >
                            <Pencil size={14} /> Düzenle
                          </button>
                        </div>

                        {/* Abone Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                            <p className="text-lg font-black text-gray-900">{pkg.activeSubscribers}</p>
                            <p className="text-xs text-gray-500">Aktif</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                            <p className="text-lg font-black text-green-600">+{pkg.newThisMonth}</p>
                            <p className="text-xs text-gray-500">Bu Ay Yeni</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-black text-indigo-600">{pkg.monthlyRevenue.toLocaleString('tr-TR')} TL</p>
                            <p className="text-xs text-gray-500">Aylık Gelir</p>
                          </div>
                        </div>

                        {/* Özellikler */}
                        <ul className="space-y-1">
                          {(pkg.features || []).map((f, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                              <span className="text-green-500 flex-shrink-0">✓</span>{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── HİZMET FİYATLARI SEKMESİ ── */}
        {activeTab === 'services' && <>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
            <h3 className="font-bold text-gray-900 mb-4">
              {editingId ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
            </h3>
            {error && (
              <p className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{error}</p>
            )}
            <div className="space-y-3">
              {/* Hizmet Adı */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Hizmet Adı
                </label>
                <input
                  value={form.label}
                  onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Örn: Priz Tamiri, Su Sızıntısı, Kapı Kilidi..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  disabled={saving}
                />
                {/* Otomatik üretilen kod (yeni eklemede göster) */}
                {!editingId && form.label.trim().length > 1 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Info size={12} className="text-purple-400 shrink-0" />
                    <span className="text-xs text-purple-500">
                      Sistem kodu: <strong className="font-mono">{generatedKey}</strong>
                    </span>
                  </div>
                )}
                {editingId && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Info size={12} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400">
                      Sistem kodu değişmez, sadece adı ve fiyatı güncelleyebilirsiniz.
                    </span>
                  </div>
                )}
              </div>

              {/* Temel Fiyat */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Temel Fiyat (TL)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.basePrice}
                  onChange={(e) => setForm(prev => ({ ...prev, basePrice: e.target.value }))}
                  placeholder="150"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowForm(false); setError(null) }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Check size={16} />}
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}

        {/* Servis Listesi */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <p className="text-4xl mb-4">💰</p>
            <p className="text-gray-600 font-medium">Henüz hizmet eklenmemiş.</p>
            <p className="text-gray-400 text-sm mt-1">
              "Yeni Hizmet" butonuyla istediğiniz hizmetleri ekleyin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(svc => (
              <div
                key={svc.id}
                className={`bg-white rounded-2xl p-5 shadow-lg flex items-center gap-4 border-2 transition ${
                  svc.isActive ? 'border-transparent' : 'border-gray-200 opacity-50'
                }`}
              >
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-lg">🔧</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{svc.label}</p>
                  <p className="text-xs text-gray-400 font-mono">{svc.category}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-purple-600">{svc.basePrice} TL</p>
                  <p className="text-xs text-gray-400">temel fiyat</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(svc)}
                    title={svc.isActive ? 'Pasife al' : 'Aktife al'}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      svc.isActive
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {svc.isActive ? <Check size={15} /> : <X size={15} />}
                  </button>
                  <button
                    onClick={() => openEdit(svc)}
                    className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id)}
                    className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bilgi notu */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-blue-700 font-medium">
            💡 <strong>Nasıl çalışır?</strong> Müşteri sorununu tanımladığında Gemini AI,
            <strong> buradaki aktif hizmetleri</strong> baz alarak en uygun olanı seçer ve
            fiyat tahmini üretir. İstediğiniz hizmetleri ekleyin, istemediğinizi silin.
          </p>
        </div>
        </> }
      </div>
    </div>
  )
}

export default AdminPricingPage
