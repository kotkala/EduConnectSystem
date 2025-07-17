// Predefined categories for violation rules
export const VIOLATION_CATEGORIES = {
  ATTENDANCE_CHECK: '15 phút truy bài đầu giờ',
  CIVILIZED_LIFESTYLE: 'Nếp sống văn minh', 
  ROLL_CALL: 'Kiểm tra sĩ số',
  DOCUMENTS_RECORDS: 'Văn bản sổ sách',
  ENVIRONMENTAL_HYGIENE: 'Vệ sinh môi trường',
  DORMITORY: 'Ký túc xá'
} as const

export type ViolationCategory = typeof VIOLATION_CATEGORIES[keyof typeof VIOLATION_CATEGORIES]

// Severity levels matching database enum
export const VIOLATION_SEVERITIES = {
  minor: 'minor',
  moderate: 'moderate', 
  major: 'major',
  critical: 'critical'
} as const

export type ViolationSeverity = typeof VIOLATION_SEVERITIES[keyof typeof VIOLATION_SEVERITIES] 