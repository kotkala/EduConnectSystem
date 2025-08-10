import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

// Helper function to validate and sanitize next URL
function getValidNextUrl(searchParams: URLSearchParams): string {
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    next = '/dashboard'
  }
  return next
}

// Helper function to handle OAuth errors
function handleOAuthError(origin: string, error: string): NextResponse {
  console.error('OAuth provider error:', error)
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}`)
}

// Helper function to check user profile status
async function checkUserProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  // If user has been assigned a role, go to dashboard; otherwise show pending approval
  if (profile?.role) {
    return '/dashboard'
  } else {
    return '/pending-approval'
  }
}

// Helper function to create redirect URL
function createRedirectUrl(next: string, origin: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  const redirectUrl = new URL(next, siteUrl)
  redirectUrl.searchParams.set('auth_success', 'true')
  return redirectUrl.toString()
}

// Helper function to handle OAuth code exchange
async function handleOAuthCodeExchange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  code: string,
  defaultNext: string,
  origin: string
): Promise<NextResponse> {
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth code exchange error:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // Check if user already has a complete profile
  const { data: { user } } = await supabase.auth.getUser()
  let next = defaultNext

  if (user) {
    next = await checkUserProfile(supabase, user.id)
  }

  return NextResponse.redirect(createRedirectUrl(next, origin))
}

// Helper function to handle email confirmation
async function handleEmailConfirmation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token_hash: string,
  type: EmailOtpType,
  next: string,
  origin: string,
  request: Request
): Promise<NextResponse> {
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  })

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const error = searchParams.get('error')

  const next = getValidNextUrl(searchParams)

  // Handle OAuth errors from provider
  if (error) {
    return handleOAuthError(origin, error)
  }

  const supabase = await createClient()

  // Handle OAuth code exchange (Google, etc.)
  if (code) {
    return await handleOAuthCodeExchange(supabase, code, next, origin)
  }

  // Handle email confirmation (signup confirmation only)
  if (token_hash && type && type === 'signup') {
    return await handleEmailConfirmation(supabase, token_hash, type, next, origin, request)
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
