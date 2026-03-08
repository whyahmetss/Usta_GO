import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { Building, AlertCircle } from 'lucide-react'

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

        // İşlerden toplam kazanç
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

        // Gerçek kullanılabilir bakiyeyi backend'den al (onaylanan çekimler dahil düşülmüş)
        try {
          const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET)
          if (walletRes?.data) {
            setBalance(walletRes.data.balance || 0)
            setPendingAmount(walletRes.data.pendingWithdrawal || 0)
          }
        } catch {
          // jobs'tan set edilen balance kalır
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

  // balance backend'den geliyor (onaylanan + bekleyen çekimler zaten düşülmüş)
  const availableBalance = balance

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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Cüzdan yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50">
      <PageHeader title="Para Çek" onBack={() => navigate(-1)} />

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-5">
        <Card padding="p-5" className="border-primary-100 bg-primary-50/50">
          <p className="text-primary-600 text-xs font-semibold mb-1">Kullanılabilir Bakiye</p>
          <h2 className="text-3xl font-bold text-primary-600 mb-1">{availableBalance.toLocaleString('tr-TR')} TL</h2>
          <p className="text-gray-500 text-[11px]">Minimum çekim: {minWithdrawal} TL</p>
        </Card>

        <Card padding="p-5">
          <label className="block text-xs font-semibold text-gray-600 mb-3">Çekilecek Tutar</label>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">TL</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError('') }}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => { setAmount(value.toString()); setError('') }}
                className="py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition active:scale-[0.98]"
              >
                {value} TL
              </button>
            ))}
          </div>
        </Card>

        <Card padding="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building size={18} className="text-primary-500" />
            <h3 className="text-lg font-bold text-gray-900">Banka Bilgileri</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Banka Adı</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Örneğin: Ziraat Bankasi"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">IBAN</label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                maxLength={32}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Hesap Sahibi</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm"
              />
            </div>
          </div>
        </Card>

        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-900">
            <p className="font-semibold text-xs mb-1">Önemli Bilgiler:</p>
            <ul className="space-y-1 text-[11px]">
              <li>Para çekme talebiniz Yönetici onayından sonra işleme alınır</li>
              <li>İşlem süresi 1-3 iş günüdür</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <p className="text-rose-700 text-sm font-semibold">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!amount || parseInt(amount) <= 0 || submitting}
          className={`w-full py-4 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 active:scale-[0.98] ${
            !amount || parseInt(amount) <= 0 || submitting
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 shadow-card'
          }`}
        >
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
