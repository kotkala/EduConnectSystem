import { Loader2 } from 'lucide-react'

/**
 * Global loading component - Clean and minimal
 * Context7 compliant loading state
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  )
} 