import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const services = [
  { category: 'ELECTRICAL_SOCKET',          label: 'Priz Tamiri',              basePrice: 400  },
  { category: 'ELECTRICAL_CIRCUIT_BREAKER', label: 'Sigorta / Kaçak Akım',     basePrice: 500  },
  { category: 'ELECTRICAL_LIGHTING',        label: 'Aydınlatma Montajı',        basePrice: 350  },
  { category: 'ELECTRICAL_PANEL',           label: 'Elektrik Panosu',           basePrice: 800  },
  { category: 'ELECTRICAL_WIRING',          label: 'Kablolama',                 basePrice: 600  },
  { category: 'PLUMBING_LEAK',              label: 'Su Sızıntısı',              basePrice: 500  },
  { category: 'PLUMBING_DRAIN',             label: 'Tıkanıklık Açma',           basePrice: 450  },
  { category: 'PLUMBING_INSTALLATION',      label: 'Tesisat Montajı',           basePrice: 700  },
  { category: 'CARPENTRY',                  label: 'Marangoz',                  basePrice: 600  },
  { category: 'GENERAL',                    label: 'Genel Tamir',               basePrice: 1000 },
]

async function main() {
  console.log('Servisler ekleniyor...')
  for (const s of services) {
    await prisma.service.upsert({
      where:  { category: s.category },
      update: { label: s.label, basePrice: s.basePrice, isActive: true },
      create: { ...s, isActive: true },
    })
    console.log(`  ✓ ${s.category}`)
  }
  console.log('Tamamlandı.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
