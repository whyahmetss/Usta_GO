import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { BookOpen, Plus, X, Tag, Calendar, Edit3, Trash2, Eye, EyeOff } from 'lucide-react'

const LS_KEY = 'usta_changelog'
const load = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null } }
const save = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d))

const TYPES = { feature: { label: 'Yeni Ozellik', color: 'bg-emerald-500/10 text-emerald-400' }, fix: { label: 'Duzeltme', color: 'bg-amber-500/10 text-amber-400' }, improvement: { label: 'Iyilestirme', color: 'bg-blue-500/10 text-blue-400' }, breaking: { label: 'Onemli Degisiklik', color: 'bg-rose-500/10 text-rose-400' } }

const DEFAULT = [
  { id: 1, version: '1.5.0', date: '2025-04-01', title: 'AI Fiyatlandirma Motoru', description: 'DeepSeek tabanli fiyat onerileri, LOW/MID/HIGH bantlari', type: 'feature', published: true },
  { id: 2, version: '1.4.2', date: '2025-03-15', title: 'Havale Sistemi Duzeltmesi', description: 'Referans kodu gorunurluk ve onay akisi duzeltildi', type: 'fix', published: true },
  { id: 3, version: '1.4.0', date: '2025-03-01', title: 'Canli Destek Sistemi', description: 'Socket.io tabanli gercek zamanli musteri destek chati', type: 'feature', published: true },
  { id: 4, version: '1.3.0', date: '2025-02-15', title: 'Admin Panel v2', description: 'Yeni dark tema, sidebar navigasyon, gelismis filtreleme', type: 'improvement', published: true },
]

export default function AdminChangelogPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState(() => load() || DEFAULT)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ version: '', date: '', title: '', description: '', type: 'feature', published: false })

  const persist = (next) => { setEntries(next); save(next) }

  const openEdit = (entry) => {
    setForm({ version: entry.version, date: entry.date, title: entry.title, description: entry.description, type: entry.type, published: entry.published })
    setEditing(entry.id)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.title || !form.version) return
    if (editing) {
      persist(entries.map(e => e.id === editing ? { ...e, ...form } : e))
    } else {
      persist([{ ...form, id: Date.now() }, ...entries])
    }
    setShowForm(false); setEditing(null)
    setForm({ version: '', date: '', title: '', description: '', type: 'feature', published: false })
  }

  const togglePublish = (id) => persist(entries.map(e => e.id === id ? { ...e, published: !e.published } : e))
  const deleteEntry = (id) => { if (confirm('Bu kaydi silmek istediginize emin misiniz?')) persist(entries.filter(e => e.id !== id)) }

  return (
    <Layout hideNav>
      <PageHeader title="Changelog & Versiyon Gecmisi" onBack={() => navigate('/admin')} rightAction={
        <button onClick={() => { setEditing(null); setForm({ version: '', date: new Date().toISOString().split('T')[0], title: '', description: '', type: 'feature', published: false }); setShowForm(true) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 text-white"><Plus size={16} /></button>
      } />
      <div className="max-w-4xl mx-auto px-4 pb-10">

        <div className="flex items-center gap-3 mt-4 mb-6">
          <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 text-center flex-1">
            <p className="text-lg font-black text-white">{entries.length}</p>
            <p className="text-[10px] text-zinc-500">Toplam</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-3 text-center flex-1">
            <p className="text-lg font-black text-emerald-400">{entries.filter(e => e.published).length}</p>
            <p className="text-[10px] text-emerald-400/70">Yayinda</p>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 text-center flex-1">
            <p className="text-lg font-black text-zinc-400">{entries[0]?.version || '-'}</p>
            <p className="text-[10px] text-zinc-500">Son Versiyon</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <EmptyState icon={BookOpen} title="Changelog bos" description="Ilk versiyonu ekleyin" />
        ) : (
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/[0.06]" />
            <div className="space-y-4">
              {entries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => {
                const tp = TYPES[entry.type] || TYPES.feature
                return (
                  <div key={entry.id} className="relative pl-10">
                    <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-zinc-950 ${entry.published ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                    <div className={`bg-zinc-900 rounded-2xl border p-4 ${entry.published ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60'}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-white bg-white/[0.06] px-2 py-0.5 rounded-lg">v{entry.version}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tp.color}`}>{tp.label}</span>
                          {!entry.published && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">Taslak</span>}
                        </div>
                        <span className="text-[10px] text-zinc-600 flex-shrink-0">{entry.date}</span>
                      </div>
                      <p className="text-xs font-semibold text-white mb-1">{entry.title}</p>
                      <p className="text-[11px] text-zinc-400">{entry.description}</p>
                      <div className="flex gap-1.5 mt-3">
                        <button onClick={() => togglePublish(entry.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-zinc-400 hover:bg-white/[0.08] transition">
                          {entry.published ? <><EyeOff size={10} /> Gizle</> : <><Eye size={10} /> Yayinla</>}
                        </button>
                        <button onClick={() => openEdit(entry)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-zinc-400 hover:bg-white/[0.08] transition">
                          <Edit3 size={10} /> Duzenle
                        </button>
                        <button onClick={() => deleteEntry(entry.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 text-[10px] text-rose-400 hover:bg-rose-500/20 transition">
                          <Trash2 size={10} /> Sil
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/[0.1] rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-white">{editing ? 'Duzenle' : 'Yeni Kayit'}</h3>
                <button onClick={() => setShowForm(false)} className="text-zinc-500"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} placeholder="Versiyon (1.5.0)"
                  className="px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-zinc-400 focus:outline-none" />
              </div>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Baslik"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Aciklama" rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none" />
              <div className="flex gap-2">
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-zinc-400 focus:outline-none">
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} className="rounded" /> Yayinla
                </label>
              </div>
              <button onClick={handleSave} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition">Kaydet</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
