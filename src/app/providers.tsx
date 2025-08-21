'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/shared/components/ui/sonner'
import { GlobalLoadingProvider } from '@/shared/components/ui/global-loading-provider'
import { CoordinatedLoadingOverlay } from '@/shared/components/ui/coordinated-loading-overlay'
import { AuthErrorBoundary } from '@/shared/components/ui/auth-error-boundary'

export default function Providers({ children }: { readonly children: React.ReactNode }) {
  // Create QueryClient with optimized defaults for performance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1, // Reduce retries for faster error feedback
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
      },
    },
  }))

  return (
    <AuthErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </AuthErrorBoundary>
  )
}


