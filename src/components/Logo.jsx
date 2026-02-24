import { useAuth } from '../context/AuthContext'
import logoCustomer from '../assets/logo-customer.png'
import logoProfessional from '../assets/logo-professional.png'
import logoAdmin from '../assets/logo-admin.png'
import logoDefault from '../assets/logo-default.png'

const sizeMap = {
    xs: 'w-8 h-8',    // Eskiden w-8 idi, artık daha görünür
    sm: 'w-14 h-14',    // Biraz daha büyüdü
    md: 'w-16 h-16',    // Standart boyutu ciddi oranda artırdık
    lg: 'w-24 h-24',    // Büyük logolar için
    xl: 'w-48 h-48',    // Ana sayfa veya dev ekranlar için
  }

export default function Logo({ size = 'md', className = '' }) {
  const { user } = useAuth()
  const role = user?.role

  let src = logoDefault
  if (role === 'customer' || role === 'CUSTOMER') src = logoCustomer
  else if (role === 'professional' || role === 'USTA') src = logoProfessional
  else if (role === 'admin' || role === 'ADMIN') src = logoAdmin

  return (
    <img
      src={src}
      alt="Usta Go"
      className={`${sizeMap[size]} object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`}
    />
  )
}
