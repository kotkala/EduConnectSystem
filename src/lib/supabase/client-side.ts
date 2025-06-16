'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * Creates a Supabase client for Client Components
 * Implements singleton pattern to prevent multiple instances
 */
export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return client
}

/**
 * React Hook for Supabase client in Client Components
 */
export function useSupabase() {
  return createClient()
} 