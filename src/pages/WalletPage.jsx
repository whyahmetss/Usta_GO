import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, TrendingUp, Plus, Tag, CreditCard, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react'

function WalletPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Usta State'leri
  const [balance, setBalance] = useState(0)
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0)
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0)
  const [lastMonthEarnings, setLastMonthEarnings] = useState(0)
  const [transactions, setTransactions] = useState([])

  // Müşteri State'leri
  const [customerBalance, setCustomerBalance] = useState(0)
  const [customerCoupons, setCustomerCoupons] = useState([])
  const [customerTransactions, setCustomerTransactions] = useState([])
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMsg, setCouponMsg] = useState(null)

  // Paket State'leri
  const [activePackage, setActivePackage] = useState(null)
  const [packageLoading, setPackageLoading] = useState(false)
  const [packageMsg, setPackageMsg] = useState(null)
  const [showPackageSelection, setShowPackageSelection] = useState(false)

  const PACKAGES = [
    {
      id: 'klasik',
      name: 'Klasik',
      price: 499,
      badgeColor: 'bg-gray-100 text-gray-700',
      headerColor: 'from-gray-500 to-gray-600',
      badge: '🏠',
      tag: 'Başlangıç',
      tagColor: 'bg-gray-100 text-gray-600',
      features: [
        'Elektrik kontrol (2 ayda 1)',
        'Su tesisat kontrolü (3 ayda 1)',
        'Sigorta panosu kontrolü (yılda 1)',
        'Standart usta atama',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 999,
      badgeColor: 'bg-blue-100 text-blue-700',
      headerColor: 'from-blue-500 to-blue-700',
      badge: '⚡',
      tag: 'Popüler',
      tagColor: 'bg-blue-100 text-blue-600',
      features: [
        'Elektrik + sigorta panosu (aylık)',
        'Su tesisat basınç kontrolü (2 ayda 1)',
        'Kaçak akım testi (3 ayda 1)',
        'Öncelikli usta atama',
      ],
    },
    {
      id: 'plus',
      name: 'Plus',
      price: 1999,
      badgeColor: 'bg-amber-100 text-amber-700',
      headerColor: 'from-amber-500 to-orange-500',
      badge: '👑',
      tag: 'En İyi Değer',
      tagColor: 'bg-amber-100 text-amber-600',
      features: [
        'Tüm Pro hizmetleri dahil',
        'Kombi / klima bakımı (6 ayda 1)',
        'Kaçak akım testi (aylık)',
        'VIP öncelikli usta atama',
        '7/24 acil yardım hattı',
      ],
    },
  ]

useEffect(() => {
  const loadWalletData = async () => {
    try {
      setLoading(true);

      // Müşteri için sadece wallet verisi yeter
      if (user?.role === 'customer') {
        try {
          const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET)
          if (walletRes?.data) {
            setCustomerBalance(walletRes.data.balance ?? 0)
            setCustomerCoupons(walletRes.data.coupons || [])
          }
        } catch { /* bakiye 0 kalır */ }
        try {
          const txRes = await fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS)
          const txList = Array.isArray(txRes) ? txRes : txRes?.data || []
          setCustomerTransactions(txList)
        } catch { /* işlem geçmişi boş kalır */ }
        try {
          const pkgRes = await fetchAPI(API_ENDPOINTS.PACKAGES.MY)
          setActivePackage(pkgRes?.data || null)
        } catch { /* paket yok */ }
        return
      }

      const jobsResponse = await fetchAPI(API_ENDPOINTS.JOBS.LIST);
      if (jobsResponse?.data && Array.isArray(jobsResponse.data)) {
        const mapped = mapJobsFromBackend(jobsResponse.data);
        const myJobs = mapped.filter(j =>
          j.ustaId === user?.id &&
          (j.status === 'completed' || j.status === 'rated')
        );

        // Toplam bakiye
        const totalBalance = myJobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0);
        setBalance(totalBalance);

        // Bu ay kazanç
        const now = new Date();
        const thisMonthJobs = myJobs.filter(j => {
          const d = j.completedAt ? new Date(j.completedAt) : null;
          return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        setThisMonthEarnings(thisMonthJobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0));

        // Geçen ay kazanç
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthJobs = myJobs.filter(j => {
          const d = j.completedAt ? new Date(j.completedAt) : null;
          return d && d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
        });
        setLastMonthEarnings(lastMonthJobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0));

        // Tamamlanan işleri işlem geçmişi olarak göster
        const jobTransactions = myJobs
          .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
          .map(j => ({
            id: j.id,
            description: j.title || 'Tamamlanan İş',
            amount: Number(j.budget) || 0,
            date: j.completedAt || null,
          }));

        // Bakiye ve bekleyen çekimi GET /wallet'tan al (backend doğru hesaplıyor)
        try {
          const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET);
          if (walletRes?.data) {
            setBalance(walletRes.data.balance ?? totalBalance);
            setPendingWithdrawal(walletRes.data.pendingWithdrawal || 0);
          }
        } catch {
          // jobs'tan hesaplanan totalBalance kalır
        }

        // Çekim geçmişini işlem listesine ekle
        try {
          const txRes = await fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS);
          const txList = Array.isArray(txRes) ? txRes : txRes?.data || [];
          const withdrawalTxs = txList.filter(t =>
            (t.type || '').toUpperCase() === 'WITHDRAWAL'
          );
          const withdrawalHistory = withdrawalTxs.map(t => ({
            id: t.id,
            description: `Para Çekme${t.bankName ? ` - ${t.bankName}` : ''}`,
            amount: -(Number(t.amount) || 0),
            date: t.createdAt || null,
          }));
          setTransactions([...jobTransactions, ...withdrawalHistory]
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
        } catch {
          setTransactions(jobTransactions);
        }
      }

    } catch (err) {
      console.error('Cüzdan yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user) loadWalletData();
}, [user]);
  // Büyüme hesaplama
  const growthPercentage = lastMonthEarnings > 0
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
    : thisMonthEarnings > 0 ? 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Kupon ekleme handler'ı (müşteri için)
  const handleAddCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponMsg(null)
    try {
      const res = await fetchAPI(API_ENDPOINTS.WALLET.ADD_COUPON, {
        method: 'POST',
        body: { code: couponCode.trim() }
      })
      if (res?.data || res?.success || res?.message?.toLowerCase().includes('başar')) {
        setCouponMsg({ ok: true, text: 'Kupon başarıyla eklendi!' })
        setCouponCode('')
        // Cüzdanı yenile
        const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (walletRes?.data) {
          setCustomerBalance(walletRes.data.balance ?? customerBalance)
          setCustomerCoupons(walletRes.data.coupons || [])
        }
      } else {
        setCouponMsg({ ok: false, text: res?.message || 'Kupon eklenemedi.' })
      }
    } catch (err) {
      setCouponMsg({ ok: false, text: err.message || 'Kupon eklenemedi.' })
    } finally {
      setCouponLoading(false)
    }
  }

  const handleBuyPackage = async (pkg) => {
    setPackageLoading(true)
    setPackageMsg(null)
    try {
      const res = await fetchAPI(API_ENDPOINTS.PACKAGES.BUY, {
        method: 'POST',
        body: { packageId: pkg.id, packageName: pkg.name, price: pkg.price }
      })
      if (res?.success || res?.data) {
        setActivePackage(res.data)
        setPackageMsg({ ok: true, text: `${pkg.name} paketi aktifleştirildi!` })
        setShowPackageSelection(false)
        const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (walletRes?.data) setCustomerBalance(walletRes.data.balance ?? customerBalance)
      } else {
        setPackageMsg({ ok: false, text: res?.message || 'Paket satın alınamadı.' })
      }
    } catch (err) {
      setPackageMsg({ ok: false, text: err.message || 'Paket satın alınamadı.' })
    } finally {
      setPackageLoading(false)
    }
  }

  const handleToggleAutoRenew = async () => {
    if (!activePackage) return
    try {
      const res = await fetchAPI(API_ENDPOINTS.PACKAGES.TOGGLE_AUTO_RENEW, {
        method: 'PATCH',
        body: { autoRenew: !activePackage.autoRenew }
      })
      if (res?.data) setActivePackage(res.data)
    } catch { /* sessiz hata */ }
  }

  // --- MÜŞTERİ GÖRÜNÜMÜ ---
  if (user?.role === 'customer') {
    const activeCoupons = customerCoupons.filter(c => !c.used && (!c.expiresAt || new Date(c.expiresAt) > new Date()))
    const usedCoupons = customerCoupons.filter(c => c.used)

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Cüzdan</h1>
              <p className="text-xs text-gray-500">Bakiye ve kuponlarınız</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 space-y-5">
          {/* Bakiye Kartı */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 rounded-2xl p-6 shadow-xl text-white">
            <p className="text-white/70 text-sm font-medium mb-1">Hesap Bakiyesi</p>
            <h2 className="text-4xl font-black mb-5">{customerBalance.toLocaleString('tr-TR')} TL</h2>
            <button
              onClick={() => navigate('/odeme')}
              className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CreditCard size={18} />
              Bakiye Yükle
            </button>
          </div>

          {/* Kupon Ekle */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Tag size={16} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-900">Kupon Kodu Ekle</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleAddCoupon()}
                placeholder="Kupon kodunu girin..."
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                {couponLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
              </button>
            </div>
            {couponMsg && (
              <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${couponMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {couponMsg.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {couponMsg.text}
              </div>
            )}
          </div>

          {/* Aktif Kuponlar */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 px-1">
              Kuponlarım
              {activeCoupons.length > 0 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">{activeCoupons.length}</span>
              )}
            </h3>
            {activeCoupons.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <Tag size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">Aktif kuponunuz yok</p>
                <p className="text-xs text-gray-300 mt-1">Yukarıdan kupon kodu ekleyebilirsiniz</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCoupons.map((c, idx) => (
                  <div key={c.id || idx} className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <Tag size={20} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-lg text-orange-500">{c.amount} TL</p>
                      <p className="text-xs text-gray-500 font-mono truncate">{c.code || 'Kupon'}</p>
                      {c.expiresAt && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {new Date(c.expiresAt).toLocaleDateString('tr-TR')} tarihine kadar
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-1 rounded-lg shrink-0">Aktif</span>
                  </div>
                ))}
              </div>
            )}

            {usedCoupons.length > 0 && (
              <div className="mt-3 space-y-2">
                {usedCoupons.map((c, idx) => (
                  <div key={c.id || idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3 opacity-60">
                    <Tag size={16} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-500 text-sm">{c.amount} TL</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{c.code || 'Kupon'}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-400 font-bold px-2 py-1 rounded-lg shrink-0">Kullanıldı</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bakım Paketlerim */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-base">📦</span>
                  </div>
                  <h3 className="font-bold text-gray-900">Bakım Paketlerim</h3>
                </div>
                {!showPackageSelection && (
                  <button
                    onClick={() => setShowPackageSelection(true)}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold active:scale-95 transition-all"
                  >
                    {activePackage ? 'Değiştir' : 'Paket Al'}
                  </button>
                )}
              </div>

              {packageMsg && (
                <div className={`mb-3 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl ${packageMsg.ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  <span>{packageMsg.ok ? '✅' : '❌'}</span>
                  {packageMsg.text}
                </div>
              )}

              {/* Aktif Paket Bilgisi */}
              {activePackage && !showPackageSelection ? (
                <div className="space-y-3">
                  <div className={`bg-gradient-to-r ${PACKAGES.find(p => p.id === activePackage.packageId)?.headerColor || 'from-indigo-500 to-indigo-700'} rounded-2xl p-4 text-white`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{PACKAGES.find(p => p.id === activePackage.packageId)?.badge || '📦'}</span>
                        <div>
                          <p className="font-black text-lg">{activePackage.packageName} Paketi</p>
                          <p className="text-white/70 text-xs">{activePackage.price?.toLocaleString('tr-TR')} TL/ay</p>
                        </div>
                      </div>
                      <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-lg">🟢 Aktif</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-lg">📅</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Sonraki Bakım Tarihi</p>
                        <p className="font-bold text-gray-900 text-sm">
                          {activePackage.nextRenewal
                            ? new Date(activePackage.nextRenewal).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">💳</span>
                        <div>
                          <p className="text-xs text-gray-500">Otomatik Yenile</p>
                          <p className="font-semibold text-gray-900 text-sm">{activePackage.autoRenew ? 'Açık' : 'Kapalı'}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleAutoRenew}
                        className={`relative w-12 h-6 rounded-full transition ${activePackage.autoRenew ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${activePackage.autoRenew ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyPackage(PACKAGES.find(p => p.id === activePackage.packageId))}
                    disabled={packageLoading}
                    className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {packageLoading ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : '🔄'}
                    Paketi Yenile
                  </button>
                </div>
              ) : !showPackageSelection ? (
                <div className="text-center py-4">
                  <span className="text-4xl">📦</span>
                  <p className="text-sm text-gray-500 mt-2 font-medium">Aktif paketiniz yok</p>
                  <p className="text-xs text-gray-400 mt-1">Aylık bakım paketi ile evinizi koruyun</p>
                </div>
              ) : null}

              {/* Paket Seçim Ekranı */}
              {showPackageSelection && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 text-center mb-2">Paketinizi seçin — ücret cüzdanınızdan düşülür</p>
                  {PACKAGES.map(pkg => (
                    <div key={pkg.id} className="border border-gray-100 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{pkg.badge}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-gray-900">{pkg.name}</p>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pkg.tagColor}`}>{pkg.tag}</span>
                            </div>
                            <p className="font-black text-indigo-600 text-lg">{pkg.price.toLocaleString('tr-TR')} TL<span className="text-xs text-gray-400 font-normal">/ay</span></p>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-1 mb-3">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                            <span className="text-green-500 flex-shrink-0">✓</span>{f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleBuyPackage(pkg)}
                        disabled={packageLoading}
                        className={`w-full py-2.5 bg-gradient-to-r ${pkg.headerColor} text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50`}
                      >
                        {packageLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : `${pkg.name} Paketini Al`}
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setShowPackageSelection(false)} className="w-full py-2 text-gray-400 text-sm font-medium">
                    Vazgeç
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* İşlem Geçmişi */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 px-1">İşlem Geçmişi</h3>
            {customerTransactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <p className="text-sm text-gray-400">Henüz işlem yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerTransactions.slice(0, 10).map((tx, idx) => {
                  const amt = Number(tx.amount) || 0
                  const isCredit = amt > 0 || ['credit', 'CREDIT', 'topup', 'TOPUP', 'earning', 'EARNING'].includes(tx.type)
                  return (
                    <div key={tx.id || idx} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                        <span className="text-base">{isCredit ? '💳' : '🛒'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{tx.description || tx.note || (isCredit ? 'Bakiye Yüklendi' : 'Ödeme')}</p>
                        <p className="text-xs text-gray-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('tr-TR') : ''}</p>
                      </div>
                      <p className={`font-bold text-sm shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(amt).toLocaleString('tr-TR')} TL
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bakiye yükle banner */}
          <button
            onClick={() => navigate('/odeme')}
            className="w-full bg-white border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={22} className="text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-gray-900">Bakiye Yükle</p>
              <p className="text-xs text-gray-500">Kredi kartı ile hızlı yükleme</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>
      </div>
    )
  }

  // --- USTA GÖRÜNÜMÜ ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Usta Cüzdanı</h1>
            <p className="text-xs text-gray-500">Kazançlarınızı yönetin</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-white/80 text-sm mb-1">Çekilebilir Bakiye</p>
          <h2 className="text-4xl font-black mb-2">{balance.toLocaleString('tr-TR')} TL</h2>
          {pendingWithdrawal > 0 && (
            <p className="text-white/70 text-xs mb-2">Bekleyen çekim: -{pendingWithdrawal.toLocaleString('tr-TR')} TL</p>
          )}
          <button 
            onClick={() => navigate('/withdraw')}
            className="w-full py-3 bg-white text-green-600 rounded-xl font-bold"
          >
            Para Çek
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <TrendingUp size={16} className="text-green-600 mb-1" />
            <p className="text-xl font-bold text-gray-900">{thisMonthEarnings.toLocaleString('tr-TR')} TL</p>
            <p className="text-xs text-gray-500">Bu Ay Kazanç</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-1">
              <span className={`text-xl font-bold ${Number(growthPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>%{growthPercentage}</span>
            </div>
            <p className="text-xs text-gray-500">Büyüme</p>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 text-sm">Özet</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">İşlem geçmişi bulunamadı.</div>
          ) : (
            transactions.map((tx, idx) => (
              <div key={tx.id || idx} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.amount > 0 ? '💰' : '⚠️'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{tx.description || 'İşlem'}</p>
                    <p className="text-xs text-gray-500">{tx.date ? new Date(tx.date).toLocaleDateString('tr-TR') : 'Süresiz'}</p>
                  </div>
                </div>
                <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} TL
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletPage
