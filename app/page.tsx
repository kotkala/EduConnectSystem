'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, Heart, Shield, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { AuthModal } from '@/components/auth/auth-modal'
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button'
import type { AuthUser, UserProfile } from '@/lib/types'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const features = [
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Google OAuth and Email OTP with role-based access control'
    },
    {
      icon: Users,
      title: 'Multi-Role Support',
      description: 'Admin, Teacher, Student, and Parent roles with appropriate permissions'
    },
    {
      icon: Zap,
      title: 'Built with Modern Tech',
      description: 'Next.js 15, Supabase, Shadcn UI, and Framer Motion'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const roles = [
    { icon: Users, name: 'Admin', color: 'bg-red-500', description: 'Full system access' },
    { icon: GraduationCap, name: 'Teacher', color: 'bg-blue-500', description: 'Create and manage courses' },
    { icon: BookOpen, name: 'Student', color: 'bg-green-500', description: 'Access learning materials' },
    { icon: Heart, name: 'Parent', color: 'bg-purple-500', description: 'Monitor child progress' }
  ]

  // Conditional rendering based on auth state
  if (user && profile) {
    return <AuthenticatedLandingPage user={user} profile={profile} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">EduConnect</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              onClick={() => setAuthModalOpen(true)}
              variant="ghost"
              className="min-h-[44px] px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Sign In
            </Button>
            <GoogleOAuthButton className="min-h-[44px] text-sm sm:text-base" />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto space-y-6 sm:space-y-8"
        >
          {/* Logo */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>

          {/* Heading */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EduConnect
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              A comprehensive educational platform with secure authentication and role-based access for students, teachers, parents, and administrators.
            </p>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3 sm:space-y-4">
            <Button
              onClick={() => setAuthModalOpen(true)}
              className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg font-medium bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Sign In with Email
            </Button>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <GoogleOAuthButton
              className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg font-medium"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12 max-w-sm sm:max-w-md md:max-w-lg mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">Powerful Features</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Built with modern technologies and security best practices
          </p>
        </div>
        <div className="space-y-4 sm:space-y-6 max-w-sm sm:max-w-md md:max-w-lg mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Role-Based Access</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Different interfaces and permissions for each user type
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="text-center p-3 sm:p-4 md:p-6">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${role.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <role.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <CardTitle className="text-sm sm:text-base">{role.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs sm:text-sm">{role.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded flex items-center justify-center">
                <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
              <span className="text-sm sm:text-base font-semibold">EduConnect</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right">
              Built with Next.js, Supabase, and Shadcn UI
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </div>
  )
}

// Authenticated user landing page
interface AuthenticatedLandingPageProps {
  user: AuthUser
  profile: UserProfile
}

function AuthenticatedLandingPage({ user, profile }: AuthenticatedLandingPageProps) {
  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'admin': return '/dashboard/admin'
      case 'teacher': return '/dashboard/teacher'
      case 'student': return '/dashboard/student'
      case 'parent': return '/dashboard/parent'
      default: return '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <nav className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">EduConnect</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Welcome back, {profile?.full_name || user.email}
            </span>
            <Button className="min-h-[44px] px-4 py-2 text-sm sm:text-base" asChild>
              <Link href={getDashboardPath(profile?.role)}>
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Welcome Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
            Welcome back to{' '}
            <span className="text-primary">EduConnect</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8">
            You&apos;re signed in as a <span className="font-semibold capitalize">{profile?.role}</span>.
            Access your personalized dashboard to continue your educational journey.
          </p>
          <div className="flex justify-center">
            <Button className="h-11 sm:h-12 md:h-14 px-6 sm:px-8 text-sm sm:text-base md:text-lg" asChild>
              <Link href={getDashboardPath(profile?.role)}>
                Open Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
