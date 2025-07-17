// Class types
export const CLASS_TYPES = {
  BASE_CLASS: 'base_class',      // Lớp tách (lớp gốc) - để học môn bắt buộc
  COMBINED_CLASS: 'combined_class' // Lớp ghép (lớp tự chọn) - để học môn tự chọn theo cụm
} as const

export const CLASS_TYPE_LABELS = {
  [CLASS_TYPES.BASE_CLASS]: 'Lớp tách',
  [CLASS_TYPES.COMBINED_CLASS]: 'Lớp ghép'
} as const

export type ClassType = typeof CLASS_TYPES[keyof typeof CLASS_TYPES] 