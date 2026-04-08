import mainLogo from '../assets/main-logo.png'

const sizeMap = {
    xs: 'w-8 h-8',    // Eskiden w-8 idi, artık daha görünür
    sm: 'w-14 h-14',    // Biraz daha büyüdü
    md: 'w-16 h-16',    // Standart boyutu ciddi oranda artırdık
    lg: 'w-24 h-24',    // Büyük logolar için
    xl: 'w-48 h-48',    // Ana sayfa veya dev ekranlar için
  }

export default function Logo({ size = 'md', className = '' }) {
  const src = mainLogo

  return (
    <img
      src={src}
      alt="Usta Go"
     className={`${sizeMap[size] || sizeMap.md} rounded-xl object-contain ${className}`}
    />
  )
}
