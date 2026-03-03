import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'ELECTRICAL_SOCKET',          label: 'Priz Tamiri' },
  { value: 'ELECTRICAL_CIRCUIT_BREAKER', label: 'Sigorta / Kaçak Akım' },
  { value: 'ELECTRICAL_LIGHTING',        label: 'Aydınlatma Montajı' },
  { value: 'ELECTRICAL_PANEL',           label: 'Elektrik Panosu' },
  { value: 'ELECTRICAL_WIRING',          label: 'Kablolama' },
  { value: 'PLUMBING_LEAK',             label: 'Su Sızıntısı' },
  { value: 'PLUMBING_DRAIN',            label: 'Tıkanıklık Açma' },
  { value: 'PLUMBING_INSTALLATION',     label: 'Tesisat Montajı' },
  { value: 'HVAC_AC',                   label: 'Klima Servis' },
  { value: 'PAINTING',                  label: 'Boya / Badana' },
  { value: 'CARPENTRY',                 label: 'Marangoz' },
  { value: 'GENERAL',                   label: 'Genel Tamir' },
]

function AdminPricingPage() {
  const navigate = useNavigate()
  const [services, setServices]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  const [form, setForm] = useState({ category: '', label: '', basePrice: '' })

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

  useEffect(() => { loadServices() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ category: '', label: '', basePrice: '' })
    setError(null)
    setShowForm(true)
  }

  const openEdit = (svc) => {
    setEditingId(svc.id)
    setForm({ category: svc.category, label: svc.label, basePrice: String(svc.basePrice) })
    setError(null)
    setShowForm(true)
  }

  const handleCategoryChange = (cat) => {
    const opt = CATEGORY_OPTIONS.find(o => o.value === cat)
    setForm(prev => ({ ...prev, category: cat, label: opt?.label || '' }))
  }

  const handleSave = async () => {
    if (!form.category || !form.basePrice) {
      setError('Kategori ve temel fiyat zorunludur.')
      return
    }
    const price = Number(form.basePrice)
    if (isNaN(price) || price <= 0) {
      setError('Geçerli bir fiyat girin.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await fetchAPI(API_ENDPOINTS.SERVICES.UPDATE(editingId), {
          method: 'PATCH',
          body: { label: form.label, basePrice: price },
        })
      } else {
        await fetchAPI(API_ENDPOINTS.SERVICES.CREATE, {
          method: 'POST',
          body: { category: form.category, label: form.label, basePrice: price },
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
    if (!confirm('Bu servisi silmek istediğinizden emin misiniz?')) return
    try {
      await fetchAPI(API_ENDPOINTS.SERVICES.DELETE(id), { method: 'DELETE' })
      loadServices()
    } catch (err) {
      alert('Silme başarısız: ' + err.message)
    }
  }

  // Mevcut kategorileri bul → form'da seçenek olarak kaldır
  const usedCategories = services.map(s => s.category)
  const availableOptions = editingId
    ? CATEGORY_OPTIONS
    : CATEGORY_OPTIONS.filter(o => !usedCategories.includes(o.value))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fiyat Listesi</h1>
            <p className="text-sm text-gray-500">AI fiyatlama için hizmet bazlı ücretler</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
        >
          <Plus size={18} /> Yeni Hizmet
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {/* Ekleme / Düzenleme Formu */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
            <h3 className="font-bold text-gray-900 mb-4">
              {editingId ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle'}
            </h3>
            {error && <p className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              {/* Kategori */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                {editingId ? (
                  <input
                    value={form.category}
                    disabled
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm"
                  />
                ) : (
                  <select
                    value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">-- Seçin --</option>
                    {availableOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Türkçe Etiket */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Türkçe Etiket</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Örn: Priz Tamiri"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Temel Fiyat */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Temel Fiyat (TL)</label>
                <input
                  type="number"
                  min="1"
                  value={form.basePrice}
                  onChange={(e) => setForm(prev => ({ ...prev, basePrice: e.target.value }))}
                  placeholder="150"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
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
            <p className="text-gray-400 text-sm mt-1">Yukarıdaki "Yeni Hizmet" butonuyla ekleyin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(svc => (
              <div
                key={svc.id}
                className={`bg-white rounded-2xl p-5 shadow-lg flex items-center gap-4 border-2 transition ${
                  svc.isActive ? 'border-transparent' : 'border-gray-200 opacity-60'
                }`}
              >
                {/* Renk chip */}
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
                  {/* Aktif/Pasif toggle */}
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

        {/* Açıklama notu */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-blue-700 font-medium">
            💡 <strong>Nasıl çalışır?</strong> Müşteri sorununu tanımladığında Gemini AI metni sınıflandırır.
            Backend bu tablodaki fiyatları baz alarak tahmini ücret hesaplar.
            Gece (22:00–08:00) ve acil durumlar için çarpanlar otomatik uygulanır.
            AI fiyat üretmez — fiyat her zaman bu tablodan gelir.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminPricingPage
