'use client'

import { useEffect } from 'react'
import { useLoading } from '@/shared/components/ui/loading-provider'

/**
 * 🐛 LOADING DEBUG HOOK
 * 
 * Helps debug loading state conflicts and monitor loading patterns
 * Only active in development mode
 */

export function useLoadingDebug() {
  const { isLoading, loadingMessage } = useLoading()

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (isLoading) {
        console.log('🔄 Global Loading Started:', loadingMessage)
      } else {
        console.log('✅ Global Loading Stopped')
      }
    }
  }, [isLoading, loadingMessage])

  // Monitor for potential loading conflicts
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const checkForConflicts = () => {
        // Check if there are multiple loading elements
        const loadingElements = document.querySelectorAll('[data-loading="true"]')
        if (loadingElements.length > 1) {
          console.warn('⚠️ Multiple loading elements detected:', loadingElements.length)
        }
      }

      // Check after a short delay to allow for DOM updates
      const timeoutId = setTimeout(checkForConflicts, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [isLoading])
}
