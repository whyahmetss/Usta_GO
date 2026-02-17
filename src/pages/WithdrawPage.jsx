import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Building, CreditCard, AlertCircle } from 'lucide-react'

function WithdrawPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [iban, setIban] = useState('')
  const [accountHolder, setAccountHolder] = useState(user?.name || '')
  const [error, setError] = useState('')

  const availableBalance = 12500
  const minWithdrawal = 100

  const handleQuickAmount = (value) => {
    setAmount(value.toString())
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const withdrawAmount = parseInt(amount)

    if (!amount || withdrawAmount <= 0) {
      setError('Lütfen geçerli bir tutar girin')
      return
    }

    if (withdrawAmount < minWithdrawal) {
      setError(`Minimum çekim tutarı ₺${minWithdrawal}`)
      return
    }

    if (withdrawAmount > availableBalance) {
      setError('Yetersiz bakiye')
      return
    }

    if (!bankName || !iban || !accountHolder) {
      setError('Lütfen tüm alanları doldurun')
      return
    }

    // Para çekme talebi oluştur (backend'e bağlanınca)
    alert(`₺${withdrawAmount} çekim talebi oluşturuldu! Admin onayından sonra hesabınıza yatırılacak.`)
    navigate('/wallet')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
            >
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
        {/* Bakiye Bilgisi */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-white/80 text-sm mb-1">Kullanılabilir Bakiye</p>
          <h2 className="text-4xl font-black mb-2">₺{availableBalance.toLocaleString()}</h2>
          <p className="text-white/70 text-xs">Minimum çekim: ₺{minWithdrawal}</p>
        </div>

        {/* Tutar Girişi */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-bold text-gray-900 mb-3">Çekilecek Tutar</label>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">₺</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
              placeholder="0"
              className="w-full pl-12 pr-4 py-4 text-3xl font-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Hızlı Tutar Seçimi */}
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickAmount(value)}
                className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition"
              >
                ₺{value}
              </button>
            ))}
          </div>
        </div>

        {/* Banka Bilgileri */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building size={20} className="text-gray-600" />
            <h3 className="font-bold text-gray-900">Banka Bilgileri</h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Banka Adı</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Örn: Ziraat Bankası"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">IBAN</label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              maxLength={32}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hesap Sahibi</label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Ad Soyad"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Bilgilendirme */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Önemli Bilgiler:</p>
            <ul className="space-y-1 text-xs">
              <li>• Para çekme talebiniz admin onayından sonra işleme alınır</li>
              <li>• İşlem süresi 1-3 iş günüdür</li>
              <li>• IBAN bilgilerinizi doğru girdiğinizden emin olun</li>
            </ul>
          </div>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!amount || parseInt(amount) <= 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition ${
            !amount || parseInt(amount) <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl'
          }`}
        >
          Para Çekme Talebi Oluştur
        </button>
      </form>
    </div>
  )
}

export default WithdrawPage
