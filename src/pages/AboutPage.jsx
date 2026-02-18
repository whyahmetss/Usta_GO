import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Users, Zap } from 'lucide-react'

function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Hakkında</h1>
            <p className="text-white/80 text-sm">Usta GO Hakkında</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Logo & Info */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl font-black text-white">UG</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Usta GO</h2>
          <p className="text-gray-600">Sürüm 2.5.0</p>
          <p className="text-sm text-gray-500 mt-2">Profesyonel hizmetlerle bağlantı kurun</p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Neden Usta GO?</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Hızlı Eşleştirme</p>
                <p className="text-sm text-gray-600">AI teknolojisiyle dakikalar içinde usta bulun</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Güvenli & Şeffaf</p>
                <p className="text-sm text-gray-600">Tüm işlemlerde puanlama ve güvenlik garantisi</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Topluluk Odaklı</p>
                <p className="text-sm text-gray-600">Doğrulanmış profesyonellerle güvenli çalışın</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="space-y-3 mb-8">
          <a href="#" className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
            <p className="font-bold text-gray-900">Kullanım Şartları</p>
            <p className="text-xs text-gray-500">Platformu kullanırken kabul ettiğiniz şartlar</p>
          </a>
          <a href="#" className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
            <p className="font-bold text-gray-900">Gizlilik Politikası</p>
            <p className="text-xs text-gray-500">Verileriniz nasıl korunuyor</p>
          </a>
        </div>

        {/* Developer Info */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white text-center">
          <p className="text-sm text-gray-300 mb-2">Geliştirilen Teknoloji</p>
          <p className="text-lg font-black mb-4">React + Vite + Tailwind CSS</p>
          <p className="text-xs text-gray-400">© 2024 Usta GO. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
