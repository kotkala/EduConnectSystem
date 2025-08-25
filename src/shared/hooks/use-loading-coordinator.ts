'use client'

import { useCallback, useState } from 'react'
import { useLoading } from '@/shared/components/ui/loading-provider'

/**
 * 🎯 LOADING COORDINATOR HOOK
 * 
 * Standardizes loading patterns across components to prevent conflicts:
 * - Global Loading: For initial data loading and route transitions
 * - Section Loading: For non-blocking operations
 * - Component Loading: For form submissions and button actions
 */

interface UseLoadingCoordinatorOptions {
  /** Whether to use global loading for this operation */
  useGlobalLoading?: boolean
  /** Whether this is a blocking operation */
  isBlocking?: boolean
  /** Custom loading message */
  message?: string
}

interface LoadingState {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
}

export function useLoadingCoordinator(options: UseLoadingCoordinatorOptions = {}): LoadingState {
  const {
    useGlobalLoading = false,
    isBlocking = false,
    message = 'Đang tải dữ liệu...'
  } = options

  const { startLoading: startGlobalLoading, stopLoading: stopGlobalLoading, isLoading: isGlobalLoading } = useLoading()
  const [localLoading, setLocalLoading] = useState(false)

  const startLoading = useCallback(() => {
    if (useGlobalLoading || isBlocking) {
      console.log('🔄 Section Loading -> Global Loading:', message)
      startGlobalLoading(message)
    } else {
      console.log('🔄 Section Loading -> Local Loading:', message)
      setLocalLoading(true)
    }
  }, [useGlobalLoading, isBlocking, message, startGlobalLoading])

  const stopLoading = useCallback(() => {
    if (useGlobalLoading || isBlocking) {
      stopGlobalLoading()
    } else {
      setLocalLoading(false)
    }
  }, [useGlobalLoading, isBlocking, stopGlobalLoading])

  return {
    isLoading: useGlobalLoading || isBlocking ? isGlobalLoading : localLoading,
    startLoading,
    stopLoading
  }
}

/**
 * 🎯 GLOBAL LOADING HOOK - For initial data loading and route transitions
 */
export function useGlobalLoading(message?: string) {
  return useLoadingCoordinator({
    useGlobalLoading: true,
    isBlocking: true,
    message: message || 'Đang tải dữ liệu...'
  })
}

/**
 * 🎯 SECTION LOADING HOOK - For non-blocking operations
 */
export function useSectionLoading(message?: string) {
  return useLoadingCoordinator({
    useGlobalLoading: false,
    isBlocking: false,
    message
  })
}

/**
 * 🎯 COMPONENT LOADING HOOK - For form submissions and button actions
 */
export function useComponentLoading() {
  return useLoadingCoordinator({
    useGlobalLoading: false,
    isBlocking: false
  })
}
