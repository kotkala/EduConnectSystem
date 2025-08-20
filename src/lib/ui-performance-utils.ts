// UI/UX Performance Utilities - Context7 Best Practices
// Tracking new patterns that affect user experience

/**
 * GPU Acceleration Helper
 * Apply to elements that will be animated frequently
 */
export const gpuAccelerate = {
  willChange: 'transform',
  backfaceVisibility: 'hidden' as const,
  perspective: '1000px',
  transform: 'translateZ(0)', // Force GPU layer
} as const

/**
 * Loading State Performance Pattern
 * Prevents layout shifts during loading transitions
 */
export const stableLoading = {
  minHeight: 'auto',
  transition: 'opacity 150ms ease-in-out',
} as const

/**
 * Reduce Motion Query - Accessibility & Performance
 * Respect user preferences for reduced motion
 */
export const respectReducedMotion = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return false
}

/**
 * Intersection Observer Performance Pattern
 * Lazy load animations only when visible
 */
export const createLazyAnimation = (callback: () => void, threshold = 0.1) => {
  if (typeof window === 'undefined') return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback()
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold }
  )

  return observer
}
