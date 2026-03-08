import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile, setStoredUser } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { User, Mail, Phone, Lock, Power, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { mapUserFromBackend } from '../utils/fieldMapper'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function SettingsPage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [certificateFile, setCertificateFile] = useState(null)
  const [certificateLoading, setCertificateLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

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
      const updatedUser = mapUserFromBackend(res.data || res)
      setUser(updatedUser)
      setStoredUser(updatedUser)
      setSuccess(newActiveStatus ? 'Durumunuz aktif edildi. Artık iş alabilirsiniz.' : 'Durumunuz pasif edildi. Yeni iş talepleri almayacaksınız.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        setCertificateLoading(true)
        setError(null)
        const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo')
        const fileUrl = uploadRes.data?.url || uploadRes.url
        if (!fileUrl) throw new Error('Yükleme başarısız')
        await fetchAPI(API_ENDPOINTS.CERTIFICATES.UPLOAD, {
          method: 'POST',
          body: { fileUrl },
        })
        setCertificateFile(fileUrl)
        setSuccess('Sertifika yüklendi! Admin tarafından onay bekleniyor.')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(err.message || 'Sertifika yüklenemedi')
      } finally {
        setCertificateLoading(false)
      }
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
        {user?.role === 'professional' && (
          <Card padding="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${isActive ? 'bg-emerald-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                  <Power size={24} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">İş Alma Durumu</h3>
                  <p className="text-sm text-gray-600">
                    {isActive ? 'Aktif - Yeni işler alabilirsiniz' : 'Pasif - Yeni iş alamazsınız'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleActive}
                disabled={loading}
                className={`relative w-16 h-8 rounded-full transition ${
                  isActive ? 'bg-emerald-500' : 'bg-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  isActive ? 'translate-x-9' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
          </Card>
        )}

        {/* Doğrulama (Usta için) */}
        {user?.role === 'professional' && (
          <Card padding="p-6">
            <h3 className="font-bold text-gray-900 mb-4">🆔 Doğrulama</h3>
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border-2 ${
                user?.verificationStatus === 'verified' ? 'border-emerald-300 bg-emerald-50' :
                user?.verificationStatus === 'pending' ? 'border-amber-300 bg-amber-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {user?.verificationStatus === 'verified' ? (
                    <>
                      <CheckCircle size={20} className="text-emerald-600" />
                      <span className="font-bold text-emerald-700">Doğrulanmış</span>
                    </>
                  ) : user?.verificationStatus === 'pending' ? (
                    <>
                      <Clock size={20} className="text-amber-600" />
                      <span className="font-bold text-amber-700">İnceleme Bekleniyor</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="text-gray-600" />
                      <span className="font-bold text-gray-700">Doğrulanmamış</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {user?.verificationStatus === 'verified'
                    ? 'Profil öğenin "Doğrulanmış" rozetine sahiptir. ⭐'
                    : user?.verificationStatus === 'pending'
                    ? 'Sertifikanız admin tarafından incelenmektedir.'
                    : 'Sertifika yükleyerek profil güvenilirliğini artırın.'}
                </p>
              </div>

              {user?.verificationStatus !== 'verified' && (
                <label className="block">
                  <div className={`border-2 border-dashed border-primary-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-500 transition ${
                    certificateLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    <Upload size={24} className="mx-auto mb-2 text-primary-500" />
                    <p className="text-sm font-bold text-gray-900">
                      {certificateLoading ? 'Yükleniyor...' : 'Sertifika Yükle'}
                    </p>
                    <p className="text-xs text-gray-500">PDF, JPG veya PNG</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleCertificateUpload}
                    disabled={certificateLoading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </Card>
        )}

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
              <span className="text-xl">💬</span>
              <span className="font-semibold text-gray-900">Yardım & Destek</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Card>

        {/* Hakkında */}
        <Card onClick={() => navigate('/about')} padding="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">ℹ️</span>
              <span className="font-semibold text-gray-900">Hakkında</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SettingsPage
