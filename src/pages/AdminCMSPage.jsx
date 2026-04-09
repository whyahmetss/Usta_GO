import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  FileText, HelpCircle, Bell, Plus, Edit3, Trash2, Save,
  CheckCircle, Eye, EyeOff, Calendar, ChevronRight, Search,
  Globe, BookOpen, Megaphone, X,
} from 'lucide-react'

const TABS = [
  { key: 'announcements', label: 'Duyurular', icon: Bell },
  { key: 'faq', label: 'SSS', icon: HelpCircle },
  { key: 'pages', label: 'Sayfalar', icon: Globe },
]

export default function AdminCMSPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('announcements')
  const [saved, setSaved] = useState(false)

  // Announcements
  const [announcements, setAnnouncements] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_cms_announcements') || '[]') } catch { return [] }
  })
  const [editAnn, setEditAnn] = useState(null)

  // FAQ
  const [faqs, setFaqs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_cms_faq') || '[]') } catch { return [] }
  })
  const [editFaq, setEditFaq] = useState(null)

  // Pages
  const [pages, setPages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_cms_pages') || '[]') } catch { return [] }
  })
  const [editPage, setEditPage] = useState(null)

  const saveAll = () => {
    localStorage.setItem('usta_cms_announcements', JSON.stringify(announcements))
    localStorage.setItem('usta_cms_faq', JSON.stringify(faqs))
    localStorage.setItem('usta_cms_pages', JSON.stringify(pages))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Announcement CRUD
  const addAnnouncement = () => setEditAnn({ id: `a${Date.now()}`, title: '', body: '', active: true, date: new Date().toISOString().slice(0, 10) })
  const saveAnnouncement = () => {
    if (!editAnn?.title) return
    setAnnouncements(prev => { const exists = prev.find(a => a.id === editAnn.id); return exists ? prev.map(a => a.id === editAnn.id ? editAnn : a) : [...prev, editAnn] })
    setEditAnn(null)
  }
  const deleteAnnouncement = (id) => setAnnouncements(prev => prev.filter(a => a.id !== id))

  // FAQ CRUD
  const addFaq = () => setEditFaq({ id: `f${Date.now()}`, question: '', answer: '', active: true })
  const saveFaq = () => {
    if (!editFaq?.question) return
    setFaqs(prev => { const exists = prev.find(f => f.id === editFaq.id); return exists ? prev.map(f => f.id === editFaq.id ? editFaq : f) : [...prev, editFaq] })
    setEditFaq(null)
  }
  const deleteFaq = (id) => setFaqs(prev => prev.filter(f => f.id !== id))

  // Pages CRUD
  const addPage = () => setEditPage({ id: `p${Date.now()}`, title: '', slug: '', body: '', active: true })
  const savePage = () => {
    if (!editPage?.title) return
    setPages(prev => { const exists = prev.find(p => p.id === editPage.id); return exists ? prev.map(p => p.id === editPage.id ? editPage : p) : [...prev, editPage] })
    setEditPage(null)
  }
  const deletePage = (id) => setPages(prev => prev.filter(p => p.id !== id))

  return (
    <Layout hideNav>
      <PageHeader title="Icerik Yonetimi" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-4 mb-5">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  tab === t.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
                }`}>
                <Icon size={13} /> {t.label}
              </button>
            )
          })}
          <button onClick={saveAll} className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
            {saved ? <><CheckCircle size={12} /> Kaydedildi</> : <><Save size={12} /> Tumu Kaydet</>}
          </button>
        </div>

        {/* Announcements */}
        {tab === 'announcements' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">{announcements.length} duyuru</p>
              <button onClick={addAnnouncement} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white active:scale-[0.98]">
                <Plus size={12} /> Yeni Duyuru
              </button>
            </div>

            {editAnn && (
              <div className="bg-zinc-900 rounded-2xl border border-blue-500/30 p-4 space-y-3">
                <input value={editAnn.title} onChange={e => setEditAnn({ ...editAnn, title: e.target.value })} placeholder="Duyuru basligi"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
                <textarea value={editAnn.body} onChange={e => setEditAnn({ ...editAnn, body: e.target.value })} placeholder="Duyuru icerigi"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none h-24" />
                <div className="flex gap-2">
                  <button onClick={saveAnnouncement} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold active:scale-[0.98]">Kaydet</button>
                  <button onClick={() => setEditAnn(null)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-xs font-semibold">Iptal</button>
                </div>
              </div>
            )}

            {announcements.length === 0 && !editAnn ? (
              <EmptyState icon={Bell} title="Duyuru yok" description="Ilk duyurunuzu olusturun" />
            ) : announcements.map(a => (
              <div key={a.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Bell size={14} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{a.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{a.body}</p>
                  <p className="text-[9px] text-zinc-600 mt-1">{a.date}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditAnn(a)} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"><Edit3 size={12} className="text-zinc-400" /></button>
                  <button onClick={() => deleteAnnouncement(a.id)} className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center"><Trash2 size={12} className="text-rose-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        {tab === 'faq' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">{faqs.length} soru</p>
              <button onClick={addFaq} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white active:scale-[0.98]">
                <Plus size={12} /> Yeni Soru
              </button>
            </div>

            {editFaq && (
              <div className="bg-zinc-900 rounded-2xl border border-blue-500/30 p-4 space-y-3">
                <input value={editFaq.question} onChange={e => setEditFaq({ ...editFaq, question: e.target.value })} placeholder="Soru"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
                <textarea value={editFaq.answer} onChange={e => setEditFaq({ ...editFaq, answer: e.target.value })} placeholder="Cevap"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none h-20" />
                <div className="flex gap-2">
                  <button onClick={saveFaq} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold active:scale-[0.98]">Kaydet</button>
                  <button onClick={() => setEditFaq(null)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-xs font-semibold">Iptal</button>
                </div>
              </div>
            )}

            {faqs.length === 0 && !editFaq ? (
              <EmptyState icon={HelpCircle} title="SSS bos" description="Sik sorulan sorulari ekleyin" />
            ) : faqs.map(f => (
              <div key={f.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle size={14} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{f.question}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{f.answer}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditFaq(f)} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"><Edit3 size={12} className="text-zinc-400" /></button>
                    <button onClick={() => deleteFaq(f.id)} className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center"><Trash2 size={12} className="text-rose-400" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Static pages */}
        {tab === 'pages' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">{pages.length} sayfa (KVKK, Kullanim Sartlari vb.)</p>
              <button onClick={addPage} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white active:scale-[0.98]">
                <Plus size={12} /> Yeni Sayfa
              </button>
            </div>

            {editPage && (
              <div className="bg-zinc-900 rounded-2xl border border-blue-500/30 p-4 space-y-3">
                <input value={editPage.title} onChange={e => setEditPage({ ...editPage, title: e.target.value })} placeholder="Sayfa basligi"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
                <input value={editPage.slug} onChange={e => setEditPage({ ...editPage, slug: e.target.value })} placeholder="URL slug (ornek: kullanim-sartlari)"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
                <textarea value={editPage.body} onChange={e => setEditPage({ ...editPage, body: e.target.value })} placeholder="Sayfa icerigi"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none h-40" />
                <div className="flex gap-2">
                  <button onClick={savePage} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold active:scale-[0.98]">Kaydet</button>
                  <button onClick={() => setEditPage(null)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-xs font-semibold">Iptal</button>
                </div>
              </div>
            )}

            {pages.length === 0 && !editPage ? (
              <EmptyState icon={Globe} title="Sayfa yok" description="Yasal metinleri ve bilgi sayfalarini olusturun" />
            ) : pages.map(p => (
              <div key={p.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <Globe size={14} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{p.title}</p>
                  <p className="text-[10px] text-zinc-500">/{p.slug}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditPage(p)} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"><Edit3 size={12} className="text-zinc-400" /></button>
                  <button onClick={() => deletePage(p.id)} className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center"><Trash2 size={12} className="text-rose-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
