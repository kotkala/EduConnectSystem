'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus } from 'lucide-react'
import { 
  getAvailableSubjectsForClassAction,
  getAvailableTeachersForSubjectAction,
  assignTeacherToClassSubjectAction,
  type AvailableSubject,
  type AvailableTeacher
} from '@/lib/actions/teacher-assignment-actions'
import {
  getAcademicYearsAction
} from '@/lib/actions/academic-actions'
import {
  getClassBlocksAction
} from '@/lib/actions/class-block-actions'
import {
  getClassesAction
} from '@/lib/actions/class-actions'
import {
  type AcademicYear
} from '@/lib/validations/academic-validations'
import {
  type ClassBlock
} from '@/lib/validations/class-block-validations'
import {
  type Class
} from '@/lib/validations/class-validations'

interface TeacherAssignmentFormProps {
  onSuccess?: () => void
  currentUserId: string
}

interface FormData {
  academicYearId: string
  classBlockId: string
  classId: string
  subjectId: string
  teacherId: string
}

export default function TeacherAssignmentForm({ onSuccess, currentUserId }: TeacherAssignmentFormProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([])
  const [availableTeachers, setAvailableTeachers] = useState<AvailableTeacher[]>([])
  
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(true)
  const [loadingClassBlocks, setLoadingClassBlocks] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      academicYearId: '',
      classBlockId: '',
      classId: '',
      subjectId: '',
      teacherId: ''
    }
  })

  // Watch form fields for dependent dropdowns - Context7 pattern
  const [watchAcademicYearId, watchClassBlockId, watchClassId, watchSubjectId] = watch([
    'academicYearId', 
    'classBlockId', 
    'classId', 
    'subjectId'
  ])

  // Load academic years on component mount
  useEffect(() => {
    loadAcademicYears()
  }, [])

  // Load class blocks when academic year changes - Context7 dependent pattern
  useEffect(() => {
    if (watchAcademicYearId) {
      loadClassBlocks()
      // Reset dependent fields
      setValue('classBlockId', '')
      setValue('classId', '')
      setValue('subjectId', '')
      setValue('teacherId', '')
      setClasses([])
      setAvailableSubjects([])
      setAvailableTeachers([])
    }
  }, [watchAcademicYearId, setValue])

  // Load classes when class block changes - Context7 dependent pattern
  useEffect(() => {
    if (watchAcademicYearId && watchClassBlockId) {
      loadClasses(watchAcademicYearId, watchClassBlockId)
      // Reset dependent fields
      setValue('classId', '')
      setValue('subjectId', '')
      setValue('teacherId', '')
      setAvailableSubjects([])
      setAvailableTeachers([])
    }
  }, [watchAcademicYearId, watchClassBlockId, setValue])

  // Load available subjects when class changes - Context7 dependent pattern
  useEffect(() => {
    if (watchClassId) {
      loadAvailableSubjects(watchClassId)
      // Reset dependent fields
      setValue('subjectId', '')
      setValue('teacherId', '')
      setAvailableTeachers([])
    }
  }, [watchClassId, setValue])

  // Load available teachers when subject changes - Context7 dependent pattern
  useEffect(() => {
    if (watchSubjectId) {
      loadAvailableTeachers(watchSubjectId)
      // Reset dependent field
      setValue('teacherId', '')
    }
  }, [watchSubjectId, setValue])

  const loadAcademicYears = async () => {
    try {
      const result = await getAcademicYearsAction()
      if (result.success) {
        setAcademicYears(result.data)
      } else {
        setError(result.error || 'Failed to load academic years')
      }
    } catch {
      setError('Failed to load academic years')
    } finally {
      setLoadingAcademicYears(false)
    }
  }

  const loadClassBlocks = async () => {
    setLoadingClassBlocks(true)
    try {
      const result = await getClassBlocksAction()
      if (result.success) {
        setClassBlocks(result.data)
      } else {
        setError(result.error || 'Failed to load class blocks')
      }
    } catch {
      setError('Failed to load class blocks')
    } finally {
      setLoadingClassBlocks(false)
    }
  }

  const loadClasses = async (academicYearId: string, classBlockId: string) => {
    setLoadingClasses(true)
    try {
      const result = await getClassesAction({
        academic_year_id: academicYearId,
        page: 1,
        limit: 100 // Get all classes for the academic year
      })
      if (result.success) {
        // Filter classes by class block
        const filteredClasses = result.data.filter(cls => cls.class_block_id === classBlockId)
        setClasses(filteredClasses)
      } else {
        setError(result.error || 'Failed to load classes')
      }
    } catch {
      setError('Failed to load classes')
    } finally {
      setLoadingClasses(false)
    }
  }

  const loadAvailableSubjects = async (classId: string) => {
    setLoadingSubjects(true)
    try {
      const result = await getAvailableSubjectsForClassAction(classId)
      if (result.success) {
        setAvailableSubjects(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to load available subjects')
      }
    } catch {
      setError('Failed to load available subjects')
    } finally {
      setLoadingSubjects(false)
    }
  }

  const loadAvailableTeachers = async (subjectId: string) => {
    setLoadingTeachers(true)
    try {
      const result = await getAvailableTeachersForSubjectAction(subjectId)
      if (result.success) {
        setAvailableTeachers(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to load available teachers')
      }
    } catch {
      setError('Failed to load available teachers')
    } finally {
      setLoadingTeachers(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await assignTeacherToClassSubjectAction(
        data.teacherId,
        data.classId,
        data.subjectId,
        currentUserId
      )

      if (result.success) {
        setSuccess('Teacher assigned successfully!')
        reset()
        setClassBlocks([])
        setClasses([])
        setAvailableSubjects([])
        setAvailableTeachers([])
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to assign teacher')
      }
    } catch {
      setError('Failed to assign teacher')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
          Assign Teacher to Class Subject
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Select academic year, class block, class, subject, and teacher to create a teaching assignment.
          Each subject can only be assigned to one teacher per class.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          {/* Academic Year Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Academic Year *</label>
            <Select
              value={watchAcademicYearId}
              onValueChange={(value) => setValue('academicYearId', value)}
              disabled={loadingAcademicYears}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingAcademicYears ? "Loading..." : "Select academic year"} />
              </SelectTrigger>
              <SelectContent>
                {academicYears.filter(year => year.id && year.id.trim() !== '').map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Block Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Class Block (Grade Level) *</label>
            <Select
              value={watchClassBlockId}
              onValueChange={(value) => setValue('classBlockId', value)}
              disabled={!watchAcademicYearId || loadingClassBlocks}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !watchAcademicYearId 
                    ? "Select academic year first" 
                    : loadingClassBlocks 
                    ? "Loading..." 
                    : "Select class block"
                } />
              </SelectTrigger>
              <SelectContent>
                {classBlocks.filter(block => block.id && block.id.trim() !== '').map((block) => (
                  <SelectItem key={block.id} value={block.id}>
                    {block.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Class *</label>
            <Select
              value={watchClassId}
              onValueChange={(value) => setValue('classId', value)}
              disabled={!watchClassBlockId || loadingClasses}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !watchClassBlockId 
                    ? "Select class block first" 
                    : loadingClasses 
                    ? "Loading..." 
                    : "Select class"
                } />
              </SelectTrigger>
              <SelectContent>
                {classes.filter(cls => cls.id && cls.id.trim() !== '').map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject *</label>
            <Select
              value={watchSubjectId}
              onValueChange={(value) => setValue('subjectId', value)}
              disabled={!watchClassId || loadingSubjects}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !watchClassId 
                    ? "Select class first" 
                    : loadingSubjects 
                    ? "Loading..." 
                    : availableSubjects.length === 0
                    ? "No available subjects"
                    : "Select subject"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.filter(subject => subject.id && subject.id.trim() !== '').map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name_vietnamese}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {watchClassId && availableSubjects.length === 0 && !loadingSubjects && (
              <p className="text-sm text-muted-foreground">
                All subjects have been assigned to teachers for this class.
              </p>
            )}
          </div>

          {/* Teacher Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Teacher *</label>
            <Select
              value={watchSubjectId ? watch('teacherId') : ''}
              onValueChange={(value) => setValue('teacherId', value)}
              disabled={!watchSubjectId || loadingTeachers}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !watchSubjectId 
                    ? "Select subject first" 
                    : loadingTeachers 
                    ? "Loading..." 
                    : availableTeachers.length === 0
                    ? "No available teachers"
                    : "Select teacher"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.filter(teacher => teacher.teacher_id && teacher.teacher_id.trim() !== '').map((teacher) => (
                  <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                    {teacher.teacher_name} ({teacher.teacher_email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || !watch('teacherId')}
            className="w-full h-10 sm:h-11"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm sm:text-base">Assigning Teacher...</span>
              </>
            ) : (
              <span className="text-sm sm:text-base">Assign Teacher</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
