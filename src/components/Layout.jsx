import BottomNav from './BottomNav'

export default function Layout({ children, hideNav = false }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0F172A]">
      <main className={hideNav ? '' : 'pb-20'}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
