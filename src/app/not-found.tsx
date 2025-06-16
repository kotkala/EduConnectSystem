import { Search, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | EduConnect',
  description: 'The page you are looking for could not be found.',
  robots: 'noindex,nofollow',
}

/**
 * Custom 404 page with search functionality and helpful navigation
 * Based on Next.js Context7 best practices
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* 404 Visual */}
        <div className="space-y-4">
          <div className="text-6xl font-bold text-primary">404</div>
          <h1 className="text-3xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-muted-foreground text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Search Box */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Try searching for what you need:
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search courses, topics, or resources..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Navigation Options */}
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full" size="lg">
            <Link href="/courses">
              Browse Courses
            </Link>
          </Button>
          
          <Button variant="ghost" asChild className="w-full">
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </Button>
        </div>

        {/* Popular Links */}
        <div className="pt-8 border-t">
          <p className="text-sm font-medium text-foreground mb-4">
            Popular Pages
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link 
              href="/dashboard" 
              className="text-primary hover:underline"
            >
              Dashboard
            </Link>
            <Link 
              href="/courses" 
              className="text-primary hover:underline"
            >
              Courses
            </Link>
            <Link 
              href="/auth/login" 
              className="text-primary hover:underline"
            >
              Sign In
            </Link>
            <Link 
              href="/support" 
              className="text-primary hover:underline"
            >
              Support
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Still need help?{' '}
            <Link 
              href="/support" 
              className="text-primary hover:underline"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 