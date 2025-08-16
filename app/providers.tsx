'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { GlobalLoadingProvider } from '@/components/ui/global-loading-provider'
import { CoordinatedLoadingOverlay } from '@/components/ui/coordinated-loading-overlay'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <GlobalLoadingProvider>
        {children}
        {/* 🎯 COORDINATED LOADING: Single overlay for all loading conflicts */}
        <CoordinatedLoadingOverlay />
        <Toaster position="top-center" />
      </GlobalLoadingProvider>
    </ThemeProvider>
  )
}


