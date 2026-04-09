import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, Loader } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

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
    <div className="min-h-screen">
      <PageHeader
        title="Kupon Yönetimi"
        onBack={() => navigate('/admin')}
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <p className="text-xs text-zinc-500 font-medium px-1">{coupons.length} kupon</p>

        {/* Create Form */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Plus size={16} className="text-blue-400" />
            Yeni Kupon Oluştur
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Kupon Kodu *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="YAZA50"
                  className="w-full px-3 py-2.5 border border-white/[0.06] rounded-xl bg-white/[0.04] text-sm font-mono font-semibold text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Bakiye (TL) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="50"
                  min="1"
                  className="w-full px-3 py-2.5 border border-white/[0.06] rounded-xl bg-white/[0.04] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Açıklama</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Yaz kampanyası kuponu"
                className="w-full px-3 py-2.5 border border-white/[0.06] rounded-xl bg-white/[0.04] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Maks. Kullanım</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                  placeholder="Sınırsız"
                  min="1"
                  className="w-full px-3 py-2.5 border border-white/[0.06] rounded-xl bg-white/[0.04] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Son Kullanma</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-white/[0.06] rounded-xl bg-white/[0.04] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
            {msg && (
              <p className={`text-xs font-medium px-1 ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.text}</p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {creating ? 'Oluşturuluyor...' : 'Kupon Oluştur'}
            </button>
          </form>
        </Card>

        {/* Coupons List */}
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 px-1 mb-3">
            <Tag size={14} className="text-zinc-500" />
            Tüm Kuponlar
          </h2>

          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader size={28} className="text-blue-500 animate-spin mb-3" />
              <p className="text-xs text-zinc-500">Yükleniyor...</p>
            </div>
          ) : coupons.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="Henüz kupon yok"
              description="Yukarıdan yeni kupon oluşturabilirsiniz."
            />
          ) : (
            <div className="space-y-3">
              {coupons.map(coupon => (
                <Card key={coupon.id} className={!coupon.isActive ? 'opacity-60' : ''}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${coupon.isActive ? 'bg-emerald-500/10' : 'bg-white/[0.06]'}`}>
                        <Tag size={18} className={coupon.isActive ? 'text-emerald-400' : 'text-zinc-600'} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white font-mono">{coupon.code}</p>
                        <p className="text-xs font-semibold text-blue-400">{coupon.amount} TL bakiye</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggle(coupon.id)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors">
                        {coupon.isActive
                          ? <ToggleRight size={22} className="text-emerald-400" />
                          : <ToggleLeft size={22} className="text-zinc-600" />}
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-500/10 transition-colors">
                        <Trash2 size={16} className="text-rose-500" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {coupon.description && (
                      <span className="text-[11px] bg-white/[0.06] text-zinc-400 px-2 py-0.5 rounded-full">{coupon.description}</span>
                    )}
                    <span className="text-[11px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                      {coupon.usedCount || 0} kullanım{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                    </span>
                    {coupon.expiresAt && (
                      <span className="text-[11px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        Son: {new Date(coupon.expiresAt).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${coupon.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {coupon.isActive ? 'Aktif' : 'Devre Dışı'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminCouponsPage
