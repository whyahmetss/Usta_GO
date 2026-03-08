import BottomNav from './BottomNav'

export default function Layout({ children, hideNav = false }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0c0c]">
      <main className={hideNav ? '' : 'pb-20'}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
