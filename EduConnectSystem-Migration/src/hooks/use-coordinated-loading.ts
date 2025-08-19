'use client'

import { useCallback } from 'react'
import { useAuth } from './use-auth'
import { useGlobalLoading } from '@/shared/components/ui/global-loading-provider'
import { cn } from '@/lib/utils'

/**
 * 🎯 COORDINATED LOADING HOOK - Context7 Best Practice
 * 
 * Resolves loading state conflicts by implementing cognitive load hierarchy:
 * 1. Auth loading (highest priority) - blocks entire app
 * 2. Global loading (medium priority) - blocks page interaction  
 * 3. Section loading (lowest priority) - non-blocking components
 * 
 * Based on Context7 research:
 * - Single loading indicator reduces cognitive overload
 * - Meaningful messages provide intrinsic cognitive load
 * - Priority hierarchy prevents confusion
 */

interface CoordinatedLoadingState {
  isLoading: boolean
  message: string
  type: 'auth' | 'global' | 'section'
  source: 'auth' | 'global'
}

export function useCoordinatedLoading(): CoordinatedLoadingState {
  const { loading: authLoading } = useAuth()
  const { loading: globalLoading } = useGlobalLoading()

  // 🎯 PRIORITY HIERARCHY (Context7: Minimize cognitive load)
  if (authLoading) {
    return {
      isLoading: true,
      message: "Đang xác thực tài khoản...",
      type: 'auth',
      source: 'auth'
    }
  }

  if (globalLoading.isLoading) {
    return {
      isLoading: true,
      message: globalLoading.message || "Đang tải...",
      type: 'global', 
      source: 'global'
    }
  }

  return {
    isLoading: false,
    message: "",
    type: 'section',
    source: 'global'
  }
}

/**
 * 🚀 PAGE TRANSITION HOOK - Enhanced with coordination
 * 
 * Ensures page transitions don't conflict with auth loading
 * Context7 principle: Prevent extraneous cognitive load from overlapping states
 */
export function usePageTransition() {
  const { loading: authLoading } = useAuth()
  const { startLoading, stopLoading } = useGlobalLoading()
  
  const startPageTransition = useCallback((message?: string) => {
    // Don't start global loading if auth is already loading
    if (!authLoading) {
      startLoading(message, 'page')
    }
  }, [authLoading, startLoading])

  const stopPageTransition = useCallback(() => {
    // Always safe to stop global loading
    stopLoading()
  }, [stopLoading])

  return {
    startPageTransition,
    stopLoading: stopPageTransition
  }
}

/**
 * 🎨 LOADING UI HELPER - Design System Integration
 * 
 * Provides consistent loading UI props based on coordinated state
 * Context7 principle: Consistent visual patterns reduce learning curve
 */
export function useLoadingUI() {
  const coordinatedLoading = useCoordinatedLoading()
  
  return {
    shouldShowOverlay: coordinatedLoading.isLoading && (coordinatedLoading.type === 'auth' || coordinatedLoading.type === 'global'),
    overlayProps: {
      className: cn(
        "fixed inset-0 flex items-center justify-center",
        coordinatedLoading.type === 'auth' && "bg-background/90 backdrop-blur-md",
        coordinatedLoading.type === 'global' && "bg-background/80 backdrop-blur-sm"
      ),
      style: { 
        zIndex: coordinatedLoading.type === 'auth' ? 10000 : 9999,
        willChange: 'opacity'
      }
    },
    message: coordinatedLoading.message,
    type: coordinatedLoading.type
  }
}
