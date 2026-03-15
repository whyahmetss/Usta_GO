import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    // Redirect to landing.html which is a full standalone page
    window.location.href = '/landing.html'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Yükleniyor...</p>
      </div>
    </div>
  )
}
