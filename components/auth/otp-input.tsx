'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyOtpAction, resendOtpAction } from '@/lib/auth-actions'
import { toast } from 'sonner'

interface OTPInputProps {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export function OTPInput({ email, onSuccess, onBack }: OTPInputProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    const newOtp = [...otp]
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i]
      }
    }
    
    setOtp(newOtp)
    
    // Focus next empty input or last input
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)
    try {
      const result = await verifyOtpAction({
        email,
        token: otpCode
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Successfully verified!')
        onSuccess()

        // Handle redirect if provided
        if (result.redirectTo) {
          router.push(result.redirectTo)
        }
      }
    } catch (err) {
      console.error('Verification error:', err)
      toast.error('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const result = await resendOtpAction(email)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('New code sent to your email')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      console.error('Resend error:', err)
      toast.error('Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Enter verification code</h2>
        <p className="text-muted-foreground mt-2">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <div className="space-y-4">
        <Label htmlFor="otp">Verification Code</Label>
        <div className="flex gap-2 justify-center">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-lg font-semibold"
              disabled={loading}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={handleVerify} 
          disabled={loading || otp.join('').length !== 6}
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onBack}
            disabled={loading || resending}
            className="flex-1"
          >
            Back
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleResend}
            disabled={loading || resending}
            className="flex-1"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Code expires in 24 hours. Check your spam folder if you don&apos;t see the email.
      </p>
    </div>
  )
}
