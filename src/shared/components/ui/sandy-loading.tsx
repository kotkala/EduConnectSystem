'use client'

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { memo } from 'react'

// Lazy load DotLottieReact for better bundle size and tree-shaking
const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then(mod => mod.DotLottieReact),
  { ssr: false }
)

/**
 * 🏖️ SANDY LOADING - Global & Route Loading Only
 * 
 * Full-screen overlay loading with Lottie animation.
 * Used ONLY for Global and Route-level loading states.
 * 
 * For Component-level loading, use Skeleton components instead.
 */

interface SandyLoadingProps {
  /** Loading message to display */
  message?: string
  /** Animation speed (default: 1) */
  speed?: number
  /** Custom animation src (default: Sandy Loading.lottie) */
  src?: string
  /** Background overlay style */
  overlayStyle?: 'default' | 'gradient' | 'transparent'
}

/**
 * 🎯 GLOBAL SANDY LOADING - For global app loading states
 * 
 * Full-screen overlay that pops up and shows Lottie animation.
 * Automatically disappears when loading completes.
 * 
 * @example
 * ```tsx
 * // Global loading (auth, initial data, etc.)
 * <GlobalSandyLoading message="Đang khởi tạo ứng dụng..." />
 * ```
 */
export const GlobalSandyLoading = memo<SandyLoadingProps>(({ 
  message = "Đang tải dữ liệu...",
  speed = 1,
  src = '/animations/Sandy Loading.lottie',
  overlayStyle = 'default'
}) => {
  const overlayClasses = {
    default: 'bg-background/80 backdrop-blur-sm',
    gradient: 'bg-gradient-to-br from-orange-50 to-orange-100',
    transparent: 'bg-transparent'
  }

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      overlayClasses[overlayStyle]
    )}>
      <div className="text-center space-y-6">
        <DotLottieReact
          src={src}
          loop
          autoplay
          speed={speed}
          className="w-32 h-32 md:w-48 md:h-48 drop-shadow-lg"
          style={{ willChange: 'transform' }}
        />
        <p className="text-lg font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  )
})

GlobalSandyLoading.displayName = 'GlobalSandyLoading'

/**
 * 🔄 ROUTE SANDY LOADING - For route-level loading.tsx files
 * 
 * Full-screen loading for page transitions and route changes.
 * 
 * @example
 * ```tsx
 * // In loading.tsx files
 * <RouteSandyLoading message="Đang tải trang..." />
 * ```
 */
export const RouteSandyLoading = memo<SandyLoadingProps>(({ 
  message = "Đang tải trang...",
  speed = 1,
  src = '/animations/Sandy Loading.lottie'
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="text-center space-y-6">
        <DotLottieReact
          src={src}
          loop
          autoplay
          speed={speed}
          className="w-48 h-48 drop-shadow-lg"
          style={{ willChange: 'transform' }}
        />
        <p className="text-xl font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  )
})

RouteSandyLoading.displayName = 'RouteSandyLoading'

/**
 * 🎯 LOADING MESSAGES CONSTANTS - Context7 Compliant
 */
export const SANDY_LOADING_MESSAGES = {
  /** Authentication loading (highest priority) */
  AUTH: "Đang xác thực tài khoản...",
  /** Global app initialization */
  GLOBAL: "Đang khởi tạo ứng dụng...",
  /** Route/page transition */
  ROUTE: "Đang tải trang...",
  /** Page loading */
  PAGE: "Đang tải trang..."
} as const

// Legacy exports for backward compatibility (deprecated)
export const SandyLoading = GlobalSandyLoading
export const PageSandyLoading = RouteSandyLoading