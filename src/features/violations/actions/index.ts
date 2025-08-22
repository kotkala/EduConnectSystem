/**
 * Violation Actions - Refactored from monolithic violation-actions.ts
 * 
 * Original file: 1540 lines, 31 functions
 * Refactored into: 5 domain-specific files + 2 shared utilities
 * 
 * Benefits:
 * - Better maintainability (average 200-300 lines per file)
 * - Clear separation of concerns
 * - Easier team collaboration
 * - Reduced bundle size through code splitting
 * - Centralized permissions and queries
 */

// Category Management (4 functions)
export {
  createViolationCategoryAction,
  updateViolationCategoryAction,
  getViolationCategoriesAction,
  deactivateViolationCategoryAction
} from './violation-categories-actions'

// Type Management (6 functions)
export {
  createViolationTypeAction,
  updateViolationTypeAction,
  getViolationTypesAction,
  getViolationTypesWithPaginationAction,
  deactivateViolationTypeAction,
  getViolationCategoriesAndTypesAction
} from './violation-types-actions'

// Student Violations (8 functions)
export {
  createStudentViolationAction,
  createBulkStudentViolationsAction,
  updateStudentViolationAction,
  getStudentViolationsAction,
  getHomeroomViolationsAction,
  getParentViolationsAction,
  getClassBlocksAction,
  getClassesByBlockAction,
  getStudentsByClassAction
} from './student-violations-actions'

// Reports & Analytics (6 functions)
export {
  getViolationStatsAction,
  getWeeklyGroupedViolationsAction,
  getMonthlyRankingAction,
  getMonthlyThreePlusListAction,
  getUnseenViolationAlertsCountAction,
  markMonthlyAlertSeenAction
} from './violation-reports-actions'

// Disciplinary Management (9 functions)
export {
  createDisciplinaryCaseAction,
  getDisciplinaryActionTypesAction,
  createDisciplinaryActionTypeAction,
  updateDisciplinaryActionTypeAction,
  deactivateDisciplinaryActionTypeAction,
  getDisciplinaryCasesActionLegacy as getDisciplinaryCasesAction,
  updateDisciplinaryCaseStatusActionLegacy as updateDisciplinaryCaseStatusAction,
  getDisciplinaryCaseByIdAction,
  deleteDisciplinaryCaseAction
} from './disciplinary-actions'

// Shared Utilities
export * from './shared/violation-permissions'
export * from './shared/violation-queries'

/**
 * Migration Guide:
 * 
 * OLD IMPORT:
 * import { createStudentViolationAction } from '@/features/violations/actions/violation-actions'
 * 
 * NEW IMPORT:
 * import { createStudentViolationAction } from '@/features/violations/actions'
 * 
 * OR SPECIFIC:
 * import { createStudentViolationAction } from '@/features/violations/actions/student-violations-actions'
 */
