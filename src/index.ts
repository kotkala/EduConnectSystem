/**
 * EduConnect System - Main Package Export
 *
 * This file serves as the main entry point for the EduConnect System package.
 * It exports key components, utilities, and types that can be used by other projects.
 */

// Core Types
export type { UserRole } from './lib/types'

// Validation Schemas
export {
  violationCategorySchema,
  violationTypeSchema,
  studentViolationSchema,
  disciplinaryCaseSchema
} from './lib/validations/violation-validations'

// Database Utilities
export { createClient as createSupabaseClient } from './lib/supabase/client'
export { createClient as createSupabaseServerClient } from './lib/supabase/server'

// Component Exports (for UI library usage)
export { Button } from './shared/components/ui/button'
export { Input } from './shared/components/ui/input'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './shared/components/ui/card'
export { Badge } from './shared/components/ui/badge'

// Package Information
export const PACKAGE_INFO = {
  name: '@kotkala/educonnect-system',
  version: '0.1.0',
  description: 'EduConnect Educational Management System',
  author: 'kotkala',
  license: 'MIT',
  repository: 'https://github.com/kotkala/EduConnectSystem',
  homepage: 'https://github.com/kotkala/EduConnectSystem',
  bugs: 'https://github.com/kotkala/EduConnectSystem/issues'
} as const

// Default Export
const EduConnectSystem = {
  ...PACKAGE_INFO
}

export default EduConnectSystem