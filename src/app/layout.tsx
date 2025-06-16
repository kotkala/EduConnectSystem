import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import type { Metadata, Viewport } from 'next'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'EduConnect - Modern Learning Management System',
    template: '%s | EduConnect',
  },
  description: 'A modern, secure, and feature-rich learning management system built with Next.js and Supabase.',
  keywords: [
    'education',
    'learning management system',
    'online courses',
    'e-learning',
    'student portal',
    'teacher dashboard',
  ],
  authors: [
    {
      name: 'EduConnect Team',
      url: 'https://educonnect.example.com',
    },
  ],
  creator: 'EduConnect Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://educonnect.example.com',
    title: 'EduConnect - Modern Learning Management System',
    description: 'A modern, secure, and feature-rich learning management system built with Next.js and Supabase.',
    siteName: 'EduConnect',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'EduConnect - Modern Learning Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduConnect - Modern Learning Management System',
    description: 'A modern, secure, and feature-rich learning management system built with Next.js and Supabase.',
    images: ['/twitter-image.png'],
    creator: '@educonnect',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

/**
 * Enhanced root layout with performance optimizations, proper metadata,
 * and monitoring based on Context7 Next.js best practices
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
