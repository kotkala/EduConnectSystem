'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { createUserProfileClient } from '@/lib/auth-utils'
import { UserRole } from '@/lib/types'
import { toast } from 'sonner'

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: 'student', label: 'Student', description: 'Access courses and learning materials' },
  { value: 'teacher', label: 'Teacher', description: 'Create and manage courses' },
  { value: 'parent', label: 'Parent', description: 'Monitor child\'s progress' },
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
]

function ProfileSetupContent() {
  const { user, profile, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'student' as UserRole,
  })
  const router = useRouter()
  const searchParams = useSearchParams()

  // Show success toast for OAuth authentication
  useEffect(() => {
    const authSuccess = searchParams.get('auth_success')
    if (authSuccess === 'true') {
      toast.success('Successfully signed in!')
      // Clean up the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_success')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Pre-fill form with existing profile data
  useEffect(() => {
    if (profile) {
      // If profile is complete, redirect to dashboard
      if (profile.role && profile.full_name) {
        router.push('/dashboard')
        return
      }

      // Pre-fill form with existing data
      setFormData({
        full_name: profile.full_name || '',
        role: profile.role || 'student',
      })
    }
  }, [profile, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name')
      return
    }

    if (!user) {
      toast.error('User not found. Please sign in again.')
      return
    }

    try {
      setIsLoading(true)

      // Create user profile using client function
      await createUserProfileClient({
        full_name: formData.full_name,
        role: formData.role,
      })

      // Refresh profile data
      await refreshProfile()
      toast.success('Profile setup completed successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Profile setup error:', error)
      toast.error('Failed to setup profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to set up your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
            <CardDescription className="text-center">
              Tell us a bit about yourself to get started with EduConnect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  This is your verified email address
                </p>
              </div>
              
              <div className="space-y-3">
                <Label>Select your role *</Label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((role) => (
                    <motion.div
                      key={role.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        type="button"
                        onClick={() => handleInputChange('role', role.value)}
                        className={`w-full p-3 text-left border rounded-lg transition-colors ${
                          formData.role === role.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{role.label}</span>
                          {formData.role === role.value && (
                            <Badge variant="default" className="text-xs">Selected</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting up profile...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ProfileSetupContent />
    </Suspense>
  )
}
