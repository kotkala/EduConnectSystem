'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendOtpClient, verifyOtpClient } from '@/lib/auth-utils'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // Context7 pattern: Direct client-side OTP
  const handleSendOtp = async (email: string) => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      await sendOtpClient(email)
      setEmail(email)
      setStep('otp')
      toast.success('OTP sent to your email')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Context7 pattern: Direct client-side verify
  const handleVerifyOtp = async (token: string) => {
    if (!token.trim()) {
      toast.error('Please enter the OTP code')
      return
    }

    setLoading(true)
    try {
      await verifyOtpClient(email, token)
      onOpenChange(false) // Close modal
      toast.success('Successfully signed in!')
      // Reset state for next time
      setStep('email')
      setEmail('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid OTP code')
    } finally {
      setLoading(false)
    }
  }



  const handleBack = () => {
    setStep('email')
    setEmail('')
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state when closing
    setStep('email')
    setEmail('')
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">
            {step === 'email' ? 'Sign In with Email' : 'Enter Verification Code'}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          {step === 'email' ? (
            <EmailStep
              onSubmit={handleSendOtp}
              loading={loading}
            />
          ) : (
            <OtpStep
              email={email}
              onSubmit={handleVerifyOtp}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Email input step component
interface EmailStepProps {
  onSubmit: (email: string) => void
  loading: boolean
}

function EmailStep({ onSubmit, loading }: EmailStepProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(email)
  }

  return (
    <div className="space-y-6">
      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending OTP...
            </>
          ) : (
            'Send Verification Code'
          )}
        </Button>
      </form>
    </div>
  )
}

// OTP verification step component
interface OtpStepProps {
  email: string
  onSubmit: (token: string) => void
  onBack: () => void
  loading: boolean
}

function OtpStep({ email, onSubmit, onBack, loading }: OtpStepProps) {
  const [token, setToken] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(token)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a 6-digit verification code to
        </p>
        <p className="font-medium">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">Verification Code</Label>
          <Input
            id="token"
            type="text"
            placeholder="Enter 6-digit code"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-lg tracking-widest"
            maxLength={6}
            required
            disabled={loading}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={loading || token.length !== 6}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>
      </form>

      <Button
        variant="ghost"
        onClick={onBack}
        disabled={loading}
        className="w-full"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to email
      </Button>
    </div>
  )
}
