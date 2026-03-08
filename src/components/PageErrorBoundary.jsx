import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

function FallbackUI({ onRetry, errorMessage }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
        <AlertTriangle size={32} className="text-amber-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Bir hata oluştu</h2>
      {errorMessage && (
        <p className="text-xs font-mono text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2 mb-4 max-w-xs break-all text-left">
          {errorMessage}
        </p>
      )}
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold text-sm active:scale-[0.98]"
      >
        Tekrar Dene
      </button>
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
