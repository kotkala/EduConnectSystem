import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const error = searchParams.get('error')

  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth provider error:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}`)
  }

  const supabase = await createClient()

  // Handle OAuth code exchange (Google, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user already has a complete profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        // If profile exists and is complete, go to dashboard
        if (profile && profile.role && profile.full_name) {
          next = '/dashboard'
        } else {
          // Otherwise go to profile setup
          next = '/profile/setup'
        }
      }

      // Add success parameter to match OTP flow experience
      const redirectUrl = new URL(next, origin)
      redirectUrl.searchParams.set('auth_success', 'true')

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(redirectUrl.toString())
      } else if (forwardedHost) {
        redirectUrl.protocol = 'https:'
        redirectUrl.host = forwardedHost
        return NextResponse.redirect(redirectUrl.toString())
      } else {
        return NextResponse.redirect(redirectUrl.toString())
      }
    } else {
      console.error('OAuth code exchange error:', error)
    }
  }

  // Handle email confirmation (signup confirmation only)
  if (token_hash && type && type === 'signup') {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
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
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
