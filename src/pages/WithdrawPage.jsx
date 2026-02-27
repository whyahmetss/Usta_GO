import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, Building, AlertCircle } from 'lucide-react'

function WithdrawPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [iban, setIban] = useState('')
  const [accountHolder, setAccountHolder] = useState(user?.name || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [balance, setBalance] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)

  const minWithdrawal = 100

  // Load wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading(true)
        const jobsResponse = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
        if (jobsResponse?.data && Array.isArray(jobsResponse.data)) {
          const mapped = mapJobsFromBackend(jobsResponse.data)
          const myJobs = mapped.filter(j =>
            j.ustaId === user?.id &&
            (j.status === 'completed' || j.status === 'rated')
          )
          const totalBalance = myJobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0)
          setBalance(totalBalance)
        }
      } catch (err) {
        console.error('Load wallet error:', err)
        setError('Cuzdan verisi yuklenemedi')
      } finally {
        setLoading(false)
      }
    }

    if (user) loadWalletData()
  }, [user])

  const availableBalance = balance - pendingAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const withdrawAmount = parseInt(amount)
    if (!amount || withdrawAmount <= 0) { setError('Lutfen gecerli bir tutar girin'); return }
    if (withdrawAmount < minWithdrawal) { setError(`Minimum cekim tutari ${minWithdrawal} TL`); return }
    if (withdrawAmount > availableBalance) { setError('Yetersiz bakiye'); return }
    if (!bankName || !iban || !accountHolder) { setError('Lutfen tum alanlari doldurun'); return }

    setSubmitting(true)

    try {
      const response = await fetchAPI(API_ENDPOINTS.WALLET.WITHDRAW, {
        method: 'POST',
        body: {
          amount: withdrawAmount,
          bankName,
          iban,
          accountHolder
        }
      })

      if (response.data) {
        alert(`${withdrawAmount} TL Çekim talebi oluşturuldu! Yetkili onayından sonra hesabınıza yatırılacak.`)
        navigate('/wallet')
      }
    } catch (err) {
      console.error('Withdrawal error:', err)
      setError(err.message || 'Para çekme talebi oluşturulamadı')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cüzdan yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Para Çek</h1>
              <p className="text-xs text-gray-500">Kazancınızı hesabınıza aktarın</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-white/80 text-sm mb-1">Kullanılabilir Bakiye</p>
          <h2 className="text-4xl font-black mb-2">{availableBalance.toLocaleString('tr-TR')} TL</h2>
          <p className="text-white/70 text-xs">Minimum çekim: {minWithdrawal} TL</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-bold text-gray-900 mb-3">Çekilecek Tutar</label>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">TL</span>
            <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setError('') }} placeholder="0"
              className="w-full pl-14 pr-4 py-4 text-3xl font-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map(value => (
              <button key={value} type="button" onClick={() => { setAmount(value.toString()); setError('') }}
                className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition">{value} TL</button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building size={20} className="text-gray-600" />
            <h3 className="font-bold text-gray-900">Banka Bilgileri</h3>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Banka Adı</label>
            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Örneğin: Ziraat Bankasi"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">IBAN</label>
            <input type="text" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" maxLength={32}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hesap Sahibi</label>
            <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Ad Soyad"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Önemli Bilgiler:</p>
            <ul className="space-y-1 text-xs">
              <li>Para çekme talebiniz Yönetici onayından sonra işleme alınır</li>
              <li>İşlem süresi 1-3 iş günüdür</li>
            </ul>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm font-semibold">{error}</p></div>}

        <button type="submit" disabled={!amount || parseInt(amount) <= 0 || submitting}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 ${
            !amount || parseInt(amount) <= 0 || submitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl'
          }`}>
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Isleniyor...
            </>
          ) : (
            'Para Çekme Talebi Oluştur'
          )}
        </button>
      </form>
    </div>
  )
}

export default WithdrawPage
