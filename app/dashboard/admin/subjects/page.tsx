import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { Subject } from '@/lib/types'
import { SubjectCreateDialog } from '@/components/subjects/subject-create-dialog'
import { SubjectEditDialog } from '@/components/subjects/subject-edit-dialog'
import { SubjectDeleteDialog } from '@/components/subjects/subject-delete-dialog'

export default async function AdminSubjectsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch subjects with optimized query - get all fields but with limit
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*')
    .order('category', { ascending: true })
    .order('name_vietnamese', { ascending: true })
    .limit(100) // Add reasonable limit for performance

  if (error) {
    console.error('Error fetching subjects:', error)
  }

  const coreSubjects = subjects?.filter(subject => subject.category === 'core') || []
  const specializedSubjects = subjects?.filter(subject => subject.category === 'specialized') || []

  return (
    <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Subject Management</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage Vietnamese high school subjects and curriculum
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <SubjectCreateDialog />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Vietnamese high school curriculum
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Core Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coreSubjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Essential curriculum subjects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Specialized Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{specializedSubjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Specialized curriculum subjects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Core Subjects ({coreSubjects.length})
            </CardTitle>
            <CardDescription>
              Essential subjects required for all students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {coreSubjects.map((subject: Subject) => (
                <div key={subject.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-xs">Core</Badge>
                    <div className="flex gap-1">
                      <SubjectEditDialog subject={subject} />
                      <SubjectDeleteDialog subject={subject} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold">{subject.name_vietnamese}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{subject.name_english}</p>
                    <p className="text-xs text-muted-foreground mt-1">Code: {subject.code}</p>
                  </div>
                  {subject.description && (
                    <p className="text-xs text-muted-foreground">{subject.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specialized Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Specialized Subjects ({specializedSubjects.length})
            </CardTitle>
            <CardDescription>
              Specialized subjects for skill development and career preparation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {specializedSubjects.map((subject: Subject) => (
                <div key={subject.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">Specialized</Badge>
                    <div className="flex gap-1">
                      <SubjectEditDialog subject={subject} />
                      <SubjectDeleteDialog subject={subject} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold">{subject.name_vietnamese}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{subject.name_english}</p>
                    <p className="text-xs text-muted-foreground mt-1">Code: {subject.code}</p>
                  </div>
                  {subject.description && (
                    <p className="text-xs text-muted-foreground">{subject.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
