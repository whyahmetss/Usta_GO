import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { X, Settings, HelpCircle, Info, LogOut } from 'lucide-react'

function HamburgerMenu({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleNavigation = (path) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      logout()
      navigate('/')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
      ></div>

      {/* Menu Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-80 bg-white z-50 shadow-2xl transform transition-transform">
        {/* Header */}
        <div className="blue-gradient-bg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">Menü</h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-3xl">
              {user?.avatar || '👤'}
            </div>
            <div>
              <p className="text-white font-bold">{user?.name}</p>
              <p className="text-white/80 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-6 space-y-2">
          <button
            onClick={() => handleNavigation('/settings')}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition"
          >
            <Settings size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-900">Ayarlar</span>
          </button>

          <button
            onClick={() => handleNavigation('/help')}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition"
          >
            <HelpCircle size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-900">Yardım & Destek</span>
          </button>

          <button
            onClick={() => handleNavigation('/about')}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition"
          >
            <Info size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-900">Hakkında</span>
          </button>

          <div className="border-t border-gray-200 my-4"></div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-xl transition text-red-600"
          >
            <LogOut size={20} />
            <span className="font-semibold">Çıkış Yap</span>
          </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-center text-xs text-gray-500">
            Usta Go v3.0.0
            <br />
            © 2026 Tüm hakları saklıdır
          </p>
        </div>
      </div>
    </>
  )
}

export default HamburgerMenu
