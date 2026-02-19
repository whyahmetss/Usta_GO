import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, User, Mail, Phone, Lock, Power, Upload, CheckCircle, Clock } from 'lucide-react'

function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isActive, setIsActive] = useState(true) // Aktif/Pasif durum
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [certificateFile, setCertificateFile] = useState(null)
  const [reminderSettings, setReminderSettings] = useState({
    electricalCheck: user?.reminderSettings?.electricalCheck ?? true,
    plumbingMaintenance: user?.reminderSettings?.plumbingMaintenance ?? true
  })

  const handlePasswordChange = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('Lütfen tüm alanları doldurun')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('Yeni şifreler eşleşmiyor')
      return
    }
    if (newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalı')
      return
    }
    
    // Şifre değiştirme işlemi (backend'e bağlanınca gerçek olacak)
    alert('Şifreniz başarıyla değiştirildi!')
    setShowPasswordChange(false)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleToggleActive = () => {
    setIsActive(!isActive)
    if (!isActive) {
      alert('Hesabınız aktif edildi. Artık iş alabilirsiniz.')
    } else {
      alert('Hesabınız pasif edildi. Yeni iş talepleri almayacaksınız.')
    }
  }

  const handleCertificateUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCertificateFile(reader.result)
        // Save to localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const updatedUsers = users.map(u =>
          u.id === user.id ? {
            ...u,
            licenseCertificate: reader.result,
            verificationStatus: 'pending'
          } : u
        )
        localStorage.setItem('users', JSON.stringify(updatedUsers))
        alert('Sertifika yüklendi! Admin tarafından onay bekleniyor.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleReminderToggle = (key) => {
    const newSettings = { ...reminderSettings, [key]: !reminderSettings[key] }
    setReminderSettings(newSettings)
    // Save to localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const updatedUsers = users.map(u =>
      u.id === user.id ? { ...u, reminderSettings: newSettings } : u
    )
    localStorage.setItem('users', JSON.stringify(updatedUsers))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-black text-white">Ayarlar</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Hesap Bilgileri */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
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
        </div>

        {/* Aktif/Pasif Durum (Sadece Usta için) */}
        {user?.role === 'professional' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${isActive ? 'bg-green-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                  <Power size={24} className={isActive ? 'text-green-600' : 'text-gray-400'} />
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
                className={`relative w-16 h-8 rounded-full transition ${
                  isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  isActive ? 'translate-x-9' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
          </div>
        )}

        {/* Hatırlatıcı Ayarları (Müşteriler için) */}
        {user?.role === 'customer' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-4">📬 Hatırlatıcı Ayarları</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Elektrik Bakımı</p>
                  <p className="text-xs text-gray-500">Her 6 ayda bir hatırlat</p>
                </div>
                <button
                  onClick={() => handleReminderToggle('electricalCheck')}
                  className={`relative w-12 h-6 rounded-full transition ${
                    reminderSettings.electricalCheck ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    reminderSettings.electricalCheck ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Tesisat Bakımı</p>
                  <p className="text-xs text-gray-500">Her 1 yılda bir hatırlat</p>
                </div>
                <button
                  onClick={() => handleReminderToggle('plumbingMaintenance')}
                  className={`relative w-12 h-6 rounded-full transition ${
                    reminderSettings.plumbingMaintenance ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    reminderSettings.plumbingMaintenance ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Hatırlatıcıları etkinleştirerek önemli bakım işleriyle ilgili bildirim alırsınız.</p>
          </div>
        )}

        {/* Doğrulama (Usta için) */}
        {user?.role === 'professional' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-4">🆔 Doğrulama</h3>
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border-2 ${
                user?.verificationStatus === 'verified' ? 'border-green-300 bg-green-50' :
                user?.verificationStatus === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {user?.verificationStatus === 'verified' ? (
                    <>
                      <CheckCircle size={20} className="text-green-600" />
                      <span className="font-bold text-green-700">Doğrulanmış</span>
                    </>
                  ) : user?.verificationStatus === 'pending' ? (
                    <>
                      <Clock size={20} className="text-yellow-600" />
                      <span className="font-bold text-yellow-700">İnceleme Bekleniyor</span>
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
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition">
                    <Upload size={24} className="mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-bold text-gray-900">Sertifika Yükle</p>
                    <p className="text-xs text-gray-500">PDF, JPG veya PNG</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleCertificateUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Şifre Değiştir */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
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
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Yeni Şifre"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Yeni Şifre (Tekrar)"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handlePasswordChange}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                >
                  Şifreyi Güncelle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Yardım & Destek */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <button
            onClick={() => navigate('/help')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <span className="font-semibold text-gray-900">Yardım & Destek</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* Hakkında */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <button
            onClick={() => navigate('/about')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">ℹ️</span>
              <span className="font-semibold text-gray-900">Hakkında</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
