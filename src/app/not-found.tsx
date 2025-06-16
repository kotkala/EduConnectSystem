import { Home } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | EduConnect',
  description: 'The page you are looking for could not be found.',
  robots: 'noindex,nofollow',
}

/**
 * Custom 404 page - Clean and minimal
 * Context7 compliant not found page
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="text-6xl font-bold text-gray-300 dark:text-gray-600">404</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  )
} 