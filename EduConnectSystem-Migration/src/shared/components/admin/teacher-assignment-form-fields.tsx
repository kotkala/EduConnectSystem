'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import {
  type AvailableSubject,
  type AvailableTeacher
} from '@/lib/actions/teacher-assignment-actions'
import {
  type AcademicYear
} from '@/lib/validations/academic-validations'
import {
  type ClassBlock
} from '@/lib/validations/class-block-validations'
import {
  type Class
} from '@/lib/validations/class-validations'

interface FormData {
  academicYearId: string
  classBlockId: string
  classId: string
  subjectId: string
  teacherId: string
}

interface TeacherAssignmentFormFieldsProps {
  readonly academicYears: AcademicYear[]
  readonly classBlocks: ClassBlock[]
  readonly classes: Class[]
  readonly availableSubjects: AvailableSubject[]
  readonly availableTeachers: AvailableTeacher[]
  readonly loadingAcademicYears: boolean
  readonly loadingClassBlocks: boolean
  readonly loadingClasses: boolean
  readonly loadingSubjects: boolean
  readonly loadingTeachers: boolean
  readonly watchAcademicYearId: string
  readonly watchClassBlockId: string
  readonly watchClassId: string
  readonly watchSubjectId: string
  readonly watch: (name: keyof FormData) => string
  readonly setValue: (name: keyof FormData, value: string) => void
}

// Helper functions to get academic year placeholder text
function getAcademicYearLoadingPlaceholder(): string {
  return "Loading..."
}

function getAcademicYearDefaultPlaceholder(): string {
  return "Select academic year"
}

// Helper function to get class block placeholder text
function getClassBlockPlaceholder(watchAcademicYearId: string, loadingClassBlocks: boolean): string {
  if (!watchAcademicYearId) return "Select academic year first"
  if (loadingClassBlocks) return "Loading..."
  return "Select class block"
}

// Helper function to get class placeholder text
function getClassPlaceholder(watchClassBlockId: string, loadingClasses: boolean): string {
  if (!watchClassBlockId) return "Select class block first"
  if (loadingClasses) return "Loading..."
  return "Select class"
}

// Helper function to get subject placeholder text
function getSubjectPlaceholder(
  watchClassId: string, 
  loadingSubjects: boolean, 
  availableSubjects: AvailableSubject[]
): string {
  if (!watchClassId) return "Select class first"
  if (loadingSubjects) return "Loading..."
  if (availableSubjects.length === 0) return "No available subjects"
  return "Select subject"
}

// Helper function to get teacher placeholder text
function getTeacherPlaceholder(
  watchSubjectId: string, 
  loadingTeachers: boolean, 
  availableTeachers: AvailableTeacher[]
): string {
  if (!watchSubjectId) return "Select subject first"
  if (loadingTeachers) return "Loading..."
  if (availableTeachers.length === 0) return "No available teachers"
  return "Select teacher"
}

export function TeacherAssignmentFormFields({
  academicYears,
  classBlocks,
  classes,
  availableSubjects,
  availableTeachers,
  loadingAcademicYears,
  loadingClassBlocks,
  loadingClasses,
  loadingSubjects,
  loadingTeachers,
  watchAcademicYearId,
  watchClassBlockId,
  watchClassId,
  watchSubjectId,
  watch,
  setValue
}: TeacherAssignmentFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Academic Year Selection */}
      <div className="space-y-2">
        <label htmlFor="academic-year-select" className="text-sm font-medium">Academic Year *</label>
        <Select
          value={watchAcademicYearId}
          onValueChange={(value) => setValue('academicYearId', value)}
          disabled={loadingAcademicYears}
        >
          <SelectTrigger id="academic-year-select">
            <SelectValue placeholder={loadingAcademicYears ? getAcademicYearLoadingPlaceholder() : getAcademicYearDefaultPlaceholder()} />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Class Block Selection */}
      <div className="space-y-2">
        <label htmlFor="class-block-select" className="text-sm font-medium">Class Block (Grade Level) *</label>
        <Select
          value={watchClassBlockId}
          onValueChange={(value) => setValue('classBlockId', value)}
          disabled={!watchAcademicYearId || loadingClassBlocks}
        >
          <SelectTrigger id="class-block-select">
            <SelectValue placeholder={getClassBlockPlaceholder(watchAcademicYearId, loadingClassBlocks)} />
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
        <label htmlFor="class-select" className="text-sm font-medium">Class *</label>
        <Select
          value={watchClassId}
          onValueChange={(value) => setValue('classId', value)}
          disabled={!watchClassBlockId || loadingClasses}
        >
          <SelectTrigger id="class-select">
            <SelectValue placeholder={getClassPlaceholder(watchClassBlockId, loadingClasses)} />
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
        <label htmlFor="subject-select" className="text-sm font-medium">Subject *</label>
        <Select
          value={watchSubjectId}
          onValueChange={(value) => setValue('subjectId', value)}
          disabled={!watchClassId || loadingSubjects}
        >
          <SelectTrigger id="subject-select">
            <SelectValue placeholder={getSubjectPlaceholder(watchClassId, loadingSubjects, availableSubjects)} />
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
      <div className="space-y-2 md:col-span-2">
        <label htmlFor="teacher-select" className="text-sm font-medium">Teacher *</label>
        <Select
          value={watchSubjectId ? watch('teacherId') : ''}
          onValueChange={(value) => setValue('teacherId', value)}
          disabled={!watchSubjectId || loadingTeachers}
        >
          <SelectTrigger id="teacher-select">
            <SelectValue placeholder={getTeacherPlaceholder(watchSubjectId, loadingTeachers, availableTeachers)} />
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
    </div>
  )
}
