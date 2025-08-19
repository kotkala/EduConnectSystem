import { redirect } from 'next/navigation'
import { createClient } from '@/shared/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { Subject } from '@/lib/types'
import { SubjectCreateDialog } from '@/shared/components/subjects/subject-create-dialog'
import { SubjectEditDialog } from '@/shared/components/subjects/subject-edit-dialog'
import { SubjectDeleteDialog } from '@/shared/components/subjects/subject-delete-dialog'

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
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quản lý môn học</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Quản lý môn học và chương trình THPT
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
              <CardTitle className="text-sm font-medium">Tổng số môn học</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Chương trình THPT
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Môn học cơ bản</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coreSubjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Môn cốt lõi bắt buộc
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Môn học chuyên đề</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{specializedSubjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Môn chuyên sâu theo định hướng
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Môn học cơ bản ({coreSubjects.length})
            </CardTitle>
            <CardDescription>
              Môn bắt buộc dành cho tất cả học sinh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {coreSubjects.map((subject: Subject) => (
                <div key={subject.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-xs">Cơ bản</Badge>
                    <div className="flex gap-1">
                      <SubjectEditDialog subject={subject} />
                      <SubjectDeleteDialog subject={subject} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold">{subject.name_vietnamese}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{subject.name_english}</p>
                    <p className="text-xs text-muted-foreground mt-1">Mã: {subject.code}</p>
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
              Môn học chuyên đề ({specializedSubjects.length})
            </CardTitle>
            <CardDescription>
              Môn chuyên sâu phục vụ phát triển kỹ năng và định hướng nghề nghiệp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {specializedSubjects.map((subject: Subject) => (
                <div key={subject.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">Chuyên đề</Badge>
                    <div className="flex gap-1">
                      <SubjectEditDialog subject={subject} />
                      <SubjectDeleteDialog subject={subject} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold">{subject.name_vietnamese}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{subject.name_english}</p>
                    <p className="text-xs text-muted-foreground mt-1">Mã: {subject.code}</p>
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
