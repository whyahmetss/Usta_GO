import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { MessageCircle, UserCheck, UserX, ChevronLeft, Phone, Loader, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Layout from '../components/Layout'

const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_WHATSAPP || '905XXXXXXXXX' // .env: VITE_SUPPORT_WHATSAPP=905551234567
const SUPPORT_WHATSAPP = `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}`

export default function SupportDashboard() {
  const navigate = useNavigate()
  const [ustas, setUstas] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)

  const load = async () => {
    try {
      const r = await fetchAPI('/support/pending-ustas')
      setUstas(Array.isArray(r?.data) ? r.data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleApprove = async (userId) => {
    setActioning(userId)
    try {
      await fetchAPI(`/support/users/${userId}/approve-usta`, { method: 'PATCH' })
      await load()
    } catch (e) {
      alert(e.message || 'Onaylama hatası')
    } finally {
      setActioning(null)
    }
  }
  const handleReject = async (userId) => {
    if (!confirm('Bu ustayı reddetmek istediğinize emin misiniz?')) return
    setActioning(userId)
    try {
      await fetchAPI(`/support/users/${userId}/reject-usta`, { method: 'PATCH' })
      await load()
    } catch (e) {
      alert(e.message || 'Reddetme hatası')
    } finally {
      setActioning(null)
    }
  }

  return (
    <Layout hideNav>
      <PageHeader title="Canlı Destek" onBack={() => navigate('/')} />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Canlı destek bağlantısı */}
        <Card padding="p-4" className="!bg-primary-50 dark:!bg-primary-950/30 !border-primary-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-gray-100">Müşteri Hizmetleri</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sorunuz mu var? Bize ulaşın.</p>
            </div>
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition"
            >
              <Phone size={16} /> WhatsApp
            </a>
          </div>
        </Card>

        {/* Bekleyen ustalar */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Users size={16} /> Bekleyen Usta Başvuruları
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size={28} className="text-primary-500 animate-spin" />
            </div>
          ) : ustas.length === 0 ? (
            <Card padding="p-8">
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm">Bekleyen başvuru yok</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {ustas.map(u => (
                <Card key={u.id} padding="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {u.certificates?.[0]?.fileUrl && (
                        <a href={u.certificates[0].fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 mt-1 inline-block">Belgeyi Gör</a>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={actioning === u.id}
                        className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {actioning === u.id ? <Loader size={16} className="animate-spin" /> : <UserCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        disabled={actioning === u.id}
                        className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 disabled:opacity-50"
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
