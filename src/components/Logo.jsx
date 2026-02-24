import { useAuth } from '../context/AuthContext'
import logoCustomer from '../assets/logo-customer.svg'
import logoProfessional from '../assets/logo-professional.svg'
import logoAdmin from '../assets/logo-admin.svg'
import logoDefault from '../assets/logo-default.svg'

const sizeMap = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
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
      className={`${sizeMap[size] || sizeMap.md} rounded-xl object-contain ${className}`}
    />
  )
}
