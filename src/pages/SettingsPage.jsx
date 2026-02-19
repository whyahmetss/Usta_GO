import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, User, Mail, Phone, Lock, Power } from 'lucide-react'

function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isActive, setIsActive] = useState(true) // Aktif/Pasif durum
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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
