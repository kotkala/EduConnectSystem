'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function ClassesErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Classes page error:', error)
  }, [error])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-muted-foreground">
            An error occurred while loading the classes page
          </p>
        </div>
      </div>

      {/* Error Card */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Something went wrong!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Error Details:</p>
                <p className="text-sm font-mono bg-red-50 p-2 rounded border">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This error might be caused by:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Database connection issues</li>
              <li>Missing environment variables</li>
              <li>Server action configuration problems</li>
              <li>Authentication or permission issues</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => reset()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/admin'}
            >
              Go to Admin Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Stack Trace:</p>
              <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                {error.stack}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
