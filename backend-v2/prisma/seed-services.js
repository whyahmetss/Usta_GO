import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SERVICES = [
  // ═══════════════════════════════════════════════════════════════
  // ⚡ ELEKTRİK (18 + 8 güvenlik/akıllı ev + 8 beyaz eşya = 34)
  // ═══════════════════════════════════════════════════════════════
  { category: 'AMPUL_DEGISIMI',      label: 'Ampul değişimi (normal)',              basePrice: 350,  minPrice: 250,  maxPrice: 500,   homeCategory: 'electric' },
  { category: 'SPOT_LAMBA',          label: 'Spot lamba montajı',                   basePrice: 500,  minPrice: 300,  maxPrice: 900,   homeCategory: 'electric' },
  { category: 'LED_SERIT',           label: 'LED şerit aydınlatma',                basePrice: 600,  minPrice: 350,  maxPrice: 1200,  homeCategory: 'electric' },
  { category: 'AVIZE_MONTAJ_BASIT',  label: 'Avize montajı (basit)',               basePrice: 450,  minPrice: 300,  maxPrice: 650,   homeCategory: 'electric' },
  { category: 'AVIZE_MONTAJ_BUYUK',  label: 'Avize montajı (büyük/kristal)',       basePrice: 800,  minPrice: 500,  maxPrice: 1500,  homeCategory: 'electric' },
  { category: 'PRIZ_MONTAJI',        label: 'Priz montajı / değişimi',             basePrice: 400,  minPrice: 250,  maxPrice: 700,   homeCategory: 'electric' },
  { category: 'ANAHTAR_MONTAJI',     label: 'Anahtar montajı / değişimi',          basePrice: 400,  minPrice: 250,  maxPrice: 650,   homeCategory: 'electric' },
  { category: 'DIMMER_MONTAJI',      label: 'Dimmer montajı',                      basePrice: 450,  minPrice: 300,  maxPrice: 700,   homeCategory: 'electric' },
  { category: 'SIGORTA_DEGISIMI',    label: 'Sigorta değişimi (tek)',              basePrice: 400,  minPrice: 250,  maxPrice: 600,   homeCategory: 'electric' },
  { category: 'SIGORTA_PANOSU',      label: 'Sigorta panosu tamiri / yenileme',    basePrice: 900,  minPrice: 500,  maxPrice: 1800,  homeCategory: 'electric' },
  { category: 'KACAK_AKIM',          label: 'Kaçak akım tespiti',                  basePrice: 650,  minPrice: 400,  maxPrice: 1100,  homeCategory: 'electric' },
  { category: 'TOPRAKLAMA',          label: 'Topraklama tesisatı',                 basePrice: 900,  minPrice: 500,  maxPrice: 1600,  homeCategory: 'electric' },
  { category: 'KABLO_CEKME_KISA',    label: 'Kablo çekme (kısa mesafe)',           basePrice: 600,  minPrice: 350,  maxPrice: 1000,  homeCategory: 'electric' },
  { category: 'KABLO_CEKME_UZUN',    label: 'Kablo çekme (uzun/komple)',           basePrice: 1500, minPrice: 800,  maxPrice: 3000,  homeCategory: 'electric' },
  { category: 'ELEKTRIK_TESISAT',    label: 'Elektrik tesisatı yenileme',          basePrice: 3000, minPrice: 1500, maxPrice: 6000,  homeCategory: 'electric' },
  { category: 'SOFBEN_ELEKTRIK',     label: 'Şofben / termosifon elektrik bağ.',   basePrice: 500,  minPrice: 300,  maxPrice: 800,   homeCategory: 'electric' },
  { category: 'INTERKOM_TAMIRI',     label: 'İnterkom / kapı zili tamiri',         basePrice: 500,  minPrice: 300,  maxPrice: 900,   homeCategory: 'electric' },
  { category: 'YERDEN_ISITMA_ELEK',  label: 'Elektrikli yerden ısıtma',            basePrice: 2500, minPrice: 1200, maxPrice: 5000,  homeCategory: 'electric' },
  // Güvenlik / Akıllı Ev → Elektrik
  { category: 'KAMERA_MONTAJ',       label: 'Güvenlik kamerası montajı',           basePrice: 1000, minPrice: 500,  maxPrice: 2000,  homeCategory: 'electric' },
  { category: 'ALARM_MONTAJ',        label: 'Alarm sistemi montajı',               basePrice: 1200, minPrice: 600,  maxPrice: 2500,  homeCategory: 'electric' },
  { category: 'VIDEO_INTERKOM',      label: 'Video interkom montajı',              basePrice: 900,  minPrice: 500,  maxPrice: 1600,  homeCategory: 'electric' },
  { category: 'AKILLI_KILIT',        label: 'Akıllı kilit montajı',               basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'electric' },
  { category: 'AKILLI_EV',           label: 'Akıllı ev otomasyonu',               basePrice: 1500, minPrice: 800,  maxPrice: 3500,  homeCategory: 'electric' },
  { category: 'UYDU_MONTAJ',         label: 'Uydu / çanak anten montajı',         basePrice: 600,  minPrice: 350,  maxPrice: 1100,  homeCategory: 'electric' },
  { category: 'INTERNET_ALTYAPI',    label: 'İnternet altyapı / kablolama',       basePrice: 800,  minPrice: 400,  maxPrice: 1500,  homeCategory: 'electric' },
  { category: 'KEPENK_TAMIRI',       label: 'Elektrikli kepenk tamiri',            basePrice: 750,  minPrice: 400,  maxPrice: 1300,  homeCategory: 'electric' },
  // Beyaz Eşya → Elektrik
  { category: 'CAMASIR_TAMIRI',      label: 'Çamaşır makinesi tamiri',             basePrice: 700,  minPrice: 400,  maxPrice: 1300,  homeCategory: 'electric' },
  { category: 'BULASIK_TAMIRI',      label: 'Bulaşık makinesi tamiri',             basePrice: 700,  minPrice: 400,  maxPrice: 1300,  homeCategory: 'electric' },
  { category: 'BUZDOLABI_TAMIRI',    label: 'Buzdolabı tamiri',                    basePrice: 900,  minPrice: 500,  maxPrice: 1600,  homeCategory: 'electric' },
  { category: 'FIRIN_TAMIRI',        label: 'Fırın / ocak tamiri',                 basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'electric' },
  { category: 'KURUTMA_TAMIRI',      label: 'Kurutma makinesi tamiri',             basePrice: 750,  minPrice: 400,  maxPrice: 1300,  homeCategory: 'electric' },
  { category: 'BEYAZ_ESYA_MONTAJ',   label: 'Beyaz eşya montajı (basit)',         basePrice: 500,  minPrice: 300,  maxPrice: 800,   homeCategory: 'electric' },
  { category: 'ANKASTRE_MONTAJ',     label: 'Ankastre set montajı',               basePrice: 900,  minPrice: 500,  maxPrice: 1500,  homeCategory: 'electric' },
  { category: 'DAVLUMBAZ',           label: 'Davlumbaz montajı / tamiri',         basePrice: 600,  minPrice: 350,  maxPrice: 1000,  homeCategory: 'electric' },

  // ═══════════════════════════════════════════════════════════════
  // 🔧 TESİSAT (22 + 10 klima/ısıtma = 32)
  // ═══════════════════════════════════════════════════════════════
  { category: 'MUSLUK_TAMIR',        label: 'Musluk tamiri (conta/sızdırma)',      basePrice: 400,  minPrice: 250,  maxPrice: 600,   homeCategory: 'plumbing' },
  { category: 'MUSLUK_DEGISIMI',     label: 'Musluk değişimi',                     basePrice: 550,  minPrice: 350,  maxPrice: 900,   homeCategory: 'plumbing' },
  { category: 'LAVABO_MONTAJI',      label: 'Lavabo montajı / değişimi',          basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'plumbing' },
  { category: 'VANA_DEGISIMI',       label: 'Vana değişimi',                       basePrice: 500,  minPrice: 300,  maxPrice: 800,   homeCategory: 'plumbing' },
  { category: 'TIKANIK_LAVABO',      label: 'Tıkanık lavabo açma',                basePrice: 500,  minPrice: 300,  maxPrice: 900,   homeCategory: 'plumbing' },
  { category: 'TIKANIK_TUVALET',     label: 'Tıkanık tuvalet açma',               basePrice: 600,  minPrice: 350,  maxPrice: 1000,  homeCategory: 'plumbing' },
  { category: 'TIKANIK_MUTFAK',      label: 'Tıkanık gider açma (mutfak)',        basePrice: 550,  minPrice: 300,  maxPrice: 950,   homeCategory: 'plumbing' },
  { category: 'SIFON_TAMIRI',        label: 'Sifon tamiri / değişimi',            basePrice: 400,  minPrice: 250,  maxPrice: 650,   homeCategory: 'plumbing' },
  { category: 'KLOZET_MONTAJ',       label: 'Klozet montajı / değişimi',          basePrice: 750,  minPrice: 450,  maxPrice: 1300,  homeCategory: 'plumbing' },
  { category: 'REZERVUAR_TAMIRI',    label: 'Rezervuar tamiri',                    basePrice: 500,  minPrice: 300,  maxPrice: 850,   homeCategory: 'plumbing' },
  { category: 'BORU_TAMIRI',         label: 'Boru tamiri (kısa)',                  basePrice: 600,  minPrice: 350,  maxPrice: 1000,  homeCategory: 'plumbing' },
  { category: 'BORU_DOSEME',         label: 'Boru döşeme (yeni hat)',             basePrice: 1000, minPrice: 500,  maxPrice: 2000,  homeCategory: 'plumbing' },
  { category: 'SU_KACAGI_TESPIT',    label: 'Su kaçağı tespiti',                  basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'plumbing' },
  { category: 'SU_KACAGI_TAMIR',     label: 'Su kaçağı tamiri',                   basePrice: 900,  minPrice: 500,  maxPrice: 1600,  homeCategory: 'plumbing' },
  { category: 'TESISAT_KOMPLE',      label: 'Su tesisatı komple yenileme',        basePrice: 4000, minPrice: 2000, maxPrice: 8000,  homeCategory: 'plumbing' },
  { category: 'PISSU_TAMIRI',        label: 'Pis su tesisatı tamiri',             basePrice: 750,  minPrice: 400,  maxPrice: 1300,  homeCategory: 'plumbing' },
  { category: 'KOMBI_BAKIM',         label: 'Kombi bakımı (sezonluk)',            basePrice: 750,  minPrice: 500,  maxPrice: 1100,  homeCategory: 'plumbing' },
  { category: 'KOMBI_TAMIRI',        label: 'Kombi tamiri',                        basePrice: 1100, minPrice: 600,  maxPrice: 2000,  homeCategory: 'plumbing' },
  { category: 'KOMBI_MONTAJ',        label: 'Kombi montajı',                      basePrice: 1800, minPrice: 1000, maxPrice: 3000,  homeCategory: 'plumbing' },
  { category: 'TERMOSIFON_MONTAJ',   label: 'Termosifon montajı',                 basePrice: 700,  minPrice: 400,  maxPrice: 1100,  homeCategory: 'plumbing' },
  { category: 'DUS_KABIN',           label: 'Duş kabin montajı',                  basePrice: 900,  minPrice: 500,  maxPrice: 1600,  homeCategory: 'plumbing' },
  { category: 'KUVET_MONTAJ',        label: 'Küvet montajı / değişimi',           basePrice: 1100, minPrice: 600,  maxPrice: 2000,  homeCategory: 'plumbing' },
  // Klima / Isıtma → Tesisat
  { category: 'KLIMA_BAKIM',         label: 'Klima bakımı / temizliği',           basePrice: 600,  minPrice: 400,  maxPrice: 1000,  homeCategory: 'plumbing' },
  { category: 'KLIMA_MONTAJ',        label: 'Klima montajı (split)',              basePrice: 1400, minPrice: 800,  maxPrice: 2500,  homeCategory: 'plumbing' },
  { category: 'KLIMA_TAMIRI',        label: 'Klima tamiri',                        basePrice: 900,  minPrice: 500,  maxPrice: 1600,  homeCategory: 'plumbing' },
  { category: 'KLIMA_SOKUM',         label: 'Klima söküm / taşıma',              basePrice: 700,  minPrice: 400,  maxPrice: 1100,  homeCategory: 'plumbing' },
  { category: 'PETEK_TAMIRI',        label: 'Kalorifer petek tamiri',              basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'plumbing' },
  { category: 'PETEK_TEMIZLIK',      label: 'Petek temizliği (kimyasal)',         basePrice: 800,  minPrice: 500,  maxPrice: 1400,  homeCategory: 'plumbing' },
  { category: 'DOGALGAZ_KONTROL',    label: 'Doğalgaz tesisatı kontrolü',        basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'plumbing' },
  { category: 'SOMINE_MONTAJ',       label: 'Şömine / soba montajı',             basePrice: 1500, minPrice: 800,  maxPrice: 3000,  homeCategory: 'plumbing' },
  { category: 'YERDEN_ISITMA_TAM',   label: 'Yerden ısıtma tamiri',               basePrice: 1300, minPrice: 700,  maxPrice: 2500,  homeCategory: 'plumbing' },
  { category: 'HAVALANDIRMA',        label: 'Havalandırma sistemi',               basePrice: 900,  minPrice: 500,  maxPrice: 1800,  homeCategory: 'plumbing' },

  // ═══════════════════════════════════════════════════════════════
  // 🏗️ TADİLAT (20)
  // ═══════════════════════════════════════════════════════════════
  { category: 'ALCI_TAMIRI',         label: 'Alçı tamiri (küçük)',                basePrice: 500,  minPrice: 300,  maxPrice: 800,   homeCategory: 'renovation' },
  { category: 'ALCIPAN_BOLME',       label: 'Alçıpan bölme duvar',               basePrice: 1200, minPrice: 600,  maxPrice: 2500,  homeCategory: 'renovation' },
  { category: 'SIVA_TAMIRI',         label: 'Sıva tamiri / yenileme',            basePrice: 800,  minPrice: 400,  maxPrice: 1500,  homeCategory: 'renovation' },
  { category: 'SERAMIK_DOSEME',      label: 'Seramik / fayans döşeme',           basePrice: 1200, minPrice: 600,  maxPrice: 2500,  homeCategory: 'renovation' },
  { category: 'SERAMIK_TAMIRI',      label: 'Seramik tamiri (kırık/çatlak)',     basePrice: 550,  minPrice: 300,  maxPrice: 900,   homeCategory: 'renovation' },
  { category: 'LAMINAT_DOSEME',      label: 'Laminat parke döşeme',              basePrice: 1000, minPrice: 500,  maxPrice: 2000,  homeCategory: 'renovation' },
  { category: 'MASIF_PARKE',         label: 'Masif parke döşeme',                basePrice: 1600, minPrice: 800,  maxPrice: 3500,  homeCategory: 'renovation' },
  { category: 'IC_KAPI_MONTAJ',      label: 'İç kapı montajı',                   basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'renovation' },
  { category: 'DIS_KAPI_MONTAJ',     label: 'Dış kapı / çelik kapı montajı',    basePrice: 1200, minPrice: 600,  maxPrice: 2200,  homeCategory: 'renovation' },
  { category: 'PENCERE_TAMIRI',      label: 'Pencere değişimi / tamiri',         basePrice: 800,  minPrice: 400,  maxPrice: 1500,  homeCategory: 'renovation' },
  { category: 'PVC_PENCERE',         label: 'PVC pencere montajı',               basePrice: 1400, minPrice: 700,  maxPrice: 3000,  homeCategory: 'renovation' },
  { category: 'ASMA_TAVAN',          label: 'Asma tavan montajı',                basePrice: 1200, minPrice: 600,  maxPrice: 2500,  homeCategory: 'renovation' },
  { category: 'KARTONPIYER',         label: 'Kartonpiyer montajı',               basePrice: 800,  minPrice: 400,  maxPrice: 1500,  homeCategory: 'renovation' },
  { category: 'BANYO_TADILAT',       label: 'Banyo tadilatı (komple)',           basePrice: 6000, minPrice: 3000, maxPrice: 12000, homeCategory: 'renovation' },
  { category: 'MUTFAK_TADILAT',      label: 'Mutfak tadilatı (komple)',          basePrice: 7000, minPrice: 3500, maxPrice: 15000, homeCategory: 'renovation' },
  { category: 'ZEMIN_SAP',           label: 'Zemin şap döküm',                   basePrice: 1000, minPrice: 500,  maxPrice: 2000,  homeCategory: 'renovation' },
  { category: 'SU_IZOLASYON',        label: 'Su izolasyonu (banyo/teras)',        basePrice: 1200, minPrice: 600,  maxPrice: 2500,  homeCategory: 'renovation' },
  { category: 'ISI_IZOLASYON',       label: 'Isı izolasyonu (mantolama)',         basePrice: 3000, minPrice: 1500, maxPrice: 6000,  homeCategory: 'renovation' },
  { category: 'BALKON_CAM',          label: 'Balkon cam kapatma',                 basePrice: 3000, minPrice: 1500, maxPrice: 6000,  homeCategory: 'renovation' },
  { category: 'DUVAR_ORME',          label: 'Duvar yıkma / örme',                basePrice: 1400, minPrice: 700,  maxPrice: 3000,  homeCategory: 'renovation' },

  // ═══════════════════════════════════════════════════════════════
  // 🧹 TEMİZLİK (12)
  // ═══════════════════════════════════════════════════════════════
  { category: 'EV_TEMIZLIK_1_1',     label: 'Ev temizliği (1+1)',                 basePrice: 700,  minPrice: 500,  maxPrice: 1000,  homeCategory: 'cleaning' },
  { category: 'EV_TEMIZLIK_2_1',     label: 'Ev temizliği (2+1)',                 basePrice: 900,  minPrice: 650,  maxPrice: 1300,  homeCategory: 'cleaning' },
  { category: 'EV_TEMIZLIK_3_1',     label: 'Ev temizliği (3+1)',                 basePrice: 1100, minPrice: 800,  maxPrice: 1600,  homeCategory: 'cleaning' },
  { category: 'EV_TEMIZLIK_4_1',     label: 'Ev temizliği (4+1 ve üzeri)',       basePrice: 1400, minPrice: 1000, maxPrice: 2000,  homeCategory: 'cleaning' },
  { category: 'DERIN_TEMIZLIK',      label: 'Derin temizlik (dezenfeksiyon)',     basePrice: 1800, minPrice: 1200, maxPrice: 2800,  homeCategory: 'cleaning' },
  { category: 'INSAAT_TEMIZLIK',     label: 'İnşaat sonrası temizlik',           basePrice: 2500, minPrice: 1500, maxPrice: 4000,  homeCategory: 'cleaning' },
  { category: 'TASINMA_TEMIZLIK',    label: 'Taşınma öncesi/sonrası temizlik',   basePrice: 1200, minPrice: 800,  maxPrice: 2000,  homeCategory: 'cleaning' },
  { category: 'OFIS_TEMIZLIK',       label: 'Ofis / işyeri temizliği',           basePrice: 1400, minPrice: 800,  maxPrice: 2500,  homeCategory: 'cleaning' },
  { category: 'KOLTUK_YIKAMA',       label: 'Koltuk yıkama',                     basePrice: 500,  minPrice: 300,  maxPrice: 900,   homeCategory: 'cleaning' },
  { category: 'HALI_YIKAMA',         label: 'Halı yıkama (yerinde)',             basePrice: 450,  minPrice: 250,  maxPrice: 800,   homeCategory: 'cleaning' },
  { category: 'YATAK_TEMIZLIK',      label: 'Yatak / döşeme temizliği',          basePrice: 400,  minPrice: 250,  maxPrice: 700,   homeCategory: 'cleaning' },
  { category: 'CAM_TEMIZLIK',        label: 'Cam temizliği',                      basePrice: 600,  minPrice: 350,  maxPrice: 1100,  homeCategory: 'cleaning' },

  // ═══════════════════════════════════════════════════════════════
  // 🎨 BOYACI (12)
  // ═══════════════════════════════════════════════════════════════
  { category: 'TEK_DUVAR_BOYA',      label: 'Tek duvar boyama',                   basePrice: 550,  minPrice: 350,  maxPrice: 900,   homeCategory: 'painting' },
  { category: 'ODA_BOYA_KUCUK',      label: 'Tek oda boyama (≤15m²)',            basePrice: 1100, minPrice: 700,  maxPrice: 1700,  homeCategory: 'painting' },
  { category: 'ODA_BOYA_BUYUK',      label: 'Büyük oda / salon boyama',          basePrice: 1600, minPrice: 1000, maxPrice: 2500,  homeCategory: 'painting' },
  { category: 'DAIRE_BOYA_2_1',      label: '2+1 daire komple boyama',           basePrice: 4000, minPrice: 2500, maxPrice: 6000,  homeCategory: 'painting' },
  { category: 'DAIRE_BOYA_3_1',      label: '3+1 daire komple boyama',           basePrice: 5500, minPrice: 3500, maxPrice: 8000,  homeCategory: 'painting' },
  { category: 'DAIRE_BOYA_4_1',      label: '4+1 daire komple boyama',           basePrice: 7000, minPrice: 4500, maxPrice: 10000, homeCategory: 'painting' },
  { category: 'TAVAN_BOYAMA',        label: 'Tavan boyama (tek oda)',             basePrice: 650,  minPrice: 400,  maxPrice: 1000,  homeCategory: 'painting' },
  { category: 'BOYA_HAZIRLAMA',      label: 'Boya sökme + hazırlık',             basePrice: 800,  minPrice: 500,  maxPrice: 1400,  homeCategory: 'painting' },
  { category: 'DEKORATIF_BOYA',      label: 'Dekoratif boya / sıva',             basePrice: 1500, minPrice: 800,  maxPrice: 3000,  homeCategory: 'painting' },
  { category: 'DIS_CEPHE_BOYA',      label: 'Dış cephe boyama',                  basePrice: 4000, minPrice: 2000, maxPrice: 8000,  homeCategory: 'painting' },
  { category: 'AHSAP_BOYAMA',        label: 'Ahşap boyama / vernik',             basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'painting' },
  { category: 'DUVAR_KAGIDI',        label: 'Duvar kağıdı yapıştırma',          basePrice: 900,  minPrice: 500,  maxPrice: 1600,  homeCategory: 'painting' },

  // ═══════════════════════════════════════════════════════════════
  // 🪵 MARANGOZ (14)
  // ═══════════════════════════════════════════════════════════════
  { category: 'MENTESE_TAMIRI',      label: 'Menteşe tamiri / değişimi',         basePrice: 400,  minPrice: 250,  maxPrice: 650,   homeCategory: 'carpentry' },
  { category: 'KILIT_TAMIRI',        label: 'Kilit değişimi / tamiri',           basePrice: 500,  minPrice: 300,  maxPrice: 900,   homeCategory: 'carpentry' },
  { category: 'DOLAP_TAMIRI',        label: 'Dolap kapağı tamiri',               basePrice: 500,  minPrice: 300,  maxPrice: 850,   homeCategory: 'carpentry' },
  { category: 'MOBILYA_MONTAJ_BASIT',label: 'Mobilya montajı (basit)',           basePrice: 500,  minPrice: 300,  maxPrice: 800,   homeCategory: 'carpentry' },
  { category: 'MOBILYA_MONTAJ_BUYUK',label: 'Mobilya montajı (büyük)',          basePrice: 900,  minPrice: 500,  maxPrice: 1600,  homeCategory: 'carpentry' },
  { category: 'IKEA_MONTAJ',         label: 'IKEA mobilya montajı',              basePrice: 600,  minPrice: 350,  maxPrice: 1000,  homeCategory: 'carpentry' },
  { category: 'RAF_MONTAJI',         label: 'Raf montajı',                        basePrice: 400,  minPrice: 250,  maxPrice: 700,   homeCategory: 'carpentry' },
  { category: 'PERDE_MONTAJI',       label: 'Perde ray/korniş montajı',          basePrice: 450,  minPrice: 250,  maxPrice: 750,   homeCategory: 'carpentry' },
  { category: 'TV_ASKI_MONTAJ',      label: 'TV askı aparatı montajı',           basePrice: 450,  minPrice: 300,  maxPrice: 700,   homeCategory: 'carpentry' },
  { category: 'AHSAP_KAPI_TAMIR',   label: 'Ahşap kapı tamiri',                 basePrice: 700,  minPrice: 400,  maxPrice: 1200,  homeCategory: 'carpentry' },
  { category: 'MUTFAK_DOLAP',        label: 'Mutfak dolabı montajı',             basePrice: 1500, minPrice: 800,  maxPrice: 3000,  homeCategory: 'carpentry' },
  { category: 'VESTIYER',            label: 'Vestiyer / giyinme odası',          basePrice: 2500, minPrice: 1200, maxPrice: 5000,  homeCategory: 'carpentry' },
  { category: 'PARKE_CILA',          label: 'Parke zımpara + cila',              basePrice: 1200, minPrice: 600,  maxPrice: 2500,  homeCategory: 'carpentry' },
  { category: 'SUPURGELIK',          label: 'Süpürgelik montajı',                basePrice: 450,  minPrice: 250,  maxPrice: 800,   homeCategory: 'carpentry' },
]

async function main() {
  console.log(`\n🚀 UstaGO Hizmet Seed Script — ${SERVICES.length} hizmet\n`)

  // 1. Mevcut tüm servisleri sil
  const deleted = await prisma.service.deleteMany({})
  console.log(`🗑️  ${deleted.count} mevcut hizmet silindi`)

  // 2. Yeni servisleri ekle
  let created = 0
  let errors = 0
  for (const svc of SERVICES) {
    try {
      await prisma.service.create({
        data: {
          category: svc.category,
          label: svc.label,
          basePrice: svc.basePrice,
          minPrice: svc.minPrice,
          maxPrice: svc.maxPrice,
          homeCategory: svc.homeCategory,
          isActive: true,
        },
      })
      created++
    } catch (err) {
      console.error(`❌ ${svc.category}: ${err.message}`)
      errors++
    }
  }

  console.log(`\n✅ ${created} hizmet başarıyla eklendi`)
  if (errors > 0) console.log(`⚠️  ${errors} hata oluştu`)

  // Kategori bazlı özet
  const counts = {}
  for (const svc of SERVICES) {
    counts[svc.homeCategory] = (counts[svc.homeCategory] || 0) + 1
  }
  console.log('\n📊 Kategori Özeti:')
  const catNames = { electric: 'Elektrik', plumbing: 'Tesisat', renovation: 'Tadilat', cleaning: 'Temizlik', painting: 'Boyacı', carpentry: 'Marangoz' }
  for (const [cat, count] of Object.entries(counts)) {
    console.log(`   ${catNames[cat] || cat}: ${count} hizmet`)
  }
  console.log('')
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
