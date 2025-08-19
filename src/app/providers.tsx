'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/shared/components/ui/sonner'
import { GlobalLoadingProvider } from '@/shared/components/ui/global-loading-provider'
import { CoordinatedLoadingOverlay } from '@/shared/components/ui/coordinated-loading-overlay'
import { AuthErrorBoundary } from '@/shared/components/ui/auth-error-boundary'

export default function Providers({ children }: { readonly children: React.ReactNode }) {
  return (
    <AuthErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <GlobalLoadingProvider>
          {children}
          {/* ðŸŽ¯ COORDINATED LOADING: Single overlay for all loading conflicts */}
          <CoordinatedLoadingOverlay />
          <Toaster position="top-center" />
        </GlobalLoadingProvider>
      </ThemeProvider>
    </AuthErrorBoundary>
  )
}


