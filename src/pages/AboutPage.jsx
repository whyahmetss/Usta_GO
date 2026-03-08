import { useNavigate } from 'react-router-dom'
import { Star, Users, Zap } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-gray-50">
      <PageHeader title="Hakkında" onBack={() => navigate(-1)} />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Logo & Info */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-black text-white">UG</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Usta GO</h2>
          <p className="text-gray-600">Sürüm 2.5.0</p>
          <p className="text-sm text-gray-500 mt-2">Profesyonel hizmetlerle bağlantı kurun</p>
        </div>

        {/* Features */}
        <Card padding="p-6" className="mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Neden Usta GO?</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-primary-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Hızlı Eşleştirme</p>
                <p className="text-sm text-gray-600">AI teknolojisiyle dakikalar içinde usta bulun</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Güvenli & Şeffaf</p>
                <p className="text-sm text-gray-600">Tüm işlemlerde puanlama ve güvenlik garantisi</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-accent-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Topluluk Odaklı</p>
                <p className="text-sm text-gray-600">Doğrulanmış profesyonellerle güvenli çalışın</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Legal */}
        <div className="space-y-3 mb-8">
          <a href="#" className="block [&>div]:hover:shadow-card-hover transition">
            <Card padding="p-4">
              <p className="font-bold text-gray-900">Kullanım Şartları</p>
              <p className="text-xs text-gray-500">Platformu kullanırken kabul ettiğiniz şartlar</p>
            </Card>
          </a>
          <a href="#" className="block [&>div]:hover:shadow-card-hover transition">
            <Card padding="p-4">
              <p className="font-bold text-gray-900">Gizlilik Politikası</p>
              <p className="text-xs text-gray-500">Verileriniz nasıl korunuyor</p>
            </Card>
          </a>
        </div>

        {/* Developer Info */}
        <Card padding="p-6" className="bg-gray-900 border-gray-800">
          <div className="text-white text-center">
            <p className="text-sm text-gray-400 mb-2">Geliştiriciler</p>
            <p className="text-lg font-black mb-4 text-white">Ali Aydoğar + Ahmet Çavdar</p>
            <p className="text-xs text-gray-500">© 2026 Usta GO. Tüm hakları saklıdır.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AboutPage
