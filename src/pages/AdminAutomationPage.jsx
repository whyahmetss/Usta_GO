import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Zap, Clock, UserCheck, AlertTriangle, DollarSign, Star,
  CheckCircle, XCircle, Save, Plus, Trash2, ToggleLeft, ToggleRight,
  Bell, ArrowRight, Shield,
} from 'lucide-react'

const DEFAULT_RULES = [
  {
    id: 'auto-assign',
    name: 'Otomatik Usta Atama',
    description: 'Yeni is talebi geldiginde en yakin musait ustayi otomatik ata',
    trigger: 'JOB_CREATED',
    action: 'ASSIGN_NEAREST_USTA',
    active: false,
    icon: UserCheck,
    color: 'bg-blue-500/10 text-blue-400',
  },
  {
    id: 'no-response-alert',
    name: 'Yanit Vermeme Uyarisi',
    description: 'Usta 30 dk icerisinde yanit vermezse musteriye bildirim gonder ve baska usta oner',
    trigger: 'NO_RESPONSE_30M',
    action: 'NOTIFY_CUSTOMER_SUGGEST_USTA',
    active: true,
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-400',
  },
  {
    id: 'auto-level-gold',
    name: 'Otomatik Gold Seviye',
    description: '50 is + 4.5+ ortalama puan = Gold seviye yukseltmesi',
    trigger: 'USTA_50_JOBS_4_5_RATING',
    action: 'UPGRADE_TO_GOLD',
    active: true,
    icon: Star,
    color: 'bg-amber-500/10 text-amber-400',
  },
  {
    id: 'auto-ban-cancel',
    name: 'Otomatik Askiya Alma',
    description: '3 ardisik iptal yapan ustayi gecici olarak askiya al',
    trigger: 'USTA_3_CONSECUTIVE_CANCEL',
    action: 'TEMP_SUSPEND',
    active: true,
    icon: Shield,
    color: 'bg-rose-500/10 text-rose-400',
  },
  {
    id: 'late-penalty',
    name: 'Gec Kalma Cezasi',
    description: '2 saatten fazla gec kalan usta icin otomatik %10 indirim',
    trigger: 'USTA_LATE_2H',
    action: 'AUTO_DISCOUNT_10',
    active: false,
    icon: AlertTriangle,
    color: 'bg-orange-500/10 text-orange-400',
  },
  {
    id: 'review-request',
    name: 'Degerlendirme Istegi',
    description: 'Is tamamlandiginda musteriden otomatik degerlendirme iste',
    trigger: 'JOB_COMPLETED',
    action: 'REQUEST_REVIEW',
    active: true,
    icon: Star,
    color: 'bg-violet-500/10 text-violet-400',
  },
  {
    id: 'inactive-reminder',
    name: 'Inaktif Musteri Hatirlatma',
    description: '7 gun aktif olmayan musteriye geri don bildirimi gonder',
    trigger: 'CUSTOMER_INACTIVE_7D',
    action: 'SEND_COMEBACK_NOTIFICATION',
    active: false,
    icon: Bell,
    color: 'bg-teal-500/10 text-teal-400',
  },
  {
    id: 'price-inflation',
    name: 'Enflasyon Fiyat Guncelleme',
    description: 'Her ay enflasyon oranina gore fiyatlari otomatik guncelle',
    trigger: 'MONTHLY_1ST',
    action: 'UPDATE_PRICES_INFLATION',
    active: false,
    icon: DollarSign,
    color: 'bg-emerald-500/10 text-emerald-400',
  },
]

export default function AdminAutomationPage() {
  const navigate = useNavigate()
  const [rules, setRules] = useState(() => {
    try { const s = localStorage.getItem('usta_automation_rules'); return s ? JSON.parse(s) : DEFAULT_RULES }
    catch { return DEFAULT_RULES }
  })
  const [saved, setSaved] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const toggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  const handleSave = () => {
    localStorage.setItem('usta_automation_rules', JSON.stringify(rules))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeCount = rules.filter(r => r.active).length
  const selected = selectedId ? rules.find(r => r.id === selectedId) : null

  return (
    <Layout hideNav>
      <PageHeader title="Otomasyon Kurallari" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 text-center">
            <p className="text-2xl font-black text-white">{rules.length}</p>
            <p className="text-[10px] text-zinc-500">Toplam Kural</p>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
            <p className="text-[10px] text-emerald-400/70">Aktif</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 text-center">
            <p className="text-2xl font-black text-zinc-400">{rules.length - activeCount}</p>
            <p className="text-[10px] text-zinc-500">Pasif</p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end mb-4">
          <button onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${
              saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
            }`}>
            {saved ? <><CheckCircle size={13} /> Kaydedildi</> : <><Save size={13} /> Kaydet</>}
          </button>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="space-y-4">
            <button onClick={() => setSelectedId(null)} className="text-xs text-blue-400 flex items-center gap-1 hover:underline">
              &larr; Tum Kurallar
            </button>
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selected.color || 'bg-zinc-800 text-zinc-400'}`}>
                  <Zap size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{selected.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{selected.description}</p>
                </div>
                <button onClick={() => toggleRule(selected.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${selected.active ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                  {selected.active ? 'AKTIF' : 'PASIF'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 mb-1">Tetikleyici</p>
                  <p className="text-xs font-mono text-blue-400">{selected.trigger}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 mb-1">Aksiyon</p>
                  <p className="text-xs font-mono text-emerald-400">{selected.action}</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-400/80">
                    Bu kural simdilik frontend tarafinda tanimlidir. Backend entegrasyonu sonraki fazda yapilacaktir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Rules list */
          <div className="space-y-2">
            {rules.map(rule => {
              const Icon = rule.icon || Zap
              return (
                <div
                  key={rule.id}
                  className={`bg-zinc-900 rounded-2xl border p-4 transition ${rule.active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rule.color || 'bg-zinc-800 text-zinc-400'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedId(rule.id)}>
                      <p className="text-xs font-semibold text-white">{rule.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{rule.description}</p>
                    </div>
                    <button onClick={() => toggleRule(rule.id)} className="flex-shrink-0">
                      {rule.active
                        ? <ToggleRight size={28} className="text-emerald-400" />
                        : <ToggleLeft size={28} className="text-zinc-600" />
                      }
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-2 ml-[52px]">
                    <span className="text-[9px] font-mono text-zinc-600">TRIGGER: {rule.trigger}</span>
                    <ArrowRight size={10} className="text-zinc-700" />
                    <span className="text-[9px] font-mono text-zinc-600">ACTION: {rule.action}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
