// Subject group types
export const SUBJECT_GROUP_TYPES = {
  NATURAL_SCIENCES: 'natural_sciences',
  SOCIAL_SCIENCES: 'social_sciences'
} as const

export type SubjectGroupType = typeof SUBJECT_GROUP_TYPES[keyof typeof SUBJECT_GROUP_TYPES]

// Predefined subject groups according to Vietnamese high school curriculum
export const PREDEFINED_SUBJECT_GROUPS = [
  // ============================================
  // NHÓM KHOA HỌC TỰ NHIÊN (NATURAL SCIENCES)
  // ============================================
  {
    name: 'Khoa học tự nhiên 1',
    code: 'KHTN1',
    type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
    description: 'Tổ hợp Lý - Hóa - Sinh - Tin + Chuyên đề Toán-Lý-Hóa',
    subject_codes: ['PHYS', 'CHEM', 'BIO', 'CS'], // Lý, Hóa, Sinh, Tin
    specialization_subjects: ['MATH', 'PHYS', 'CHEM'], // Chuyên đề Toán-Lý-Hóa
    max_students: 35,
    metadata: {
      name_en: 'Natural Sciences 1',
      group_type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
      is_active: true
    }
  },
  {
    name: 'Khoa học tự nhiên 2',
    code: 'KHTN2',
    type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
    description: 'Tổ hợp Lý - Hóa - Tin + Chuyên đề Toán-Lý-Hóa',
    subject_codes: ['PHYS', 'CHEM', 'CS'], // Lý, Hóa, Tin
    specialization_subjects: ['MATH', 'PHYS', 'CHEM'], // Chuyên đề Toán-Lý-Hóa
    max_students: 35,
    metadata: {
      name_en: 'Natural Sciences 2',
      group_type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
      is_active: true
    }
  },
  {
    name: 'Khoa học tự nhiên 3',
    code: 'KHTN3',
    type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
    description: 'Tổ hợp Lý - Sinh - Tin + Chuyên đề Toán-Lý-Sinh',
    subject_codes: ['PHYS', 'BIO', 'CS'], // Lý, Sinh, Tin
    specialization_subjects: ['MATH', 'PHYS', 'BIO'], // Chuyên đề Toán-Lý-Sinh
    max_students: 35,
    metadata: {
      name_en: 'Natural Sciences 3',
      group_type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
      is_active: true
    }
  },
  {
    name: 'Khoa học tự nhiên 4',
    code: 'KHTN4',
    type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
    description: 'Tổ hợp Hóa - Sinh - Tin + Chuyên đề Toán-Hóa-Sinh',
    subject_codes: ['CHEM', 'BIO', 'CS'], // Hóa, Sinh, Tin
    specialization_subjects: ['MATH', 'CHEM', 'BIO'], // Chuyên đề Toán-Hóa-Sinh
    max_students: 35,
    metadata: {
      name_en: 'Natural Sciences 4',
      group_type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
      is_active: true
    }
  },
  {
    name: 'Khoa học tự nhiên 5',
    code: 'KHTN5',
    type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
    description: 'Tổ hợp Lý - Hóa - Sinh + Chuyên đề Toán-Lý-Hóa-Sinh',
    subject_codes: ['PHYS', 'CHEM', 'BIO'], // Lý, Hóa, Sinh
    specialization_subjects: ['MATH', 'PHYS', 'CHEM', 'BIO'], // Chuyên đề Toán-Lý-Hóa-Sinh
    max_students: 35,
    metadata: {
      name_en: 'Natural Sciences 5',
      group_type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
      is_active: true
    }
  },

  // ============================================
  // NHÓM KHOA HỌC XÃ HỘI (SOCIAL SCIENCES)
  // ============================================
  {
    name: 'Khoa học xã hội 1',
    code: 'KHXH1',
    type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
    description: 'Tổ hợp Văn - Sử - Địa + Chuyên đề Văn-Sử-Địa',
    subject_codes: ['LIT', 'HIST', 'GEO'], // Văn, Sử, Địa
    specialization_subjects: ['LIT', 'HIST', 'GEO'], // Chuyên đề Văn-Sử-Địa
    max_students: 35,
    metadata: {
      name_en: 'Social Sciences 1',
      group_type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
      is_active: true
    }
  },
  {
    name: 'Khoa học xã hội 2',
    code: 'KHXH2',
    type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
    description: 'Tổ hợp Văn - Sử - GDKT + Chuyên đề Văn-Sử-GDKT',
    subject_codes: ['LIT', 'HIST', 'ECON'], // Văn, Sử, GDKT
    specialization_subjects: ['LIT', 'HIST', 'ECON'], // Chuyên đề Văn-Sử-GDKT
    max_students: 35,
    metadata: {
      name_en: 'Social Sciences 2',
      group_type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
      is_active: true
    }
  },
  {
    name: 'Khoa học xã hội 3',
    code: 'KHXH3',
    type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
    description: 'Tổ hợp Văn - Địa - GDKT + Chuyên đề Văn-Địa-GDKT',
    subject_codes: ['LIT', 'GEO', 'ECON'], // Văn, Địa, GDKT
    specialization_subjects: ['LIT', 'GEO', 'ECON'], // Chuyên đề Văn-Địa-GDKT
    max_students: 35,
    metadata: {
      name_en: 'Social Sciences 3',
      group_type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
      is_active: true
    }
  },
  {
    name: 'Khoa học xã hội 4',
    code: 'KHXH4',
    type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
    description: 'Tổ hợp Sử - Địa - GDKT + Chuyên đề Sử-Địa-GDKT',
    subject_codes: ['HIST', 'GEO', 'ECON'], // Sử, Địa, GDKT
    specialization_subjects: ['HIST', 'GEO', 'ECON'], // Chuyên đề Sử-Địa-GDKT
    max_students: 35,
    metadata: {
      name_en: 'Social Sciences 4',
      group_type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
      is_active: true
    }
  },

  // ============================================
  // NHÓM TÍCH HỢP (INTEGRATED GROUPS)
  // ============================================
  {
    name: 'Tích hợp 1',
    code: 'TH1',
    type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
    description: 'Tổ hợp Toán - Lý - Tin + Chuyên đề Toán-Lý-Tin',
    subject_codes: ['MATH', 'PHYS', 'CS'], // Toán, Lý, Tin
    specialization_subjects: ['MATH', 'PHYS', 'CS'], // Chuyên đề Toán-Lý-Tin
    max_students: 35,
    metadata: {
      name_en: 'Integrated 1',
      group_type: SUBJECT_GROUP_TYPES.NATURAL_SCIENCES,
      is_active: true
    }
  },
  {
    name: 'Tích hợp 2',
    code: 'TH2',
    type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
    description: 'Tổ hợp Toán - Văn - Anh + Chuyên đề Toán-Văn-Anh',
    subject_codes: ['MATH', 'LIT', 'ENG'], // Toán, Văn, Anh
    specialization_subjects: ['MATH', 'LIT', 'ENG'], // Chuyên đề Toán-Văn-Anh
    max_students: 35,
    metadata: {
      name_en: 'Integrated 2',
      group_type: SUBJECT_GROUP_TYPES.SOCIAL_SCIENCES,
      is_active: true
    }
  }
] 