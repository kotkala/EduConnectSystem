'use client'

import React from 'react'

interface AuthErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error but don't show it to the user unless it's critical
    console.warn('Auth boundary caught error:', error, errorInfo)
    
    // Only show error to user if it's a critical auth error
    const isCriticalAuthError = error.message.includes('auth') || 
                               error.message.includes('session') ||
                               error.message.includes('token')
    
    if (!isCriticalAuthError) {
      // For non-critical errors, just reset the boundary
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined })
      }, 100)
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultAuthErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error} 
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      )
    }

    return this.props.children
  }
}

// Default fallback component for auth errors
function DefaultAuthErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold">Đang khởi tạo ứng dụng...</h2>
        <p className="text-muted-foreground text-sm">
          Vui lòng đợi trong giây lát
        </p>
        <button 
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Thử lại
        </button>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-xs text-left bg-muted p-2 rounded">
            <summary>Chi tiết lỗi (Development)</summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
