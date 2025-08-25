'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/shared/components/ui/sonner'

import { AuthErrorBoundary } from '@/shared/components/ui/auth-error-boundary'
import { LoadingProvider } from '@/shared/components/ui/loading-provider'
import { useLoadingDebug } from '@/shared/hooks/use-loading-debug'

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
          <LoadingProvider>
            <LoadingDebugWrapper>
              {children}
              <Toaster position="top-center" />
            </LoadingDebugWrapper>
          </LoadingProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthErrorBoundary>
  )
}

// Wrapper component to use debug hook
function LoadingDebugWrapper({ children }: { children: React.ReactNode }) {
  useLoadingDebug()
  return <>{children}</>
}


