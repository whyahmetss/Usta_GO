import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const LEGAL_CONTENT = {
  'terms': {
    title: 'Kullanım Şartları',
    sections: [
      { heading: '1. Genel', body: 'UstaGO platformunu ("Uygulama") kullanarak aşağıdaki kullanım şartlarını kabul etmiş sayılırsınız. Bu şartları kabul etmiyorsanız uygulamayı kullanmamanız gerekmektedir.' },
      { heading: '2. Hizmet Tanımı', body: 'UstaGO, müşterileri profesyonel ev hizmeti sağlayıcıları (ustalar) ile buluşturan bir aracı platformdur. Platform, elektrik, tesisat, tadilat, temizlik, boyacı, marangoz ve benzeri kategorilerde hizmet eşleştirmesi yapar.' },
      { heading: '3. Hesap ve Üyelik', body: 'Uygulamaya kayıt olmak için geçerli bir e-posta adresi ve telefon numarası gereklidir. Kullanıcılar verdikleri bilgilerin doğruluğundan sorumludur. Hesabınızın güvenliğini sağlamak sizin sorumluluğunuzdadır.' },
      { heading: '4. Usta Kayıt ve Doğrulama', body: 'Usta olarak kayıt olmak isteyen kişilerin kimlik belgesi, adli sicil kaydı ve varsa mesleki yetkinlik belgelerini yüklemesi gerekmektedir. Belgeler admin tarafından incelenir ve onaylanmadan usta iş kabul edemez.' },
      { heading: '5. Ödeme ve Komisyon', body: 'Müşteriler hizmet bedelini platform üzerinden öder. Platform, her iş için brüt tutardan %12 komisyon keser. Vergi levhası olmayan ustalara %20 gelir vergisi stopajı uygulanır. Ödeme detayları şeffaf şekilde gösterilir.' },
      { heading: '6. İptal ve İade', body: 'Müşteri, iş başlamadan önce ücretsiz iptal hakkına sahiptir. İş başladıktan sonra iptal halinde platform iptal politikasına göre ücretlendirme yapılır. İade talepleri 1-3 iş günü içinde değerlendirilir.' },
      { heading: '7. Değerlendirme Sistemi', body: 'İş tamamlandıktan sonra müşteri ustayı puanlayabilir. Sahte, kötü niyetli veya manipülatif değerlendirmeler kaldırılabilir. Sürekli düşük puan alan ustalar platformdan çıkarılabilir.' },
      { heading: '8. Yasaklı Davranışlar', body: 'Platform dışı ödeme teklifi, sahte hesap oluşturma, taciz veya tehdit içeren mesajlaşma, başka kullanıcıların kişisel bilgilerini paylaşma ve platformu kötü amaçlı kullanma yasaktır.' },
      { heading: '9. Sorumluluk Sınırı', body: 'UstaGO bir aracı platformdur ve hizmet kalitesinden doğrudan sorumlu değildir. Platform, ustalar ile müşteriler arasındaki anlaşmazlıklarda arabuluculuk yapabilir ancak nihai sorumluluk taraflara aittir.' },
      { heading: '10. Değişiklikler', body: 'UstaGO, kullanım şartlarını önceden bildirimde bulunarak değiştirme hakkını saklı tutar. Güncellenen şartlar uygulamada yayınlandığı anda yürürlüğe girer.' },
      { heading: '11. İletişim', body: 'Sorularınız için mail@usta-go.com adresine veya uygulama içi canlı destek hattına başvurabilirsiniz.' },
    ]
  },
  'privacy': {
    title: 'Gizlilik Politikası',
    sections: [
      { heading: '1. Giriş', body: 'UstaGO Teknoloji A.Ş. olarak kişisel verilerinizin güvenliği konusunda azami hassasiyet gösteriyoruz. Bu politika, hangi verilerinizi topladığımızı, nasıl kullandığımızı ve nasıl koruduğumuzu açıklar.' },
      { heading: '2. Toplanan Veriler', body: 'Kayıt bilgileri (ad, soyad, e-posta, telefon), konum bilgileri (hizmet eşleştirmesi için), ödeme bilgileri (iyzico güvenli altyapısı üzerinden), profil fotoğrafı, iş geçmişi, mesajlaşma içerikleri ve cihaz bilgileri (FCM token, işletim sistemi).' },
      { heading: '3. Verilerin Kullanım Amaçları', body: 'Hizmet sunumu ve eşleştirme, ödeme işlemlerinin gerçekleştirilmesi, bildirim gönderimi (push notification), müşteri desteği, platform güvenliği ve dolandırıcılık önleme, yasal yükümlülüklerin yerine getirilmesi.' },
      { heading: '4. Verilerin Paylaşımı', body: 'Kişisel verileriniz; ödeme hizmeti sağlayıcısı (iyzico), bulut hizmetleri (Render, Cloudinary), bildirim hizmetleri (Firebase) ve yasal zorunluluk halinde yetkili makamlarla paylaşılabilir. Verileriniz üçüncü şahıslara pazarlama amacıyla satılmaz.' },
      { heading: '5. Veri Güvenliği', body: 'Tüm iletişim SSL/TLS ile şifrelenir. Şifreler bcrypt ile hash\'lenir. Ödeme bilgileri PCI-DSS uyumlu iyzico altyapısında işlenir. Düzenli güvenlik denetimleri yapılır.' },
      { heading: '6. Çerezler ve İzleme', body: 'UstaGO, oturum yönetimi ve deneyim iyileştirme amacıyla çerezler ve yerel depolama kullanır. Analitik verileri anonim olarak toplanır.' },
      { heading: '7. Haklarınız (KVKK Madde 11)', body: 'Kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini talep etme (Ayarlar > Hesabı Sil), aktarıldığı üçüncü kişileri bilme ve itiraz etme haklarınız bulunmaktadır.' },
      { heading: '8. Hesap Silme', body: 'Uygulama içi Ayarlar sayfasından hesabınızı kalıcı olarak silebilirsiniz. Silme işlemiyle birlikte kişisel verileriniz KVKK uyarınca anonim hale getirilir veya silinir.' },
      { heading: '9. Çocukların Gizliliği', body: 'UstaGO 18 yaş altı kullanıcılara yönelik değildir. 18 yaşından küçük bireylerin verilerini bilerek toplamayız.' },
      { heading: '10. Değişiklikler', body: 'Gizlilik politikamızı güncelleme hakkımız saklıdır. Önemli değişikliklerde uygulama içi bildirim gönderilir.' },
      { heading: '11. İletişim', body: 'Kişisel veri talepleriniz için mail@usta-go.com adresine başvurabilirsiniz.' },
    ]
  },
  'mesafeli-satis-sozlesmesi': {
    title: 'Mesafeli Satış Sözleşmesi',
    sections: [
      {
        heading: '1. Taraflar',
        body: `SATICI:\nUstaGO Teknoloji A.Ş.\nAdres: İstanbul, Türkiye\nE-posta: mail@usta-go.com\n\nALICI:\nUstaGO platformuna kayıtlı kullanıcı.`
      },
      {
        heading: '2. Konu',
        body: 'İşbu sözleşme, ALICI\'nın SATICI\'ya ait usta-go.com internet sitesi ve/veya mobil uygulaması üzerinden elektronik ortamda siparişini yaptığı hizmet kredisi ve/veya bakım paketi satışı ile ilgili tarafların hak ve yükümlülüklerini düzenler.'
      },
      {
        heading: '3. Hizmet Kredisi',
        body: 'Hizmet kredisi, kullanıcının UstaGO platformu üzerinden hizmet almak amacıyla hesabına yüklediği ön ödemeli bakiyedir. Yüklenen kredi, platformda sunulan ev hizmetleri için kullanılabilir.'
      },
      {
        heading: '4. Fiyat ve Ödeme',
        body: 'Hizmet kredisi bedeli, satın alma sırasında kullanıcıya gösterilen tutardır. Ödeme, iyzico güvenli ödeme altyapısı üzerinden kredi kartı veya banka kartı ile yapılır. Tüm fiyatlar Türk Lirası (TL) cinsindendir ve KDV dahildir.'
      },
      {
        heading: '5. Cayma Hakkı',
        body: '6502 sayılı Tüketicinin Korunması Hakkında Kanun gereğince, ALICI, hizmet kredisi satın alım tarihinden itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir. Cayma hakkının kullanılabilmesi için bu süre içinde SATICI\'ya mail@usta-go.com adresi üzerinden yazılı bildirimde bulunulması gerekmektedir. Ancak, kullanılmış hizmet kredileri için cayma hakkı kullanılamaz.'
      },
      {
        heading: '6. Teslimat',
        body: 'Hizmet kredisi, ödemenin onaylanmasının ardından kullanıcının hesabına anında yüklenir. Bakım paketleri, satın alma tarihinden itibaren aktifleştirilir.'
      },
      {
        heading: '7. Genel Hükümler',
        body: 'ALICI, bu sözleşmeyi elektronik ortamda onaylayarak, sözleşme konusu hizmet kredisinin temel nitelikleri, satış fiyatı, ödeme şekli ve teslimat koşulları ile cayma hakkı konusunda bilgi sahibi olduğunu kabul eder.'
      },
      {
        heading: '8. Yetkili Mahkeme',
        body: 'İşbu sözleşmeden doğan uyuşmazlıklarda Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.'
      },
    ]
  },
  'on-bilgilendirme-formu': {
    title: 'Ön Bilgilendirme Formu',
    sections: [
      {
        heading: '1. Satıcı Bilgileri',
        body: `Ünvan: UstaGO Teknoloji A.Ş.\nAdres: İstanbul, Türkiye\nTelefon: +90 535 273 7638\nE-posta: mail@usta-go.com`
      },
      {
        heading: '2. Hizmet/Ürün Bilgileri',
        body: 'Hizmet Kredisi: UstaGO platformunda ev hizmetleri almak için kullanılan ön ödemeli bakiye. Bakım Paketi: Periyodik ev bakım hizmetlerini kapsayan abonelik paketi.'
      },
      {
        heading: '3. Satış Fiyatı',
        body: 'Hizmet kredisi bedeli, kullanıcının seçtiği tutar kadardır. Tüm fiyatlar KDV dahil Türk Lirası cinsindendir. Ödeme, iyzico güvenli altyapısı üzerinden gerçekleştirilir.'
      },
      {
        heading: '4. Ödeme Şekli ve Planı',
        body: 'Ödeme, kredi kartı veya banka kartı ile tek seferde yapılır. Taksit seçeneği bulunmamaktadır. Havale/EFT ile ödeme seçeneği de mevcuttur.'
      },
      {
        heading: '5. Teslimat Koşulları',
        body: 'Hizmet kredisi, ödemenin başarıyla tamamlanmasının ardından kullanıcı hesabına anında yüklenir. Fiziksel teslimat söz konusu değildir.'
      },
      {
        heading: '6. Cayma Hakkı',
        body: 'Tüketici, hizmet kredisi satın alım tarihinden itibaren 14 gün içinde cayma hakkını kullanabilir. Cayma bildirimi mail@usta-go.com adresine yazılı olarak yapılmalıdır. Kullanılmış hizmet kredileri için cayma hakkı uygulanmaz.'
      },
      {
        heading: '7. Şikâyet ve İtiraz',
        body: 'Şikâyet ve itirazlarınızı mail@usta-go.com adresine veya +90 535 273 7638 numarasına iletebilirsiniz. Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri başvuru hakkınız saklıdır.'
      },
    ]
  },
  'kvkk': {
    title: 'KVKK Aydınlatma Metni',
    sections: [
      {
        heading: '1. Veri Sorumlusu',
        body: 'UstaGO Teknoloji A.Ş. olarak kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz.'
      },
      {
        heading: '2. İşlenen Kişisel Veriler',
        body: 'Ad-soyad, telefon numarası, e-posta adresi, konum bilgisi, ödeme bilgileri, iş talep geçmişi ve profil fotoğrafı gibi veriler işlenmektedir.'
      },
      {
        heading: '3. İşleme Amaçları',
        body: 'Kişisel verileriniz; hizmet sunumu, ödeme işlemleri, müşteri iletişimi, yasal yükümlülükler ve platform güvenliği amaçlarıyla işlenmektedir.'
      },
      {
        heading: '4. Verilerin Aktarılması',
        body: 'Kişisel verileriniz, ödeme hizmeti sağlayıcıları (iyzico), hosting hizmeti sağlayıcıları ve yasal zorunluluk halinde yetkili kamu kurum ve kuruluşlarına aktarılabilir.'
      },
      {
        heading: '5. Haklarınız',
        body: 'KVKK\'nın 11. maddesi kapsamında; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini isteme ve itiraz etme haklarınız bulunmaktadır. Bu haklarınızı kullanmak için mail@usta-go.com adresine başvurabilirsiniz.'
      },
    ]
  }
}

export default function LegalPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const content = LEGAL_CONTENT[slug]

  if (!content) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-gray-500">Sayfa bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0d0d]">
      <header className="sticky top-0 z-10 bg-white dark:bg-[#0d0d0d] border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{content.title}</h1>
        </div>
      </header>
      <div className="px-5 py-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">{content.title}</h2>
        <div className="space-y-6">
          {content.sections.map((s, i) => (
            <div key={i}>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{s.heading}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400">© 2025 UstaGO. Tüm hakları saklıdır.</p>
          <p className="text-xs text-gray-400 mt-1">mail@usta-go.com</p>
        </div>
      </div>
    </div>
  )
}
