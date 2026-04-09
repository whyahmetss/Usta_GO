import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  Bell, Send, Users, UserCheck, Clock, Plus, Trash2,
  CheckCircle, Save, ToggleLeft, ToggleRight, Zap, Mail,
  Smartphone, MessageSquare, Calendar, Target,
} from 'lucide-react'

const SEGMENTS = [
  { key: 'all', label: 'Tum Kullanicilar' },
  { key: 'customers', label: 'Musteriler' },
  { key: 'ustas', label: 'Ustalar' },
  { key: 'inactive_7d', label: '7 Gun Inaktif' },
  { key: 'inactive_30d', label: '30 Gun Inaktif' },
  { key: 'vip', label: 'VIP (5+ is)' },
  { key: 'new', label: 'Yeni (son 7 gun)' },
]

const TRIGGER_TEMPLATES = [
  { id: 'job_complete', name: 'Is Tamamlandi', message: 'Isiniz tamamlandi! Degerlendirme yapmayi unutmayin.', trigger: 'JOB_COMPLETED', active: true },
  { id: 'review_remind', name: 'Degerlendirme Hatirlatma', message: 'Gecen haftaki isinizi degerlendirdiniz mi?', trigger: 'NO_REVIEW_7D', active: false },
  { id: 'comeback', name: 'Geri Don Kampanyasi', message: 'Sizi ozledik! Ilk ise %20 indirim.', trigger: 'INACTIVE_30D', active: false },
  { id: 'welcome', name: 'Hosgeldiniz', message: 'UstaGO ailesine hosgeldiniz! Ilk isinizi hemen olusturun.', trigger: 'USER_REGISTERED', active: true },
  { id: 'usta_new_job', name: 'Yeni Is Bildirimi', message: 'Bolgenizde yeni bir is talebi var!', trigger: 'JOB_CREATED_NEARBY', active: true },
]

export default function AdminNotificationHubPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('compose')
  const [saved, setSaved] = useState(false)

  // Compose
  const [segment, setSegment] = useState('all')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [channel, setChannel] = useState('push')
  const [scheduled, setScheduled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [sent, setSent] = useState(false)

  // Triggers
  const [triggers, setTriggers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_notif_triggers') || 'null') || TRIGGER_TEMPLATES }
    catch { return TRIGGER_TEMPLATES }
  })

  // History
  const [history] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_notif_history') || '[]') }
    catch { return [] }
  })

  const handleSend = () => {
    if (!title || !body) { alert('Baslik ve mesaj zorunlu'); return }
    const entry = { id: Date.now(), title, body, segment, channel, date: scheduled ? scheduleDate : new Date().toISOString(), status: scheduled ? 'scheduled' : 'sent' }
    const newHistory = [entry, ...history]
    localStorage.setItem('usta_notif_history', JSON.stringify(newHistory))
    setSent(true)
    setTimeout(() => { setSent(false); setTitle(''); setBody('') }, 2000)
  }

  const toggleTrigger = (id) => {
    const updated = triggers.map(t => t.id === id ? { ...t, active: !t.active } : t)
    setTriggers(updated)
    localStorage.setItem('usta_notif_triggers', JSON.stringify(updated))
  }

  return (
    <Layout hideNav>
      <PageHeader title="Bildirim Merkezi" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Tabs */}
        <div className="flex gap-2 mt-4 mb-5">
          {[
            { key: 'compose', label: 'Gonder', icon: Send },
            { key: 'triggers', label: 'Otomatik', icon: Zap },
            { key: 'history', label: 'Gecmis', icon: Clock },
          ].map(t => {
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
        </div>

        {/* Compose */}
        {tab === 'compose' && (
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 space-y-4">
            <div>
              <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Hedef Segment</label>
              <div className="flex flex-wrap gap-1.5">
                {SEGMENTS.map(s => (
                  <button key={s.key} onClick={() => setSegment(s.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                      segment === s.key ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-zinc-400 border border-white/[0.04]'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Kanal</label>
              <div className="flex gap-2">
                {[
                  { key: 'push', label: 'Push', icon: Smartphone },
                  { key: 'sms', label: 'SMS', icon: MessageSquare },
                  { key: 'email', label: 'E-posta', icon: Mail },
                ].map(c => {
                  const Icon = c.icon
                  return (
                    <button key={c.key} onClick={() => setChannel(c.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        channel === c.key ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-zinc-400 border border-white/[0.04]'
                      }`}>
                      <Icon size={13} /> {c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Baslik</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Bildirim basligi"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Mesaj</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Bildirim icerigi"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none h-24" />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setScheduled(!scheduled)} className="flex items-center gap-1.5">
                {scheduled ? <ToggleRight size={22} className="text-blue-400" /> : <ToggleLeft size={22} className="text-zinc-600" />}
                <span className="text-xs text-zinc-400">Zamanli Gonderim</span>
              </button>
              {scheduled && (
                <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white focus:outline-none" />
              )}
            </div>

            <button onClick={handleSend} disabled={sent}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition active:scale-[0.98] flex items-center justify-center gap-2 ${
                sent ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}>
              {sent ? <><CheckCircle size={16} /> Gonderildi!</> : <><Send size={16} /> {scheduled ? 'Zamanla' : 'Simdi Gonder'}</>}
            </button>
          </div>
        )}

        {/* Triggers */}
        {tab === 'triggers' && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 mb-3">Otomatik bildirim tetikleyicileri</p>
            {triggers.map(t => (
              <div key={t.id} className={`bg-zinc-900 rounded-2xl border p-4 transition ${t.active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${t.active ? 'bg-amber-500/10' : 'bg-zinc-800'}`}>
                    <Zap size={14} className={t.active ? 'text-amber-400' : 'text-zinc-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{t.message}</p>
                    <p className="text-[9px] font-mono text-zinc-600 mt-0.5">{t.trigger}</p>
                  </div>
                  <button onClick={() => toggleTrigger(t.id)}>
                    {t.active ? <ToggleRight size={28} className="text-emerald-400" /> : <ToggleLeft size={28} className="text-zinc-600" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <EmptyState icon={Clock} title="Gecmis bos" description="Gonderilen bildirimler burada listelenecek" />
            ) : history.map(h => (
              <div key={h.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Bell size={14} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{h.title}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{h.body}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${h.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {h.status === 'sent' ? 'Gonderildi' : 'Zamanlandi'}
                  </span>
                  <p className="text-[9px] text-zinc-600 mt-0.5">{new Date(h.date).toLocaleString('tr-TR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
