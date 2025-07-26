'use client'

import { useState, useCallback } from 'react'
import { useMediaQuery } from '@/hooks/use-mobile'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { clientAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { OtpInput } from '@/components/ui/otp-input'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // Optimized OTP sending with better UX
  const handleSendOtp = useCallback(async (email: string) => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      await clientAuth.sendOtp(email)
      setEmail(email)
      setStep('otp')
      toast.success('Verification code sent!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimized OTP verification
  const handleVerifyOtp = useCallback(async (token: string) => {
    if (!token.trim() || token.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    try {
      await clientAuth.verifyOtp(email, token)
      onOpenChange(false)
      toast.success('Welcome to EduConnect!')
      // Reset state
      setStep('email')
      setEmail('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }, [email, onOpenChange])



  const handleBack = useCallback(() => {
    setStep('email')
    setEmail('')
  }, [])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setStep('email')
    setEmail('')
    setLoading(false)
  }, [onOpenChange])

  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-semibold">
              {step === 'email' ? 'Welcome back' : 'Check your email'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {step === 'email'
                ? 'Enter your email to continue to EduConnect'
                : `We sent a verification code to ${email}`
              }
            </p>
          </DialogHeader>

          <div className="mt-6">
            {step === 'email' ? (
              <EmailStep onSubmit={handleSendOtp} loading={loading} />
            ) : (
              <OtpStep
                email={email}
                onSubmit={handleVerifyOtp}
                onBack={handleBack}
                loading={loading}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 'email' ? 'Welcome back' : 'Check your email'}
            </DialogTitle>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {step === 'email'
                ? 'Enter your email to continue to EduConnect'
                : `We sent a verification code to ${email}`
              }
            </p>
          </div>
        </DialogHeader>

        <div className="px-6 pb-8">
          {step === 'email' ? (
            <EmailStep onSubmit={handleSendOtp} loading={loading} />
          ) : (
            <OtpStep
              email={email}
              onSubmit={handleVerifyOtp}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Optimized Email Step
interface EmailStepProps {
  onSubmit: (email: string) => void
  loading: boolean
}

function EmailStep({ onSubmit, loading }: EmailStepProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) onSubmit(email.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="student@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-11 h-12 text-base border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
            required
            disabled={loading}
            autoFocus
            autoComplete="email"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        disabled={loading || !email.trim()}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending code...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </form>
  )
}

// Optimized OTP Step with beautiful OTP Input
interface OtpStepProps {
  email: string
  onSubmit: (token: string) => void
  onBack: () => void
  loading: boolean
}

function OtpStep({ email, onSubmit, onBack, loading }: OtpStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Enter the 6-digit code sent to
        </p>
        <p className="font-medium text-base text-gray-900 dark:text-white">{email}</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium text-center block text-gray-900 dark:text-white">
            Verification code
          </Label>
          <OtpInput
            length={6}
            onComplete={onSubmit}
            disabled={loading}
            className="justify-center"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={loading}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change email
        </Button>
      </div>
    </div>
  )
}
