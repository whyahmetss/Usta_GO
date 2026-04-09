import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Settings, ToggleLeft, ToggleRight, Save, CheckCircle,
  Shield, Wrench, Smartphone, Globe, Database, AlertTriangle,
  Zap, Eye, Lock, Server, RefreshCw, Bell,
} from 'lucide-react'

const DEFAULT_FLAGS = [
  { id: 'maintenance', name: 'Bakim Modu', desc: 'Platformu bakima al - kullanicilar erisemez', active: false, icon: Wrench, color: 'bg-rose-500/10 text-rose-400', critical: true },
  { id: 'force_update', name: 'Zorla Guncelleme', desc: 'Eski versiyon kullanicilari guncellemeye zorla', active: false, icon: Smartphone, color: 'bg-amber-500/10 text-amber-400', critical: true },
  { id: 'new_onboarding', name: 'Yeni Onboarding', desc: 'Yeni kullanici karsilama akisini aktif et', active: false, icon: Zap, color: 'bg-blue-500/10 text-blue-400', critical: false },
  { id: 'ai_pricing', name: 'AI Fiyatlandirma', desc: 'Yapay zeka destekli fiyat onerisini goster', active: true, icon: Zap, color: 'bg-violet-500/10 text-violet-400', critical: false },
  { id: 'live_support', name: 'Canli Destek', desc: 'Canli destek sohbet widgetini goster', active: true, icon: Bell, color: 'bg-teal-500/10 text-teal-400', critical: false },
  { id: 'push_notifications', name: 'Push Bildirimler', desc: 'Push bildirim gondermini aktif et', active: true, icon: Bell, color: 'bg-blue-500/10 text-blue-400', critical: false },
  { id: 'referral_bonus', name: 'Davet Bonusu', desc: 'Arkadas davet bonusu sistemini aktif et', active: true, icon: Globe, color: 'bg-emerald-500/10 text-emerald-400', critical: false },
  { id: 'usta_levels', name: 'Usta Seviye Sistemi', desc: 'Bronze/Silver/Gold/Platinum seviye gosterimini aktif et', active: false, icon: Shield, color: 'bg-amber-500/10 text-amber-400', critical: false },
  { id: 'dynamic_pricing', name: 'Dinamik Fiyatlandirma', desc: 'Hafta sonu / gece / acil fiyat carpanlarini aktif et', active: false, icon: Zap, color: 'bg-orange-500/10 text-orange-400', critical: false },
  { id: 'auto_assign', name: 'Otomatik Usta Atama', desc: 'En yakin musait ustayi otomatik ata', active: false, icon: Zap, color: 'bg-blue-500/10 text-blue-400', critical: false },
]

const DEFAULT_CONFIG = {
  appVersion: '1.5.0',
  minVersion: '1.2.0',
  platformName: 'UstaGO',
  commissionRate: 12,
  maxJobDistance: 25,
  supportEmail: 'destek@usta-go.com',
  supportPhone: '0850 XXX XX XX',
}

export default function AdminSystemConfigPage() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('flags')

  const [flags, setFlags] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_feature_flags') || 'null') || DEFAULT_FLAGS }
    catch { return DEFAULT_FLAGS }
  })

  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_system_config') || 'null') || DEFAULT_CONFIG }
    catch { return DEFAULT_CONFIG }
  })

  const toggleFlag = (id) => {
    const flag = flags.find(f => f.id === id)
    if (flag?.critical && !flag.active) {
      if (!confirm(`"${flag.name}" kritik bir ozelliktir. Aktif etmek istediginize emin misiniz?`)) return
    }
    setFlags(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f))
  }

  const handleSave = () => {
    localStorage.setItem('usta_feature_flags', JSON.stringify(flags))
    localStorage.setItem('usta_system_config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeFlags = flags.filter(f => f.active).length

  return (
    <Layout hideNav>
      <PageHeader title="Sistem Konfigurasyonu" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 text-center">
            <p className="text-2xl font-black text-white">{flags.length}</p>
            <p className="text-[10px] text-zinc-500">Toplam Flag</p>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">{activeFlags}</p>
            <p className="text-[10px] text-emerald-400/70">Aktif</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 text-center">
            <p className="text-2xl font-black text-zinc-400">{config.appVersion}</p>
            <p className="text-[10px] text-zinc-500">Versiyon</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5">
          {[
            { key: 'flags', label: 'Feature Flags', icon: Zap },
            { key: 'config', label: 'Genel Ayarlar', icon: Settings },
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
          <button onClick={handleSave} className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
            {saved ? <><CheckCircle size={12} /> Kaydedildi</> : <><Save size={12} /> Kaydet</>}
          </button>
        </div>

        {/* Feature Flags */}
        {tab === 'flags' && (
          <div className="space-y-2">
            {flags.map(flag => {
              const Icon = flag.icon || Zap
              return (
                <div key={flag.id} className={`bg-zinc-900 rounded-2xl border p-4 transition ${flag.active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${flag.color || 'bg-zinc-800 text-zinc-400'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white">{flag.name}</p>
                        {flag.critical && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">KRITIK</span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500">{flag.desc}</p>
                    </div>
                    <button onClick={() => toggleFlag(flag.id)} className="flex-shrink-0">
                      {flag.active
                        ? <ToggleRight size={28} className="text-emerald-400" />
                        : <ToggleLeft size={28} className="text-zinc-600" />
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Config */}
        {tab === 'config' && (
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 space-y-4">
            {[
              { key: 'platformName', label: 'Platform Adi', type: 'text' },
              { key: 'appVersion', label: 'Uygulama Versiyonu', type: 'text' },
              { key: 'minVersion', label: 'Minimum Desteklenen Versiyon', type: 'text' },
              { key: 'commissionRate', label: 'Varsayilan Komisyon Orani (%)', type: 'number' },
              { key: 'maxJobDistance', label: 'Maks Is Mesafesi (km)', type: 'number' },
              { key: 'supportEmail', label: 'Destek E-posta', type: 'text' },
              { key: 'supportPhone', label: 'Destek Telefon', type: 'text' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">{field.label}</label>
                <input
                  type={field.type}
                  value={config[field.key] || ''}
                  onChange={e => setConfig(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                />
              </div>
            ))}

            <div className="pt-3 border-t border-white/[0.06]">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-400/80">
                    Bu ayarlar simdilik localStorage'a kaydedilir. Backend entegrasyonu sonraki fazda yapilacaktir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
