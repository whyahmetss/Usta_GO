import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

function FallbackUI({ onRetry, errorMessage }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center bg-zinc-950" role="alert">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-rose-400" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">Bir sorun olustu</h2>
      <p className="text-xs text-zinc-500 mb-3 max-w-xs">
        Sayfa yueklenirken beklenmedik bir hata meydana geldi. Lutfen tekrar deneyin.
      </p>
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 mb-5 max-w-sm w-full">
          <p className="text-[10px] font-mono text-rose-400 break-all text-left">{errorMessage}</p>
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => { window.location.href = '/admin' }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] text-zinc-300 rounded-xl text-xs font-semibold hover:bg-white/[0.1] transition active:scale-[0.98]"
        >
          <Home size={13} /> Dashboard
        </button>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition active:scale-[0.98]"
        >
          <RefreshCw size={13} /> Tekrar Dene
        </button>
      </div>
    </div>
  )
}

export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || String(error) }
  }

  componentDidCatch(error, info) {
    console.error('PageErrorBoundary caught:', error?.message, info)
    this.setState({ errorMessage: error?.message || String(error) })
  }

  handleRetry = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI onRetry={this.handleRetry} errorMessage={this.state.errorMessage} />
    }
    return this.props.children
  }
}
