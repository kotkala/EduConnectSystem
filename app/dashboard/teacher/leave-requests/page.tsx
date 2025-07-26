'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { useAuth } from '@/hooks/use-auth'
import { 
  getTeacherLeaveApplicationsAction,
  updateLeaveApplicationStatusAction,
  type LeaveApplication 
} from '@/lib/actions/leave-application-actions'
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  Calendar, 
  User, 
  FileText, 
  AlertCircle,
  Download
} from 'lucide-react'

export default function TeacherLeaveRequestsPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      fetchLeaveApplications()
    }
  }, [user, profile])

  const fetchLeaveApplications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await getTeacherLeaveApplicationsAction()
      
      if (result.success && result.data) {
        setApplications(result.data)
      } else {
        setError(result.error || 'Failed to fetch leave applications')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(applicationId)
      setError(null)

      const result = await updateLeaveApplicationStatusAction({
        applicationId,
        status,
        teacherResponse: responseText[applicationId] || ''
      })

      if (result.success) {
        // Refresh the list
        await fetchLeaveApplications()
        // Clear the response text for this application
        setResponseText(prev => {
          const newState = { ...prev }
          delete newState[applicationId]
          return newState
        })
      } else {
        setError(result.error || 'Failed to update leave application')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><Check className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><X className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysDifference = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Show loading state
  if (loading || isLoading) {
    return (
      <SidebarLayout role="teacher" title="Leave Requests">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading leave requests...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  // Show access denied if no permission
  if (!user || profile?.role !== 'teacher') {
    return (
      <SidebarLayout role="teacher" title="Access Denied">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          <Button onClick={() => router.push('/dashboard/teacher')}>
            Return to Dashboard
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout role="teacher" title="Leave Requests">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/teacher')}
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leave Requests</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Review and manage leave applications from your homeroom students
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status !== 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
                <p className="text-gray-600 text-center">
                  There are no leave applications from your homeroom students yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {application.student?.full_name} ({application.student?.student_id})
                        </span>
                        {getStatusBadge(application.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(application.start_date)} - {formatDate(application.end_date)}
                        </div>
                        <span>({getDaysDifference(application.start_date, application.end_date)} days)</span>
                        <Badge variant="secondary">{application.leave_type}</Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Applied: {formatDate(application.created_at)}</div>
                      {application.responded_at && (
                        <div>Responded: {formatDate(application.responded_at)}</div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Reason</Label>
                    <p className="text-sm text-muted-foreground mt-1">{application.reason}</p>
                  </div>

                  {application.attachment_url && (
                    <div>
                      <Label className="text-sm font-medium">Attachment</Label>
                      <div className="mt-1">
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.attachment_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" />
                            View Attachment
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.teacher_response && (
                    <div>
                      <Label className="text-sm font-medium">Teacher Response</Label>
                      <p className="text-sm text-muted-foreground mt-1">{application.teacher_response}</p>
                    </div>
                  )}

                  {application.status === 'pending' && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label htmlFor={`response-${application.id}`} className="text-sm font-medium">
                          Response (Optional)
                        </Label>
                        <Textarea
                          id={`response-${application.id}`}
                          placeholder="Add a response message..."
                          value={responseText[application.id] || ''}
                          onChange={(e) => setResponseText(prev => ({
                            ...prev,
                            [application.id]: e.target.value
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStatusUpdate(application.id, 'approved')}
                          disabled={processingId === application.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          disabled={processingId === application.id}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}
