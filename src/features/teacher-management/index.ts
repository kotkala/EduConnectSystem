// Teacher Management Feature
// Export all teacher management-related components and actions

// Components
export * from './components/teacher/teacher-grade-import-dialog'
export * from './components/teacher/grade-override-reason-dialog'
export * from './components/schedule-exchange/exchange-request-form'
export * from './components/schedule-exchange/exchange-requests-list'

// Actions
export * from './actions/schedule-exchange-actions'
export * from './actions/teacher-assignment-actions'
export * from './actions/teacher-feedback-actions'
export * from './actions/teacher-grade-submission-actions'
export * from './actions/teacher-schedule-actions'

// Teacher Grade Import Actions (with renamed export to avoid conflict)
export {
  importValidatedGradesAction,
  getGradeOverviewAction,
  getClassStudentsAction as getClassStudentsForGradeImportAction
} from './actions/teacher-grade-import-actions'

// Hooks (when created)
// export * from './hooks/use-teacher-management'

// Types
export * from './types/teacher-grade-types'

// Utils (when created)
// export * from './utils'

// Constants (when created)
// export * from './constants'
