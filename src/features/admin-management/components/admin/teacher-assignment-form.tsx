'use client'

import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'

import { Alert, AlertDescription } from '@/shared/components/ui/alert'

import { UserPlus } from "lucide-react";import {
  getAvailableSubjectsForClassAction,
  getAvailableTeachersForSubjectAction,
  assignTeacherToClassSubjectAction,
  type AvailableSubject,
  type AvailableTeacher
} from '@/features/teacher-management/actions/teacher-assignment-actions'
import {
  getAcademicYearsAction
} from '@/features/admin-management/actions/academic-actions'
import {
  getClassBlocksAction
} from '@/lib/actions/class-block-actions'
import {
  getClassesAction
} from '@/features/admin-management/actions/class-actions'
import {
  type AcademicYear
} from '@/lib/validations/academic-validations'
import {
  type ClassBlock
} from '@/lib/validations/class-block-validations'
import {
  type Class
} from '@/lib/validations/class-validations'
import { TeacherAssignmentFormFields } from './teacher-assignment-form-fields'

interface TeacherAssignmentFormProps {
  readonly onSuccess?: () => void
  readonly currentUserId: string
}

interface FormData {
  academicYearId: string
  classBlockId: string
  classId: string
  subjectId: string
  teacherId: string
}

// Helper function to reset dependent fields
function resetDependentFields(
  setValue: (name: keyof FormData, value: string) => void,
  fields: (keyof FormData)[],
  setters: (() => void)[]
) {
  fields.forEach(field => setValue(field, ''))
  setters.forEach(setter => setter())
}

// Helper function to handle API errors
function handleApiError(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

// Helper function to create async loader
function createAsyncLoader<T>(
  setLoading: (loading: boolean) => void,
  setData: (data: T) => void,
  setError: (error: string | null) => void
) {
  return async (apiCall: () => Promise<{ success: boolean; data: T; error?: string }>, errorMessage: string) => {
    setLoading(true)
    try {
      const result = await apiCall()
      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error || errorMessage)
      }
    } catch (error) {
      setError(handleApiError(error, errorMessage))
    } finally {
      setLoading(false)
    }
  }
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

  // Create loaders using helper function
  const loadAcademicYears = createAsyncLoader(
    setLoadingAcademicYears,
    setAcademicYears,
    setError
  )

  const loadClassBlocks = createAsyncLoader(
    setLoadingClassBlocks,
    setClassBlocks,
    setError
  )

  const loadAvailableSubjects = createAsyncLoader(
    setLoadingSubjects,
    setAvailableSubjects,
    setError
  )

  const loadAvailableTeachers = createAsyncLoader(
    setLoadingTeachers,
    setAvailableTeachers,
    setError
  )

  // Load classes function
  const loadClasses = useCallback(async (academicYearId: string, classBlockId: string) => {
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
        setError(null)
      } else {
        setError(result.error || 'Failed to load classes')
      }
    } catch (error) {
      setError(handleApiError(error, 'Failed to load classes'))
    } finally {
      setLoadingClasses(false)
    }
  }, [])

  // Specific loader functions wrapped in useCallback
  const loadAcademicYearsData = useCallback(() => loadAcademicYears(getAcademicYearsAction, 'Failed to load academic years'), [loadAcademicYears])
  const loadClassBlocksData = useCallback(() => loadClassBlocks(getClassBlocksAction, 'Failed to load class blocks'), [loadClassBlocks])
  const loadAvailableSubjectsData = useCallback((classId: string) => loadAvailableSubjects(() => getAvailableSubjectsForClassAction(classId), 'Failed to load available subjects'), [loadAvailableSubjects])
  const loadAvailableTeachersData = useCallback((subjectId: string) => loadAvailableTeachers(() => getAvailableTeachersForSubjectAction(subjectId), 'Failed to load available teachers'), [loadAvailableTeachers])

  // Load academic years on component mount
  useEffect(() => {
    loadAcademicYearsData()
  }, [loadAcademicYearsData])

  // Load class blocks when academic year changes - Context7 dependent pattern
  useEffect(() => {
    if (watchAcademicYearId) {
      loadClassBlocksData()
      resetDependentFields(
        setValue,
        ['classBlockId', 'classId', 'subjectId', 'teacherId'],
        [() => setClasses([]), () => setAvailableSubjects([]), () => setAvailableTeachers([])]
      )
    }
  }, [watchAcademicYearId, setValue, loadClassBlocksData])

  // Load classes when class block changes - Context7 dependent pattern
  useEffect(() => {
    if (watchAcademicYearId && watchClassBlockId) {
      loadClasses(watchAcademicYearId, watchClassBlockId)
      resetDependentFields(
        setValue,
        ['classId', 'subjectId', 'teacherId'],
        [() => setAvailableSubjects([]), () => setAvailableTeachers([])]
      )
    }
  }, [watchAcademicYearId, watchClassBlockId, setValue, loadClasses])

  // Load available subjects when class changes - Context7 dependent pattern
  useEffect(() => {
    if (watchClassId) {
      loadAvailableSubjectsData(watchClassId)
      resetDependentFields(
        setValue,
        ['subjectId', 'teacherId'],
        [() => setAvailableTeachers([])]
      )
    }
  }, [watchClassId, setValue, loadAvailableSubjectsData])

  // Load available teachers when subject changes - Context7 dependent pattern
  useEffect(() => {
    if (watchSubjectId) {
      loadAvailableTeachersData(watchSubjectId)
      setValue('teacherId', '')
    }
  }, [watchSubjectId, setValue, loadAvailableTeachersData])



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

          {/* Form Fields */}
          <TeacherAssignmentFormFields
            academicYears={academicYears}
            classBlocks={classBlocks}
            classes={classes}
            availableSubjects={availableSubjects}
            availableTeachers={availableTeachers}
            loadingAcademicYears={loadingAcademicYears}
            loadingClassBlocks={loadingClassBlocks}
            loadingClasses={loadingClasses}
            loadingSubjects={loadingSubjects}
            loadingTeachers={loadingTeachers}
            watchAcademicYearId={watchAcademicYearId}
            watchClassBlockId={watchClassBlockId}
            watchClassId={watchClassId}
            watchSubjectId={watchSubjectId}
            watch={watch}
            setValue={setValue}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || !watch('teacherId')}
            className="w-full h-10 sm:h-11"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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
