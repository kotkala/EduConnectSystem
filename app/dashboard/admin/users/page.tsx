"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SidebarLayout } from "@/components/dashboard/sidebar-layout"
import { useAuth } from "@/hooks/use-auth"
import { Users, GraduationCap, UserPlus, Heart, ArrowRight, AlertCircle } from "lucide-react"

export default function UsersPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard/admin')
    }
  }, [loading, isAdmin, router])

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="admin" title="User Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    )
  }

  // Show access denied if no permission
  if (!isAdmin) {
    return (
      <SidebarLayout role="admin" title="Access Denied">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access user management.</p>
          <Button onClick={() => router.push('/dashboard/admin')}>
            Return to Dashboard
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  const userTypes = [
    {
      title: "Teachers",
      description: "Manage teacher accounts and information",
      icon: Users,
      count: "Manage all teaching staff",
      href: "/dashboard/admin/users/teachers",
      color: "bg-blue-500",
      features: [
        "Create and edit teacher profiles",
        "Manage employee IDs",
        "Enable/disable homeroom features",
        "View teacher statistics"
      ]
    },
    {
      title: "Students & Parents",
      description: "Manage student accounts with mandatory parent relationships",
      icon: GraduationCap,
      count: "Students must have parent accounts",
      href: "/dashboard/admin/users/students",
      color: "bg-green-500",
      features: [
        "Create student + parent together",
        "Manage student IDs",
        "Parent-student relationships",
        "View family connections"
      ]
    }
  ]

  return (
    <SidebarLayout role="admin" title="User Management">
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage all user accounts in the EduConnect system
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {userTypes.map((userType) => {
          const Icon = userType.icon
          return (
            <Card key={userType.title} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${userType.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{userType.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {userType.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(userType.href)}
                    className="shrink-0"
                  >
                    Manage
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    {userType.count}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {userType.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
            <p>
              <strong>Student-Parent Relationship:</strong> When creating a student account, 
              you must also create a parent account in the same form. Parents cannot be added independently.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
            <p>
              <strong>Homeroom Teachers:</strong> Admin can enable/disable homeroom features 
              for teachers, allowing them to manage students and communicate with parents.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
            <p>
              <strong>User Roles:</strong> The system maintains four basic roles: Admin, Teacher, 
              Student, and Parent. Keep the role system simple and focused.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common user management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => router.push("/dashboard/admin/users/teachers")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Add New Teacher</div>
                  <div className="text-sm text-muted-foreground">Create a teacher account</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => router.push("/dashboard/admin/users/students")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Add Student & Parent</div>
                  <div className="text-sm text-muted-foreground">Create linked accounts</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </SidebarLayout>
  )
}
