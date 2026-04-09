import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  StickyNote, Plus, Search, X, Trash2, Edit3, User,
  Briefcase, ChevronRight, Tag, Clock, Pin,
} from 'lucide-react'

const LS_KEY = 'usta_admin_notes'
const load = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
const save = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d))

const TARGETS = [
  { key: 'user', label: 'Kullanici', icon: User },
  { key: 'job', label: 'Is', icon: Briefcase },
  { key: 'general', label: 'Genel', icon: StickyNote },
]

const COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-teal-500']

export default function AdminNotesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notes, setNotes] = useState(load)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [targetFilter, setTargetFilter] = useState('all')
  const [form, setForm] = useState({ target: 'general', targetId: '', targetName: '', content: '', pinned: false, color: 0 })

  const persist = (next) => { setNotes(next); save(next) }

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (targetFilter !== 'all' && n.target !== targetFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return n.content.toLowerCase().includes(q) || (n.targetName || '').toLowerCase().includes(q) || (n.author || '').toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [notes, search, targetFilter])

  const handleSave = () => {
    if (!form.content.trim()) return
    if (editing) {
      persist(notes.map(n => n.id === editing ? { ...n, ...form, updatedAt: new Date().toISOString() } : n))
    } else {
      persist([{ ...form, id: Date.now(), author: user?.name || 'Admin', createdAt: new Date().toISOString() }, ...notes])
    }
    setShowForm(false); setEditing(null)
    setForm({ target: 'general', targetId: '', targetName: '', content: '', pinned: false, color: 0 })
  }

  const deleteNote = (id) => persist(notes.filter(n => n.id !== id))
  const togglePin = (id) => persist(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))

  const openEdit = (note) => {
    setForm({ target: note.target, targetId: note.targetId || '', targetName: note.targetName || '', content: note.content, pinned: note.pinned, color: note.color || 0 })
    setEditing(note.id); setShowForm(true)
  }

  return (
    <Layout hideNav>
      <PageHeader title="Admin Notlari" onBack={() => navigate('/admin')} rightAction={
        <button onClick={() => { setEditing(null); setForm({ target: 'general', targetId: '', targetName: '', content: '', pinned: false, color: 0 }); setShowForm(true) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 text-white"><Plus size={16} /></button>
      } />
      <div className="max-w-5xl mx-auto px-4 pb-10">

        <div className="flex gap-2 mt-4 mb-4 flex-wrap">
          <button onClick={() => setTargetFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${targetFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
            Tumuu ({notes.length})
          </button>
          {TARGETS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTargetFilter(t.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${targetFilter === t.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
                <Icon size={11} /> {t.label} ({notes.filter(n => n.target === t.key).length})
              </button>
            )
          })}
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Not ara..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={StickyNote} title="Not yok" description="Kullanici, is veya genel not ekleyin"
            action={<button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Not Ekle</button>} />
        ) : (
          <div className="space-y-2">
            {filtered.map(note => {
              const tg = TARGETS.find(t => t.key === note.target)
              const TgIcon = tg?.icon || StickyNote
              return (
                <div key={note.id} className={`bg-zinc-900 rounded-xl border border-white/[0.06] p-3 ${note.pinned ? 'border-amber-500/20' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-full min-h-[40px] rounded-full flex-shrink-0 ${COLORS[note.color || 0]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400"><TgIcon size={9} /> {tg?.label}</span>
                        {note.targetName && <span className="text-[10px] text-zinc-500 font-semibold">{note.targetName}</span>}
                        {note.pinned && <Pin size={9} className="text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-300 whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] text-zinc-600">{note.author}</span>
                        <span className="text-[9px] text-zinc-700">{new Date(note.createdAt).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => togglePin(note.id)} className={`w-6 h-6 rounded flex items-center justify-center transition ${note.pinned ? 'text-amber-400' : 'text-zinc-700 hover:text-zinc-400'}`}><Pin size={10} /></button>
                      <button onClick={() => openEdit(note)} className="w-6 h-6 rounded flex items-center justify-center text-zinc-700 hover:text-zinc-400 transition"><Edit3 size={10} /></button>
                      <button onClick={() => deleteNote(note.id)} className="w-6 h-6 rounded flex items-center justify-center text-zinc-700 hover:text-rose-400 transition"><Trash2 size={10} /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/[0.1] rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-white">{editing ? 'Notu Duzenle' : 'Yeni Not'}</h3>
                <button onClick={() => setShowForm(false)} className="text-zinc-500"><X size={16} /></button>
              </div>
              <div className="flex gap-2">
                {TARGETS.map(t => (
                  <button key={t.key} onClick={() => setForm(p => ({ ...p, target: t.key }))}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition ${form.target === t.key ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 border border-white/[0.06]'}`}>
                    <t.icon size={11} /> {t.label}
                  </button>
                ))}
              </div>
              {form.target !== 'general' && (
                <input value={form.targetName} onChange={e => setForm(p => ({ ...p, targetName: e.target.value }))}
                  placeholder={form.target === 'user' ? 'Kullanici adi' : 'Is basligi'}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
              )}
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Not icerigi..." rows={4}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">Renk:</span>
                {COLORS.map((c, i) => (
                  <button key={i} onClick={() => setForm(p => ({ ...p, color: i }))}
                    className={`w-5 h-5 rounded-full ${c} ${form.color === i ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-50'}`} />
                ))}
              </div>
              <button onClick={handleSave} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition">Kaydet</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
