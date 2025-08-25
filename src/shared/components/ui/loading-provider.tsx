'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'
import { GlobalSandyLoading } from './sandy-loading'

interface LoadingContextType {
  isLoading: boolean
  loadingMessage: string
  startLoading: (message?: string) => void
  stopLoading: () => void
  clearAllLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Đang tải dữ liệu...')
  const loadingQueueRef = useRef<string[]>([])
  const loadingCountRef = useRef(0)

  const startLoading = useCallback((message = 'Đang tải dữ liệu...') => {
    console.log('🔄 Global Loading Started:', message)
    loadingCountRef.current += 1
    loadingQueueRef.current.push(message)
    if (loadingCountRef.current === 1) {
      setLoadingMessage(message)
      setIsLoading(true)
    }
    if (loadingQueueRef.current.length > 10) {
      console.warn('⚠️ Too many loading states active:', loadingQueueRef.current.length)
    }
  }, [])

  const stopLoading = useCallback(() => {
    if (loadingCountRef.current > 0) {
      loadingCountRef.current -= 1
      loadingQueueRef.current.shift()
      if (loadingCountRef.current > 0 && loadingQueueRef.current.length > 0) {
        setLoadingMessage(loadingQueueRef.current[0])
      } else {
        console.log('✅ Global Loading Stopped')
        setIsLoading(false)
        loadingQueueRef.current = []
        loadingCountRef.current = 0
      }
    }
  }, [])

  const clearAllLoading = useCallback(() => {
    setIsLoading(false)
    loadingQueueRef.current = []
    loadingCountRef.current = 0
  }, [])

  return (
    <LoadingContext.Provider value={{
      isLoading,
      loadingMessage,
      startLoading,
      stopLoading,
      clearAllLoading
    }}>
      {children}
      {isLoading && (
        <GlobalSandyLoading message={loadingMessage} />
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
