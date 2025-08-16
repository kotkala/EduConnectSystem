'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
// 🚀 OPTIMIZATION: Use LazyMotion for better performance
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// 🚀 RE-EXPORT: Coordinated loading hooks for backward compatibility
export { useCoordinatedLoading, useLoadingUI } from '@/hooks/use-coordinated-loading'

interface LoadingProviderProps {
  children: ReactNode
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

interface GlobalLoadingOverlayProps {
  loading: LoadingState
}

function GlobalLoadingOverlay({ loading }: GlobalLoadingOverlayProps) {
  if (!loading.isLoading) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="global-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={cn(
          "fixed inset-0 flex items-center justify-center",
          loading.type === 'page' && "bg-background/80 backdrop-blur-sm",
          loading.type === 'action' && "bg-black/20 backdrop-blur-[2px]",
          loading.type === 'component' && "bg-transparent"
        )}
        style={{ willChange: 'opacity', zIndex: 9999 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-2xl p-6",
            loading.type === 'page' && "bg-card border shadow-lg",
            loading.type === 'action' && "bg-card/95 border shadow-xl",
            loading.type === 'component' && "bg-transparent"
          )}
          style={{ willChange: 'transform, opacity' }}
        >
          <Loader2 
            className={cn(
              "animate-spin",
              loading.type === 'page' && "h-8 w-8 text-primary",
              loading.type === 'action' && "h-6 w-6 text-primary",
              loading.type === 'component' && "h-5 w-5 text-muted-foreground"
            )} 
          />
          {loading.message && (
            <p className={cn(
              "text-center font-medium",
              loading.type === 'page' && "text-sm text-foreground",
              loading.type === 'action' && "text-xs text-muted-foreground",
              loading.type === 'component' && "text-xs text-muted-foreground"
            )}>
              {loading.message}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

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
