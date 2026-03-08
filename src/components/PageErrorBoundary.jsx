import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

function FallbackUI({ onRetry }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
        <AlertTriangle size={32} className="text-amber-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Bir hata oluştu</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        Sayfa yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
      </p>
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
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('PageErrorBoundary:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI onRetry={this.handleRetry} />
    }
    return this.props.children
  }
}
