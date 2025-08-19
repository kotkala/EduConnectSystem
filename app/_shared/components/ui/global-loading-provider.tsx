'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingState {
  isLoading: boolean
  message?: string
  type?: 'page' | 'action' | 'component'
}

interface LoadingContextType {
  loading: LoadingState
  setLoading: (state: LoadingState) => void
  startLoading: (message?: string, type?: LoadingState['type']) => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useGlobalLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useGlobalLoading must be used within LoadingProvider')
  }
  return context
}

// 🚀 NOTE: Coordinated loading hooks moved to separate file to avoid circular dependency
// Import from '@/hooks/use-coordinated-loading' directly where needed

interface LoadingProviderProps {
  readonly children: ReactNode
}

export function GlobalLoadingProvider({ children }: LoadingProviderProps) {
  const [loading, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    type: 'page'
  })

  const setLoading = useCallback((state: LoadingState) => {
    setLoadingState(state)
  }, [])

  const startLoading = useCallback((message?: string, type: LoadingState['type'] = 'page') => {
    setLoadingState({
      isLoading: true,
      message,
      type
    })
  }, [])

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      message: undefined,
      type: 'page'
    })
  }, [])

  return (
    <LoadingContext.Provider value={{ loading, setLoading, startLoading, stopLoading }}>
      {children}
      {/* 🎯 DISABLED: Old overlay replaced by CoordinatedLoadingOverlay */}
      {/* <GlobalLoadingOverlay loading={loading} /> */}
    </LoadingContext.Provider>
  )
}

// GlobalLoadingOverlay component removed - functionality moved to CoordinatedLoadingOverlay

// 🎯 SIMPLIFIED: Hook for page transitions (coordination handled by CoordinatedLoadingOverlay)
export function usePageTransition() {
  const { startLoading, stopLoading } = useGlobalLoading()

  const startPageTransition = useCallback((message = "Đang chuyển trang...") => {
    startLoading(message, 'page')
  }, [startLoading])

  const startActionLoading = useCallback((message = "Đang xử lý...") => {
    startLoading(message, 'action')
  }, [startLoading])

  return {
    startPageTransition,
    startActionLoading,
    stopLoading
  }
}

// Hook for component-level loading
export function useComponentLoading() {
  const { startLoading, stopLoading } = useGlobalLoading()

  const startComponentLoading = useCallback((message?: string) => {
    startLoading(message, 'component')
  }, [startLoading])

  return {
    startComponentLoading,
    stopLoading
  }
}
