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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">EduConnect</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setAuthModalOpen(true)} variant="outline">
              Sign In with Email
            </Button>
            <GoogleOAuthButton />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to{' '}
            <span className="text-primary">EduConnect</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A comprehensive educational platform with secure authentication and role-based access
            for students, teachers, parents, and administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setAuthModalOpen(true)}>
              Sign In with Email
            </Button>
            <GoogleOAuthButton size="lg" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground">
            Built with modern technologies and security best practices
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <feature.icon className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Role-Based Access</h2>
          <p className="text-muted-foreground">
            Different interfaces and permissions for each user type
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="text-center">
                <CardHeader>
                  <div className={`w-12 h-12 ${role.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <role.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{role.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{role.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold">EduConnect</span>
            </div>
            <p className="text-sm text-muted-foreground">
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
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">EduConnect</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome back, {profile?.full_name || user.email}
            </span>
            <Button asChild>
              <Link href={getDashboardPath(profile?.role)}>
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Welcome Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome back to{' '}
            <span className="text-primary">EduConnect</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            You&apos;re signed in as a <span className="font-semibold capitalize">{profile?.role}</span>.
            Access your personalized dashboard to continue your educational journey.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
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
