'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 text-6xl">🔍</div>
          <CardTitle className="text-3xl">404</CardTitle>
          <CardDescription className="text-lg">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/">
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            ← Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
