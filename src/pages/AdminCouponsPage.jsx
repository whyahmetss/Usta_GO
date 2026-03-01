import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'

function AdminCouponsPage() {
  const navigate = useNavigate()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: '', amount: '', description: '', maxUses: '', expiresAt: '' })
  const [msg, setMsg] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchAPI(API_ENDPOINTS.ADMIN.COUPONS)
      setCoupons(Array.isArray(res?.data) ? res.data : [])
    } catch { setCoupons([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.code.trim() || !form.amount) return setMsg({ ok: false, text: 'Kod ve tutar zorunlu' })
    setCreating(true)
    setMsg(null)
    try {
      const res = await fetchAPI(API_ENDPOINTS.ADMIN.COUPONS, {
        method: 'POST',
        body: {
          code: form.code.trim().toUpperCase(),
          amount: Number(form.amount),
          description: form.description || undefined,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          expiresAt: form.expiresAt || undefined,
        }
      })
      if (res?.success) {
        setMsg({ ok: true, text: 'Kupon oluşturuldu!' })
        setForm({ code: '', amount: '', description: '', maxUses: '', expiresAt: '' })
        load()
      } else {
        setMsg({ ok: false, text: res?.error || 'Hata oluştu' })
      }
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'Hata oluştu' })
    } finally { setCreating(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return
    try {
      await fetchAPI(`${API_ENDPOINTS.ADMIN.COUPONS}/${id}`, { method: 'DELETE' })
      setCoupons(prev => prev.filter(c => c.id !== id))
    } catch (err) { alert(err.message) }
  }

  const handleToggle = async (id) => {
    try {
      const res = await fetchAPI(`${API_ENDPOINTS.ADMIN.COUPONS}/${id}/toggle`, { method: 'PATCH' })
      if (res?.data) setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: res.data.isActive } : c))
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Kupon Yönetimi</h1>
            <p className="text-xs text-gray-500">{coupons.length} kupon</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Create Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-600" />Yeni Kupon Oluştur</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Kupon Kodu *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="YAZA50"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Bakiye Miktarı (TL) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="50"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Açıklama (İsteğe Bağlı)</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Yaz kampanyası kuponu"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Maks. Kullanım (Boş = Sınırsız)</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                  placeholder="100"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Son Kullanma Tarihi</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {msg && (
              <p className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {creating ? 'Oluşturuluyor...' : 'Kupon Oluştur'}
            </button>
          </form>
        </div>

        {/* Coupons List */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Tag size={18} />Tüm Kuponlar</h2>
          {loading ? (
            <div className="text-center py-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : coupons.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-dashed">Henüz kupon yok</div>
          ) : (
            coupons.map(coupon => (
              <div key={coupon.id} className={`bg-white rounded-2xl p-4 border-2 shadow-sm ${coupon.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${coupon.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Tag size={18} className={coupon.isActive ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 font-mono">{coupon.code}</p>
                      <p className="text-sm font-bold text-blue-600">{coupon.amount} TL bakiye</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(coupon.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                      {coupon.isActive
                        ? <ToggleRight size={22} className="text-green-600" />
                        : <ToggleLeft size={22} className="text-gray-400" />}
                    </button>
                    <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} className="text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  {coupon.description && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{coupon.description}</span>}
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{coupon.usedCount || 0} kullanım{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</span>
                  {coupon.expiresAt && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">Son: {new Date(coupon.expiresAt).toLocaleDateString('tr-TR')}</span>}
                  <span className={`px-2 py-0.5 rounded-full font-bold ${coupon.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {coupon.isActive ? 'Aktif' : 'Devre Dışı'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminCouponsPage
