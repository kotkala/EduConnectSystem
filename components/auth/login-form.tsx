'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleAuthButton } from './google-auth-button'
import { OTPInput } from './otp-input'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const router = useRouter()

  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    try {
      setIsLoading(true)
      await authClient.sendOtp({ email })
      setOtpSent(true)
      toast.success('OTP sent to your email!')
    } catch (error) {
      console.error('OTP request error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSuccess = async () => {
    toast.success('Successfully signed in!')

    // Check if user has complete profile
    try {
      const user = await authClient.getCurrentUser()
      if (user) {
        const profile = await authClient.getUserProfile(user.id)
        if (profile && profile.role && profile.full_name) {
          router.push('/dashboard')
        } else {
          router.push('/profile/setup')
        }
      } else {
        router.push('/profile/setup')
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      router.push('/profile/setup')
    }
  }

  const handleBackToEmail = () => {
    setOtpSent(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your EduConnect account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleAuthButton className="w-full" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {!otpSent ? (
            <form onSubmit={handleOTPRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <OTPInput
              email={email}
              onSuccess={handleOTPSuccess}
              onBack={handleBackToEmail}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
