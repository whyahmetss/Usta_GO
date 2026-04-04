import { useNavigate } from 'react-router-dom'
import { Star, Users, Zap, FileText, Shield, Code2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-gray-50 dark:bg-[#0F172A]">
      <PageHeader title="Hakkında" onBack={() => navigate(-1)} />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Logo & Info */}
        <div className="text-center mb-8">
          <img src="/pwa-192x192.svg" alt="Usta GO" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg" />
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Usta GO</h2>
          <p className="text-gray-600 dark:text-gray-400">Sürüm 2.5.0</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Profesyonel hizmetlerle bağlantı kurun</p>
        </div>

        {/* Features */}
        <Card padding="p-6" className="mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Neden Usta GO?</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-primary-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Hızlı Eşleştirme</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI teknolojisiyle dakikalar içinde usta bulun</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Güvenli & Şeffaf</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tüm işlemlerde puanlama ve güvenlik garantisi</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-accent-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Topluluk Odaklı</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Doğrulanmış profesyonellerle güvenli çalışın</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Legal */}
        <div className="space-y-3 mb-8">
          <button onClick={() => navigate('/legal/terms')} className="block w-full text-left [&>div]:hover:shadow-card-hover transition">
            <Card padding="p-4">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Kullanım Şartları</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Platformu kullanırken kabul ettiğiniz şartlar</p>
                </div>
              </div>
            </Card>
          </button>
          <button onClick={() => navigate('/legal/privacy')} className="block w-full text-left [&>div]:hover:shadow-card-hover transition">
            <Card padding="p-4">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Gizlilik Politikası</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Verileriniz nasıl korunuyor</p>
                </div>
              </div>
            </Card>
          </button>
        </div>

        {/* Developer Info */}
        <Card padding="p-6" className="!bg-gradient-to-br !from-gray-900 !to-gray-800 dark:!from-gray-800 dark:!to-gray-900 !border-gray-700">
          <div className="text-center">
            <Code2 size={24} className="text-primary-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-2">Geliştiriciler</p>
            <p className="text-lg font-black mb-1 text-white">Ali Aydoğar</p>
            <p className="text-lg font-black mb-4 text-white">Ahmet Çavdar</p>
            <p className="text-xs text-gray-500">© 2026 Usta GO. Tüm hakları saklıdır.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AboutPage
