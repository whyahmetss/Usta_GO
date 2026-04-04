import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { fetchAPI, setStoredUser } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { User, Mail, Phone, Lock, Power, CheckCircle, Clock, AlertCircle, Sun, Moon, Monitor, MessageCircle, Info, Trash2, FileText, Upload, XCircle, Shield } from 'lucide-react'
import { uploadFile } from '../utils/api'
import { mapUserFromBackend } from '../utils/fieldMapper'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

const themeOptions = [
  { id: 'light', label: 'Açık', icon: Sun },
  { id: 'dark', label: 'Koyu', icon: Moon },
  { id: 'system', label: 'Sistem', icon: Monitor },
]

function SettingsPage() {
  const { user, setUser, deleteAccount } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  useEffect(() => {
    if (user?.isActive !== undefined && user?.isActive !== null) {
      setIsActive(user.isActive)
    }
  }, [user?.isActive])
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [hasVergiLevhasi, setHasVergiLevhasi] = useState(user?.hasVergiLevhasi ?? false)
  useEffect(() => {
    if (user?.hasVergiLevhasi !== undefined) setHasVergiLevhasi(user.hasVergiLevhasi)
  }, [user?.hasVergiLevhasi])
  const [uploadingDoc, setUploadingDoc] = useState(null) // docType being uploaded

  const handleDocUpload = async (file, docType, label) => {
    if (!file) return
    try {
      setUploadingDoc(docType)
      setError(null)
      const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo')
      const fileUrl = uploadRes?.data?.url || uploadRes?.url
      if (!fileUrl) throw new Error('Dosya yüklenemedi')
      await fetchAPI(API_ENDPOINTS.CERTIFICATES.UPLOAD, {
        method: 'POST',
        body: { fileUrl, type: docType, label }
      })
      setSuccess(`${label} yüklendi, admin onayı bekleniyor.`)
      setTimeout(() => setSuccess(null), 4000)
      // Refresh user data to update certificates list
      const meRes = await fetchAPI(API_ENDPOINTS.AUTH.ME)
      if (meRes?.data || meRes?.id) {
        const updated = mapUserFromBackend(meRes.data || meRes)
        setUser(prev => { const m = prev ? { ...prev, ...updated } : updated; setStoredUser(m); return m })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleToggleVergi = async () => {
    try {
      setLoading(true)
      setError(null)
      const newVal = !hasVergiLevhasi
      const res = await fetchAPI(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: 'PUT',
        body: { hasVergiLevhasi: newVal }
      })
      setHasVergiLevhasi(newVal)
      const patched = mapUserFromBackend(res.data || res)
      setUser(prev => {
        const merged = prev ? { ...prev, ...patched, hasVergiLevhasi: newVal } : patched
        setStoredUser(merged)
        return merged
      })
      setSuccess(newVal ? 'Vergi levhası durumu aktif edildi. Stopaj kesilmeyecek.' : 'Bireysel çalışan olarak işaretlendiniz. %20 stopaj kesilecek.')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor')
      return
    }
    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await fetchAPI(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'PUT',
        body: { oldPassword, newPassword }
      })
      setSuccess('Şifreniz başarıyla değiştirildi!')
      setShowPasswordChange(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      setLoading(true)
      setError(null)
      const newActiveStatus = !isActive
      const res = await fetchAPI(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: 'PUT',
        body: { isActive: newActiveStatus }
      })
      setIsActive(newActiveStatus)
      const patched = mapUserFromBackend(res.data || res)
      setUser(prev => {
        const merged = prev ? { ...prev, ...patched } : patched
        setStoredUser(merged)
        return merged
      })
      setSuccess(newActiveStatus ? 'Durumunuz aktif edildi. Artık iş alabilirsiniz.' : 'Durumunuz pasif edildi. Yeni iş talepleri almayacaksınız.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50">
      <PageHeader title="Ayarlar" onBack={() => navigate(-1)} />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-700">Hata</p>
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-700">Başarılı</p>
              <p className="text-sm text-emerald-600">{success}</p>
            </div>
          </div>
        )}

        {/* Tema */}
        <Card padding="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Tema</h3>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(opt => {
              const Icon = opt.icon
              const active = theme === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Icon size={22} className={active ? 'text-primary-500' : 'text-gray-500'} />
                  <span className={`text-xs font-semibold ${active ? 'text-primary-600' : 'text-gray-600'}`}>
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Hesap Bilgileri */}
        <Card padding="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Hesap Bilgileri</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User size={20} className="text-gray-600" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Ad Soyad</p>
                <p className="font-semibold text-gray-900">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail size={20} className="text-gray-600" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">E-posta</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone size={20} className="text-gray-600" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Telefon</p>
                  <p className="font-semibold text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Aktif/Pasif Durum (Sadece Usta için) */}
        {user?.role === 'professional' && (() => {
          const docsLocked = user?.verificationStatus !== 'verified'
          return (
          <Card padding="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${docsLocked ? 'bg-amber-100' : isActive ? 'bg-emerald-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                  <Power size={24} className={docsLocked ? 'text-amber-500' : isActive ? 'text-emerald-600' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">İş Alma Durumu</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {docsLocked
                      ? 'Belgeleriniz onaylanmadan aktif edilemez'
                      : isActive ? 'Aktif - Yeni işler alabilirsiniz' : 'Pasif - Yeni iş alamazsınız'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleActive}
                disabled={loading || docsLocked}
                className={`relative w-16 h-8 rounded-full transition ${
                  docsLocked ? 'bg-gray-200 cursor-not-allowed' : isActive ? 'bg-emerald-500' : 'bg-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  isActive && !docsLocked ? 'translate-x-9' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
            {docsLocked && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                ⚠️ Belgeleriniz admin tarafından onaylandıktan sonra iş almaya başlayabilirsiniz.
              </p>
            )}
          </Card>
          )
        })()}

        {/* Doğrulama (Usta için) */}
        {user?.role === 'professional' && (() => {
          const certs = user?.certificates || []
          const REQUIRED_DOCS = [
            { docType: 'kimlik', label: 'Kimlik Belgesi', critical: true },
            { docType: 'adli_sicil', label: 'Adli Sicil Kaydı', critical: true },
          ]
          const OPTIONAL_DOCS = [
            { docType: 'meslek', label: 'Mesleki Sertifika', critical: false },
            { docType: 'vergi', label: 'Vergi Levhası', critical: false },
          ]
          const ALL_DOCS = [...REQUIRED_DOCS, ...OPTIONAL_DOCS]

          const getDocStatus = (docType) => {
            const matching = certs.filter(c => c.docType === docType)
            if (matching.length === 0) return null
            if (matching.some(c => c.status === 'APPROVED')) return 'APPROVED'
            if (matching.some(c => c.status === 'PENDING')) return 'PENDING'
            return 'REJECTED'
          }

          const missingCritical = REQUIRED_DOCS.filter(d => !getDocStatus(d.docType))
          const hasMissingCritical = missingCritical.length > 0

          return (
          <Card padding="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Belgelerim</h3>
              {user?.verificationStatus === 'verified' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                  <CheckCircle size={12} /> Doğrulanmış
                </span>
              ) : user?.verificationStatus === 'pending' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                  <Clock size={12} /> İnceleniyor
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  <AlertCircle size={12} /> Doğrulanmamış
                </span>
              )}
            </div>

            {hasMissingCritical && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">⛔ Eksik Kritik Belgeler</p>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {missingCritical.map(d => d.label).join(' ve ')} yüklenmedikçe iş alamazsınız.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {ALL_DOCS.map(doc => {
                const status = getDocStatus(doc.docType)
                const isUploading = uploadingDoc === doc.docType
                return (
                  <div key={doc.docType} className={`flex items-center justify-between p-3 rounded-xl border ${
                    status === 'APPROVED' ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10' :
                    status === 'PENDING' ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10' :
                    status === 'REJECTED' ? 'border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/10' :
                    doc.critical ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/5' :
                    'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {status === 'APPROVED' ? <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" /> :
                       status === 'PENDING' ? <Clock size={16} className="text-amber-600 flex-shrink-0" /> :
                       status === 'REJECTED' ? <XCircle size={16} className="text-rose-600 flex-shrink-0" /> :
                       doc.critical ? <AlertCircle size={16} className="text-rose-500 flex-shrink-0" /> :
                       <FileText size={16} className="text-gray-400 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          status === 'APPROVED' ? 'text-emerald-700 dark:text-emerald-400' :
                          status === 'PENDING' ? 'text-amber-700 dark:text-amber-400' :
                          status === 'REJECTED' ? 'text-rose-700 dark:text-rose-400' :
                          'text-gray-700 dark:text-gray-300'
                        }`}>{doc.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {status === 'APPROVED' ? 'Onaylandı' :
                           status === 'PENDING' ? 'İnceleniyor...' :
                           status === 'REJECTED' ? 'Reddedildi — tekrar yükleyin' :
                           doc.critical ? 'Zorunlu — yüklenmedi' : 'Opsiyonel — yüklenmedi'}
                        </p>
                      </div>
                    </div>
                    {status !== 'APPROVED' && status !== 'PENDING' && (
                      <label className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex-shrink-0 ${
                        isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                        doc.critical ? 'bg-rose-500 hover:bg-rose-600 text-white' :
                        'bg-primary-500 hover:bg-primary-600 text-white'
                      }`}>
                        {isUploading ? (
                          <span>Yükleniyor...</span>
                        ) : (
                          <>
                            <Upload size={12} />
                            <span>Yükle</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,.pdf"
                              disabled={isUploading}
                              onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) handleDocUpload(file, doc.docType, doc.label)
                                e.target.value = ''
                              }}
                            />
                          </>
                        )}
                      </label>
                    )}
                  </div>
                )
              })}
            </div>

            {certs.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                Henüz belge yüklenmemiş. Kimlik ve adli sicil kaydı yükleyerek doğrulamayı başlatın.
              </p>
            )}
          </Card>
          )
        })()}

        {/* Vergi Durumu (Sadece vergi belgesi onaylı Usta için açılır) */}
        {user?.role === 'professional' && (() => {
          const vergiLocked = !user?.vergiLevhasiApproved
          return (
          <Card padding="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${vergiLocked ? 'bg-gray-100' : hasVergiLevhasi ? 'bg-blue-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                  <FileText size={24} className={vergiLocked ? 'text-gray-300' : hasVergiLevhasi ? 'text-blue-600' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Vergi Durumu</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {vergiLocked
                      ? 'Bireysel çalışan — %20 stopaj kesilir'
                      : hasVergiLevhasi ? 'Vergi levham var — Stopaj kesilmez' : 'Bireysel çalışan — %20 stopaj kesilir'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleVergi}
                disabled={loading || vergiLocked}
                className={`relative w-16 h-8 rounded-full transition ${
                  vergiLocked ? 'bg-gray-200 cursor-not-allowed' : hasVergiLevhasi ? 'bg-blue-500' : 'bg-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  hasVergiLevhasi && !vergiLocked ? 'translate-x-9' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
            {vergiLocked ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
                🔒 Vergi levhası belgeniz yüklenmemiş veya henüz onaylanmamış. Onaylandıktan sonra bu ayarı değiştirebilirsiniz.
              </p>
            ) : (
              <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${hasVergiLevhasi ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                {hasVergiLevhasi
                  ? '✅ Vergi levhanız olduğu için para çekimlerinde stopaj kesilmeyecektir. İşlerinize ait faturayı kendiniz kesmelisiniz.'
                  : '⚠️ Vergi levhanız yoksa, para çekimlerinde brüt tutar üzerinden %20 gelir vergisi stopajı kesilir. Platform adınıza gider pusulası düzenler.'}
              </div>
            )}
          </Card>
          )
        })()}

        {/* Şifre Değiştir */}
        <Card padding="p-6">
          {!showPasswordChange ? (
            <button
              onClick={() => setShowPasswordChange(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-gray-600" />
                <span className="font-semibold text-gray-900">Şifre Değiştir</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Şifre Değiştir</h3>
                <button
                  onClick={() => setShowPasswordChange(false)}
                  className="text-gray-500 text-sm"
                >
                  İptal
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Mevcut Şifre"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:opacity-50"
                />
                <input
                  type="password"
                  placeholder="Yeni Şifre"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:opacity-50"
                />
                <input
                  type="password"
                  placeholder="Yeni Şifre (Tekrar)"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:opacity-50"
                />
                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Yardım & Destek */}
        <Card onClick={() => navigate('/help')} padding="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                <MessageCircle size={18} className="text-primary-500" />
              </div>
              <span className="font-semibold text-gray-900">Yardım & Destek</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Card>

        {/* Hakkında */}
        <Card onClick={() => navigate('/about')} padding="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <Info size={18} className="text-gray-600" />
              </div>
              <span className="font-semibold text-gray-900">Hakkında</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Card>

        {/* Hesabımı Sil */}
        <Card padding="p-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3"
          >
            <div className="w-9 h-9 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center">
              <Trash2 size={18} className="text-rose-500" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm">Hesabımı Sil</span>
              <p className="text-[10px] text-gray-400">Tüm kişisel verileriniz KVKK uyarınca silinir</p>
            </div>
          </button>
        </Card>
      </div>

      {/* Hesap Silme Onay Modalı */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Hesabınızı Silmek İstediğinize Emin Misiniz?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Bu işlem geri alınamaz. Kişisel verileriniz (ad, telefon, adres) KVKK uyarınca kalıcı olarak temizlenecektir.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setDeletingAccount(true)
                  const result = await deleteAccount()
                  setDeletingAccount(false)
                  if (result.success) {
                    navigate('/auth')
                  } else {
                    alert(result.error || 'Hesap silinemedi')
                    setShowDeleteConfirm(false)
                  }
                }}
                disabled={deletingAccount}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm transition disabled:opacity-50"
              >
                {deletingAccount ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Siliniyor...
                  </span>
                ) : 'Evet, Hesabımı Sil'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                className="w-full py-3.5 bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-sm transition"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
