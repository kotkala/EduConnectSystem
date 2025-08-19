'use client'

import { LazyMotion, motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useLoadingUI } from '@/hooks/use-coordinated-loading'

// 🚀 PERFORMANCE: Lazy load motion features (Context7 best practice)
const loadFeatures = () => import('@/lib/motion-features').then(res => res.default)

/**
 * 🎯 COORDINATED LOADING OVERLAY - Context7 Implementation
 * 
 * Single loading overlay that handles all loading conflicts:
 * - Auth loading (highest priority)
 * - Global loading (medium priority)
 * - Prevents cognitive overload from multiple loading indicators
 * 
 * Design System Integration:
 * - Consistent z-index hierarchy
 * - Meaningful loading messages
 * - GPU-accelerated animations
 */
export function CoordinatedLoadingOverlay() {
  const { shouldShowOverlay, overlayProps, message, type } = useLoadingUI() // 🧹 CLEANUP: Removed unused coordinatedLoading

  if (!shouldShowOverlay) return null

  return (
    <LazyMotion features={loadFeatures}>
      <AnimatePresence mode="wait">
        <motion.div
          key="coordinated-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          {...overlayProps}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`
              flex flex-col items-center gap-3 rounded-2xl p-6
              ${type === 'auth' ? 'bg-card/95 border shadow-xl' : 'bg-card border shadow-lg'}
            `}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Loading Spinner with Context7-optimized sizing */}
            <Loader2 
              className={`
                animate-spin
                ${type === 'auth' ? 'h-10 w-10 text-primary' : 'h-8 w-8 text-primary'}
              `} 
            />
            
            {/* Meaningful Loading Message (Context7: Intrinsic cognitive load) */}
            {message && (
              <p className={`
                text-center font-medium
                ${type === 'auth' ? 'text-lg text-foreground' : 'text-sm text-muted-foreground'}
              `}>
                {message}
              </p>
            )}
            
            {/* Loading Type Indicator for Development (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs text-muted-foreground/50 mt-1">
                {type.toUpperCase()} LOADING
              </span>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </LazyMotion>
  )
}

