import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  Ticket, Plus, CheckCircle, Clock, AlertTriangle, User,
  Search, Filter, ChevronRight, X, MessageSquare, Flag,
} from 'lucide-react'

const PRIORITY = { urgent: { label: 'Acil', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }, high: { label: 'Yuksek', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }, medium: { label: 'Normal', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }, low: { label: 'Dusuk', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' } }
const STATUS = { open: { label: 'Acik', color: 'bg-amber-500/10 text-amber-400' }, in_progress: { label: 'Yapiliyor', color: 'bg-blue-500/10 text-blue-400' }, done: { label: 'Tamamlandi', color: 'bg-emerald-500/10 text-emerald-400' }, cancelled: { label: 'Iptal', color: 'bg-zinc-500/10 text-zinc-400' } }
const CATEGORIES = ['Sikayet Inceleme', 'Belge Kontrol', 'Fiyat Guncelleme', 'Usta Onay', 'Teknik Sorun', 'Diger']

const LS_KEY = 'usta_tickets'
const load = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
const save = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d))

export default function AdminTicketsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tickets, setTickets] = useState(load)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detail, setDetail] = useState(null)
  const [comment, setComment] = useState('')
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: CATEGORIES[0], assignee: '' })

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.assignee || '').toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [tickets, statusFilter, search])

  const counts = { all: tickets.length, open: tickets.filter(t => t.status === 'open').length, in_progress: tickets.filter(t => t.status === 'in_progress').length, done: tickets.filter(t => t.status === 'done').length }

  const createTicket = () => {
    if (!form.title) return
    const t = { ...form, id: Date.now(), status: 'open', createdAt: new Date().toISOString(), createdBy: user?.name || 'Admin', comments: [] }
    const next = [t, ...tickets]
    setTickets(next); save(next); setShowForm(false)
    setForm({ title: '', description: '', priority: 'medium', category: CATEGORIES[0], assignee: '' })
  }

  const updateStatus = (id, status) => {
    const next = tickets.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)
    setTickets(next); save(next)
    if (detail?.id === id) setDetail({ ...detail, status })
  }

  const addComment = (id) => {
    if (!comment.trim()) return
    const c = { text: comment, author: user?.name || 'Admin', date: new Date().toISOString() }
    const next = tickets.map(t => t.id === id ? { ...t, comments: [...(t.comments || []), c] } : t)
    setTickets(next); save(next); setComment('')
    if (detail?.id === id) setDetail({ ...detail, comments: [...(detail.comments || []), c] })
  }

  return (
    <Layout hideNav>
      <PageHeader title="Ic Gorev Sistemi" onBack={() => navigate('/admin')} rightAction={
        <button onClick={() => setShowForm(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 text-white"><Plus size={16} /></button>
      } />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2 mt-4 mb-5">
          {[{ k: 'all', l: 'Toplam', c: 'text-white' }, { k: 'open', l: 'Acik', c: 'text-amber-400' }, { k: 'in_progress', l: 'Yapiliyor', c: 'text-blue-400' }, { k: 'done', l: 'Tamam', c: 'text-emerald-400' }].map(s => (
            <div key={s.k} className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 text-center">
              <p className={`text-lg font-black ${s.c}`}>{counts[s.k]}</p>
              <p className="text-[10px] text-zinc-500">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.entries({ all: 'Tumuu', ...Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label])) }).map(([k, l]) => (
            <button key={k} onClick={() => setStatusFilter(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${statusFilter === k ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Gorev ara..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon={Ticket} title="Gorev yok" description="Yeni bir ic gorev olusturun" action={<button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Gorev Olustur</button>} />
        ) : (
          <div className="space-y-2">
            {filtered.map(t => {
              const pr = PRIORITY[t.priority] || PRIORITY.medium
              const st = STATUS[t.status] || STATUS.open
              return (
                <button key={t.id} onClick={() => setDetail(t)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] transition">
                  <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${t.priority === 'urgent' ? 'bg-rose-500' : t.priority === 'high' ? 'bg-amber-500' : t.priority === 'medium' ? 'bg-blue-500' : 'bg-zinc-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{t.category}</span>
                      {t.assignee && <span className="text-[10px] text-zinc-600">→ {t.assignee}</span>}
                      <span className="text-[10px] text-zinc-700">{new Date(t.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                  {(t.comments?.length || 0) > 0 && <span className="flex items-center gap-0.5 text-[10px] text-zinc-600"><MessageSquare size={10} />{t.comments.length}</span>}
                  <ChevronRight size={14} className="text-zinc-700 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/[0.1] rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Yeni Gorev</h3>
                <button onClick={() => setShowForm(false)} className="text-zinc-500"><X size={16} /></button>
              </div>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Gorev basligi"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Aciklama" rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-zinc-400 focus:outline-none">
                  {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-zinc-400 focus:outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="Atanan kisi (isim)"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
              <button onClick={createTicket} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition">Olustur</button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg bg-zinc-900 border border-white/[0.1] rounded-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{detail.title}</h3>
                  <button onClick={() => setDetail(null)} className="text-zinc-500"><X size={16} /></button>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3">{detail.description || 'Aciklama yok'}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY[detail.priority]?.color}`}>{PRIORITY[detail.priority]?.label}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS[detail.status]?.color}`}>{STATUS[detail.status]?.label}</span>
                  <span className="text-[10px] text-zinc-600">{detail.category}</span>
                  {detail.assignee && <span className="text-[10px] text-zinc-500">→ {detail.assignee}</span>}
                </div>
                <div className="flex gap-1.5 mt-3">
                  {detail.status !== 'in_progress' && detail.status !== 'done' && <button onClick={() => updateStatus(detail.id, 'in_progress')} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-semibold">Baslat</button>}
                  {detail.status !== 'done' && <button onClick={() => updateStatus(detail.id, 'done')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-semibold">Tamamla</button>}
                  {detail.status !== 'cancelled' && detail.status !== 'done' && <button onClick={() => updateStatus(detail.id, 'cancelled')} className="px-3 py-1 bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-semibold">Iptal</button>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-2">
                <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Yorumlar ({detail.comments?.length || 0})</p>
                {(detail.comments || []).map((c, i) => (
                  <div key={i} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-white">{c.author}</span>
                      <span className="text-[9px] text-zinc-600">{new Date(c.date).toLocaleString('tr-TR')}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{c.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/[0.06] flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Yorum ekle..."
                  onKeyDown={e => e.key === 'Enter' && addComment(detail.id)}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
                <button onClick={() => addComment(detail.id)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Gonder</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
