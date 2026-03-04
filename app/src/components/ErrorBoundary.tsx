import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: 32,
          background: 'var(--bg-primary, #0f1117)',
          color: 'var(--text-primary, #e0e0e6)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted, #8888a0)',
            maxWidth: 480,
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 1.6,
          }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--accent, #3b82f6)',
              background: 'rgba(59,130,246,0.15)',
              color: 'var(--accent, #3b82f6)',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
