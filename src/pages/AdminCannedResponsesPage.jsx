import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  MessageCircle, Plus, Search, X, Trash2, Edit3, Copy,
  CheckCircle, Tag, Zap,
} from 'lucide-react'

const LS_KEY = 'usta_canned_responses'

const DEFAULT = [
  { id: 1, title: 'Is Iptal Bildirimi', category: 'Iptal', shortcut: '/iptal', content: 'Merhaba, isiniz iptal edilmistir. Odemeniz 3 is gunu icinde iade edilecektir. Anlayisiniz icin tesekkur ederiz.', usageCount: 0 },
  { id: 2, title: 'Usta Onay', category: 'Onay', shortcut: '/onay', content: 'Merhaba, usta basvurunuz onaylanmistir. Artik is tekliflerini gorebilir ve kabul edebilirsiniz. Basarilar dileriz!', usageCount: 0 },
  { id: 3, title: 'Belge Eksik', category: 'Belge', shortcut: '/belge', content: 'Merhaba, basvurunuzda eksik belge tespit edilmistir. Lutfen profil sayfanizdan gerekli belgeleri yukleyin.', usageCount: 0 },
  { id: 4, title: 'Sikayet Cozuldu', category: 'Sikayet', shortcut: '/cozuldu', content: 'Merhaba, sikayetiniz incelenmis ve cozume kavusturulmustur. Herhangi bir sorunuz olursa tekrar iletisime gecebilirsiniz.', usageCount: 0 },
  { id: 5, title: 'Iade Bilgilendirme', category: 'Finans', shortcut: '/iade', content: 'Merhaba, iade talebiniz isleme alinmistir. Tutar 3-5 is gunu icinde hesabiniza yansiyacaktir.', usageCount: 0 },
  { id: 6, title: 'Teknik Destek', category: 'Destek', shortcut: '/teknik', content: 'Merhaba, bildirdiginiz teknik sorun ekibimiz tarafindan incelenmektedir. En kisa surede cozum saglanacaktir.', usageCount: 0 },
  { id: 7, title: 'Hosgeldin Mesaji', category: 'Genel', shortcut: '/hosgeldin', content: 'Usta Go\'ya hosgeldiniz! Platformumuzu kullanarak eviniz icin en iyi ustalari bulabilirsiniz. Yardima ihtiyaciniz olursa destek ekibimiz her zaman yaninizdadir.', usageCount: 0 },
]

const CATEGORIES = ['Tumuu', 'Iptal', 'Onay', 'Belge', 'Sikayet', 'Finans', 'Destek', 'Genel']

export default function AdminCannedResponsesPage() {
  const navigate = useNavigate()
  const [responses, setResponses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || DEFAULT } catch { return DEFAULT }
  })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Tumuu')
  const [copied, setCopied] = useState(null)
  const [form, setForm] = useState({ title: '', category: 'Genel', shortcut: '', content: '' })

  const persist = (next) => { setResponses(next); localStorage.setItem(LS_KEY, JSON.stringify(next)) }

  const filtered = useMemo(() => {
    return responses.filter(r => {
      if (catFilter !== 'Tumuu' && r.category !== catFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q) || r.shortcut.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => b.usageCount - a.usageCount)
  }, [responses, search, catFilter])

  const handleSave = () => {
    if (!form.title || !form.content) return
    if (editing) {
      persist(responses.map(r => r.id === editing ? { ...r, ...form } : r))
    } else {
      persist([{ ...form, id: Date.now(), usageCount: 0 }, ...responses])
    }
    setShowForm(false); setEditing(null)
    setForm({ title: '', category: 'Genel', shortcut: '', content: '' })
  }

  const openEdit = (r) => {
    setForm({ title: r.title, category: r.category, shortcut: r.shortcut, content: r.content })
    setEditing(r.id); setShowForm(true)
  }

  const deleteResponse = (id) => { if (confirm('Bu sablonu silmek istediginize emin misiniz?')) persist(responses.filter(r => r.id !== id)) }

  const copyToClipboard = (r) => {
    navigator.clipboard.writeText(r.content).then(() => {
      setCopied(r.id)
      setTimeout(() => setCopied(null), 2000)
      persist(responses.map(res => res.id === r.id ? { ...res, usageCount: (res.usageCount || 0) + 1 } : res))
    })
  }

  return (
    <Layout hideNav>
      <PageHeader title="Hazir Yanitlar" onBack={() => navigate('/admin')} rightAction={
        <button onClick={() => { setEditing(null); setForm({ title: '', category: 'Genel', shortcut: '', content: '' }); setShowForm(true) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 text-white"><Plus size={16} /></button>
      } />
      <div className="max-w-5xl mx-auto px-4 pb-10">

        <div className="grid grid-cols-3 gap-3 mt-4 mb-5">
          <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-black text-white">{responses.length}</p>
            <p className="text-[10px] text-zinc-500">Sablon</p>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-black text-blue-400">{new Set(responses.map(r => r.category)).size}</p>
            <p className="text-[10px] text-zinc-500">Kategori</p>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-black text-emerald-400">{responses.reduce((s, r) => s + (r.usageCount || 0), 0)}</p>
            <p className="text-[10px] text-zinc-500">Kullanim</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${catFilter === c ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sablon veya kisayol ara..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={MessageCircle} title="Sablon yok" description="Yeni bir hazir yanit sablonu olusturun"
            action={<button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Sablon Olustur</button>} />
        ) : (
          <div className="space-y-2">
            {filtered.map(r => (
              <div key={r.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-white">{r.title}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">{r.category}</span>
                    {r.shortcut && <code className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{r.shortcut}</code>}
                  </div>
                  <span className="text-[9px] text-zinc-600 flex-shrink-0">{r.usageCount || 0}x</span>
                </div>
                <p className="text-[11px] text-zinc-400 bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.03] mb-3 whitespace-pre-wrap">{r.content}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => copyToClipboard(r)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition ${copied === r.id ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white active:scale-[0.98]'}`}>
                    {copied === r.id ? <><CheckCircle size={10} /> Kopyalandi!</> : <><Copy size={10} /> Kopyala</>}
                  </button>
                  <button onClick={() => openEdit(r)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-[10px] text-zinc-400 hover:bg-white/[0.08] transition">
                    <Edit3 size={10} /> Duzenle
                  </button>
                  <button onClick={() => deleteResponse(r.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-[10px] text-rose-400 hover:bg-rose-500/20 transition">
                    <Trash2 size={10} /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/[0.1] rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-white">{editing ? 'Sablonu Duzenle' : 'Yeni Sablon'}</h3>
                <button onClick={() => setShowForm(false)} className="text-zinc-500"><X size={16} /></button>
              </div>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Sablon adi"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-zinc-400 focus:outline-none">
                  {CATEGORIES.filter(c => c !== 'Tumuu').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={form.shortcut} onChange={e => setForm(p => ({ ...p, shortcut: e.target.value }))} placeholder="Kisayol (/iptal)"
                  className="px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
              </div>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Yanit metni..." rows={5}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none" />
              <button onClick={handleSave} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition">Kaydet</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
