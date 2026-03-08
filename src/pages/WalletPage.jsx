import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { TrendingUp, Plus, Tag, CreditCard, ChevronRight, CheckCircle, Clock, XCircle, Package, Calendar, ArrowDownCircle, ArrowUpCircle, Coins, ShoppingCart } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function WalletPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [balance, setBalance] = useState(0)
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0)
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0)
  const [lastMonthEarnings, setLastMonthEarnings] = useState(0)
  const [transactions, setTransactions] = useState([])

  const [customerBalance, setCustomerBalance] = useState(0)
  const [customerCoupons, setCustomerCoupons] = useState([])
  const [customerTransactions, setCustomerTransactions] = useState([])
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMsg, setCouponMsg] = useState(null)

  const [activePackage, setActivePackage] = useState(null)
  const [packageLoading, setPackageLoading] = useState(false)
  const [packageMsg, setPackageMsg] = useState(null)
  const [showPackageSelection, setShowPackageSelection] = useState(false)
  const [packages, setPackages] = useState([])

  const PKG_COLORS = {
    klasik: { bg: 'bg-gray-50', border: 'border-gray-200', accent: 'text-gray-600', btn: 'bg-gray-600' },
    pro: { bg: 'bg-primary-50', border: 'border-primary-200', accent: 'text-primary-600', btn: 'bg-primary-600' },
    plus: { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-600', btn: 'bg-amber-600' },
  }
  const PACKAGES = packages.map(p => ({ ...p, ...(PKG_COLORS[p.packageId || p.id] || PKG_COLORS.klasik) }))

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading(true)
        if (user?.role === 'customer') {
          try { const r = await fetchAPI(API_ENDPOINTS.WALLET.GET); if (r?.data) { setCustomerBalance(r.data.balance ?? 0); setCustomerCoupons(r.data.coupons || []) } } catch {}
          try { const r = await fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS); setCustomerTransactions(Array.isArray(r) ? r : r?.data || []) } catch {}
          try { const r = await fetchAPI(API_ENDPOINTS.PACKAGES.MY); setActivePackage(r?.data || null) } catch {}
          try { const r = await fetchAPI(API_ENDPOINTS.PACKAGES.LIST); setPackages(Array.isArray(r?.data) ? r.data : []) } catch { setPackages([]) }
          return
        }
        const [walletRes, txRes] = await Promise.all([
          fetchAPI(API_ENDPOINTS.WALLET.GET).catch(() => null),
          fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS).catch(() => null),
        ])
        const txList = Array.isArray(txRes) ? txRes : txRes?.data || []
        const earningTxs = txList.filter(t => (t.type || '').toUpperCase() === 'EARNING' && (t.status || '').toUpperCase() === 'COMPLETED')
        const withdrawalTxs = txList.filter(t => (t.type || '').toUpperCase() === 'WITHDRAWAL')
        const now = new Date()
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        setThisMonthEarnings(earningTxs.filter(t => { const d = t.createdAt ? new Date(t.createdAt) : null; return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((s, t) => s + (Number(t.amount) || 0), 0))
        setLastMonthEarnings(earningTxs.filter(t => { const d = t.createdAt ? new Date(t.createdAt) : null; return d && d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() }).reduce((s, t) => s + (Number(t.amount) || 0), 0))
        if (walletRes?.data) { setBalance(walletRes.data.balance ?? 0); setPendingWithdrawal(walletRes.data.pendingWithdrawal || 0) }
        setTransactions([
          ...earningTxs.map(t => ({ id: t.id, description: t.description || 'İş Kazancı', amount: Number(t.amount) || 0, date: t.createdAt })),
          ...withdrawalTxs.map(t => ({ id: t.id, description: `Para Çekme${t.bankName ? ` - ${t.bankName}` : ''}`, amount: -(Number(t.amount) || 0), date: t.createdAt })),
        ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)))
      } catch (err) { console.error('Cüzdan yükleme hatası:', err) }
      finally { setLoading(false) }
    }
    if (user) loadWalletData()
  }, [user])

  const growthPercentage = lastMonthEarnings > 0 ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1) : thisMonthEarnings > 0 ? 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const handleAddCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponMsg(null)
    try {
      const res = await fetchAPI(API_ENDPOINTS.WALLET.ADD_COUPON, { method: 'POST', body: { code: couponCode.trim() } })
      if (res?.data || res?.success || res?.message?.toLowerCase().includes('başar')) {
        setCouponMsg({ ok: true, text: 'Kupon başarıyla eklendi!' }); setCouponCode('')
        const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (walletRes?.data) { setCustomerBalance(walletRes.data.balance ?? customerBalance); setCustomerCoupons(walletRes.data.coupons || []) }
      } else { setCouponMsg({ ok: false, text: res?.message || 'Kupon eklenemedi.' }) }
    } catch (err) { setCouponMsg({ ok: false, text: err.message || 'Kupon eklenemedi.' }) }
    finally { setCouponLoading(false) }
  }

  const handleBuyPackage = async (pkg) => {
    setPackageLoading(true); setPackageMsg(null)
    try {
      const res = await fetchAPI(API_ENDPOINTS.PACKAGES.BUY, { method: 'POST', body: { packageId: pkg.id || pkg.packageId } })
      if (res?.success || res?.data) {
        setActivePackage(res.data); setPackageMsg({ ok: true, text: `${pkg.name} paketi aktifleştirildi!` }); setShowPackageSelection(false)
        const walletRes = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (walletRes?.data) setCustomerBalance(walletRes.data.balance ?? customerBalance)
      } else { setPackageMsg({ ok: false, text: res?.message || 'Paket satın alınamadı.' }) }
    } catch (err) { setPackageMsg({ ok: false, text: err.message || 'Paket satın alınamadı.' }) }
    finally { setPackageLoading(false) }
  }

  const handleToggleAutoRenew = async () => {
    if (!activePackage) return
    try {
      const res = await fetchAPI(API_ENDPOINTS.PACKAGES.TOGGLE_AUTO_RENEW, { method: 'PATCH', body: { autoRenew: !activePackage.autoRenew } })
      if (res?.data) setActivePackage(res.data)
    } catch {}
  }

  // Customer View
  if (user?.role === 'customer') {
    const activeCoupons = customerCoupons.filter(c => !c.used && (!c.expiresAt || new Date(c.expiresAt) > new Date()))
    const usedCoupons = customerCoupons.filter(c => c.used)

    return (
      <div>
        <PageHeader title="Cüzdan" />
        <div className="px-4 py-4 space-y-4">
          {/* Balance */}
          <Card className="!bg-gradient-to-br from-primary-500 to-accent-500 !border-0 text-white" padding="p-5">
            <p className="text-white/70 text-xs font-medium mb-1">Hesap Bakiyesi</p>
            <h2 className="text-3xl font-bold mb-4">{customerBalance.toLocaleString('tr-TR')} TL</h2>
            <button onClick={() => navigate('/odeme')} className="w-full py-3 bg-white text-primary-600 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition text-sm">
              <CreditCard size={16} /> Bakiye Yükle
            </button>
          </Card>

          {/* Coupon */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center"><Tag size={16} className="text-amber-500" /></div>
              <h3 className="font-semibold text-gray-900 text-sm">Kupon Kodu Ekle</h3>
            </div>
            <div className="flex gap-2">
              <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleAddCoupon()} placeholder="Kupon kodunu girin..."
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300" />
              <button onClick={handleAddCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4 py-3 bg-primary-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition">
                {couponLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
            {couponMsg && (
              <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${couponMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>
                {couponMsg.ok ? <CheckCircle size={13} /> : <XCircle size={13} />} {couponMsg.text}
              </div>
            )}
          </Card>

          {/* Active Coupons */}
          {activeCoupons.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2.5 px-0.5">Kuponlarım <span className="ml-1 text-[10px] bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">{activeCoupons.length}</span></h3>
              <div className="space-y-2">
                {activeCoupons.map((c, idx) => (
                  <Card key={c.id || idx} className="flex items-center gap-3 !p-3.5">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0"><Tag size={16} className="text-amber-500" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-600 text-sm">{c.amount} TL</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{c.code || 'Kupon'}</p>
                      {c.expiresAt && <p className="text-[10px] text-gray-300 flex items-center gap-0.5 mt-0.5"><Clock size={9} />{new Date(c.expiresAt).toLocaleDateString('tr-TR')}</p>}
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-1 rounded-lg shrink-0">Aktif</span>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {usedCoupons.length > 0 && (
            <div className="space-y-1.5">
              {usedCoupons.map((c, idx) => (
                <div key={c.id || idx} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 opacity-50">
                  <Tag size={14} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-500 text-xs">{c.amount} TL - <span className="font-mono">{c.code}</span></p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Kullanıldı</span>
                </div>
              ))}
            </div>
          )}

          {/* Packages */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center"><Package size={16} className="text-violet-500" /></div>
                <h3 className="font-semibold text-gray-900 text-sm">Bakım Paketleri</h3>
              </div>
              {!showPackageSelection && (
                <button onClick={() => setShowPackageSelection(true)} className="text-[11px] bg-primary-500 text-white px-3 py-1.5 rounded-lg font-medium active:scale-[0.98] transition">
                  {activePackage ? 'Değiştir' : 'Paket Al'}
                </button>
              )}
            </div>

            {packageMsg && (
              <div className={`mb-3 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl ${packageMsg.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                {packageMsg.ok ? <CheckCircle size={13} /> : <XCircle size={13} />} {packageMsg.text}
              </div>
            )}

            {activePackage && !showPackageSelection ? (
              <div className="space-y-2.5">
                <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{activePackage.packageName} Paketi</p>
                      <p className="text-white/60 text-xs">{activePackage.price?.toLocaleString('tr-TR')} TL/ay</p>
                    </div>
                    <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">Aktif</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-500" /><div><p className="text-[10px] text-gray-400">Sonraki Bakım</p><p className="font-medium text-gray-900 text-xs">{activePackage.nextRenewal ? new Date(activePackage.nextRenewal).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '—'}</p></div></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2"><CreditCard size={14} className="text-gray-500" /><p className="text-xs text-gray-600">Otomatik Yenile</p></div>
                  <button onClick={handleToggleAutoRenew} className={`relative w-11 h-6 rounded-full transition ${activePackage.autoRenew ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${activePackage.autoRenew ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            ) : !showPackageSelection ? (
              <div className="text-center py-4">
                <Package size={28} className="text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Aktif paketiniz yok</p>
              </div>
            ) : null}

            {showPackageSelection && (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-400 text-center">Paketinizi seçin — ücret cüzdanınızdan düşülür</p>
                {PACKAGES.map(pkg => (
                  <div key={pkg.id} className={`border rounded-xl p-4 ${pkg.border}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{pkg.badge}</span>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{pkg.name}</p>
                        <p className={`font-bold text-sm ${pkg.accent}`}>{pkg.price?.toLocaleString('tr-TR')} TL<span className="text-[10px] text-gray-400 font-normal">/ay</span></p>
                      </div>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {(pkg.features || []).map((f, i) => (
                        <li key={i} className="text-[11px] text-gray-500 flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400 flex-shrink-0" />{f}</li>
                      ))}
                    </ul>
                    <button onClick={() => handleBuyPackage(pkg)} disabled={packageLoading} className={`w-full py-2.5 ${pkg.btn} text-white rounded-xl font-medium text-xs active:scale-[0.98] transition disabled:opacity-50`}>
                      {packageLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : `${pkg.name} Paketini Al`}
                    </button>
                  </div>
                ))}
                <button onClick={() => setShowPackageSelection(false)} className="w-full py-2 text-gray-400 text-xs font-medium">Vazgeç</button>
              </div>
            )}
          </Card>

          {/* Transactions */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-2.5 px-0.5">İşlem Geçmişi</h3>
            {customerTransactions.length === 0 ? (
              <Card className="text-center !py-6"><p className="text-xs text-gray-400">Henüz işlem yok</p></Card>
            ) : (
              <div className="space-y-1.5">
                {customerTransactions.slice(0, 10).map((tx, idx) => {
                  const amt = Number(tx.amount) || 0
                  const isCredit = amt > 0 || ['credit', 'CREDIT', 'topup', 'TOPUP', 'earning', 'EARNING'].includes(tx.type)
                  return (
                    <Card key={tx.id || idx} className="flex items-center gap-3 !p-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        {isCredit ? <ArrowDownCircle size={16} className="text-emerald-500" /> : <ShoppingCart size={16} className="text-rose-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs truncate">{tx.description || tx.note || (isCredit ? 'Bakiye Yüklendi' : 'Ödeme')}</p>
                        <p className="text-[10px] text-gray-300">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('tr-TR') : ''}</p>
                      </div>
                      <p className={`font-bold text-xs shrink-0 ${isCredit ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(amt).toLocaleString('tr-TR')} TL
                      </p>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <Card onClick={() => navigate('/odeme')} className="flex items-center gap-3 !p-3.5">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shrink-0"><CreditCard size={18} className="text-white" /></div>
            <div className="flex-1"><p className="font-semibold text-gray-900 text-sm">Bakiye Yükle</p><p className="text-[10px] text-gray-400">Kredi kartı ile hızlı yükleme</p></div>
            <ChevronRight size={16} className="text-gray-300" />
          </Card>
        </div>
      </div>
    )
  }

  // Professional View
  return (
    <div>
      <PageHeader title="Usta Cüzdanı" />
      <div className="px-4 py-4 space-y-4">
        <Card className="!bg-gradient-to-br from-emerald-500 to-accent-500 !border-0 text-white" padding="p-5">
          <p className="text-white/70 text-xs font-medium mb-1">Çekilebilir Bakiye</p>
          <h2 className="text-3xl font-bold mb-1">{balance.toLocaleString('tr-TR')} TL</h2>
          {pendingWithdrawal > 0 && <p className="text-white/60 text-[11px] mb-3">Bekleyen çekim: -{pendingWithdrawal.toLocaleString('tr-TR')} TL</p>}
          <button onClick={() => navigate('/withdraw')} className="w-full py-3 bg-white text-emerald-600 rounded-xl font-semibold text-sm mt-2">Para Çek</button>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <TrendingUp size={16} className="text-emerald-500 mb-1.5" />
            <p className="text-lg font-bold text-gray-900">{thisMonthEarnings.toLocaleString('tr-TR')} TL</p>
            <p className="text-[10px] text-gray-400">Bu Ay Kazanç</p>
          </Card>
          <Card>
            <p className={`text-lg font-bold ${Number(growthPercentage) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>%{growthPercentage}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Büyüme</p>
          </Card>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 text-sm mb-2.5 px-0.5">İşlem Özeti</h3>
          {transactions.length === 0 ? (
            <Card className="text-center !py-8"><p className="text-xs text-gray-400">İşlem geçmişi bulunamadı.</p></Card>
          ) : (
            <div className="space-y-1.5">
              {transactions.map((tx, idx) => (
                <Card key={tx.id || idx} className="flex items-center gap-3 !p-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {tx.amount > 0 ? <Coins size={16} className="text-emerald-500" /> : <ArrowUpCircle size={16} className="text-rose-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-xs truncate">{tx.description || 'İşlem'}</p>
                    <p className="text-[10px] text-gray-300">{tx.date ? new Date(tx.date).toLocaleDateString('tr-TR') : ''}</p>
                  </div>
                  <p className={`font-bold text-xs shrink-0 ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} TL
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletPage
