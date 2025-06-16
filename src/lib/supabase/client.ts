import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for Server Components
 * Cached to prevent multiple instances per request
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Handle cookie setting errors in middleware/edge runtime
            console.warn('Failed to set cookies:', error)
          }
        },
      },
    }
  )
})

/**
 * Creates a read-only Supabase client for Server Components
 * Optimized for data fetching with better performance
 */
export const createReadOnlyClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op for read-only client
        },
      },
    }
  )
})

/**
 * Gets the current user with proper error handling
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
})

/**
 * Gets the current user's profile with role information
 */
export const getCurrentProfile = cache(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const supabase = await createReadOnlyClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error getting profile:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Failed to get current profile:', error)
    return null
  }
})

/**
 * Checks if the current user has a specific role
 */
export const hasRole = cache(async (role: 'student' | 'teacher' | 'admin') => {
  try {
    const profile = await getCurrentProfile()
    if (!profile) return false

    // Admin has access to everything
    if (profile.role === 'admin') return true
    
    // Teacher has access to teacher and student features
    if (role === 'teacher' && profile.role === 'teacher') return true
    
    // Everyone has student access
    if (role === 'student') return true

    return profile.role === role
  } catch (error) {
    console.error('Failed to check role:', error)
    return false
  }
})

/**
 * Gets user courses with optimized query and proper filtering
 */
export const getUserCourses = cache(async (userId?: string) => {
  try {
    const supabase = await createReadOnlyClient()
    const currentUser = userId || (await getCurrentUser())?.id
    
    if (!currentUser) return []

    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:profiles!instructor_id (
          id,
          full_name,
          email
        ),
        enrollments!inner (
          enrolled_at,
          completed_at
        )
      `)
      .eq('enrollments.student_id', currentUser)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user courses:', error)
      return []
    }

    return courses || []
  } catch (error) {
    console.error('Failed to get user courses:', error)
    return []
  }
})

/**
 * Gets courses taught by the current user (for teachers)
 */
export const getInstructorCourses = cache(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createReadOnlyClient()
    
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        _count:enrollments(count)
      `)
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting instructor courses:', error)
      return []
    }

    return courses || []
  } catch (error) {
    console.error('Failed to get instructor courses:', error)
    return []
  }
})

/**
 * Type-safe error handling for Supabase operations
 */
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

/**
 * Wrapper for Supabase operations with proper error handling
 */
export async function handleSupabaseOperation<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await operation()
    
    if (error) {
      throw new SupabaseError(
        error.message || 'Database operation failed',
        error.code,
        error.details
      )
    }
    
    if (data === null) {
      throw new SupabaseError('No data returned from operation')
    }
    
    return data
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error
    }
    
    throw new SupabaseError(
      'Unexpected error during database operation',
      'UNEXPECTED_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}
