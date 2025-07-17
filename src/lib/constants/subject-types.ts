// Subject types - using existing enum
export const SUBJECT_TYPES = {
  MANDATORY: 'mandatory',
  ELECTIVE: 'elective'
} as const

export type SubjectType = typeof SUBJECT_TYPES[keyof typeof SUBJECT_TYPES]

// Subject categories - stored in metadata
export const SUBJECT_CATEGORIES = {
  LANGUAGE_ARTS: 'language_arts',
  MATHEMATICS: 'mathematics', 
  NATURAL_SCIENCES: 'natural_sciences',
  SOCIAL_SCIENCES: 'social_sciences',
  PHYSICAL_EDUCATION: 'physical_education',
  ARTS: 'arts',
  TECHNOLOGY: 'technology',
  CIVIC_EDUCATION: 'civic_education',
  EXPERIENTIAL_ACTIVITIES: 'experiential_activities'
} as const

export type SubjectCategory = typeof SUBJECT_CATEGORIES[keyof typeof SUBJECT_CATEGORIES]

// Predefined subjects according to Vietnamese high school curriculum
export const PREDEFINED_SUBJECTS = [
  // ============================================
  // MÔN HỌC BẮT BUỘC (MANDATORY SUBJECTS)
  // ============================================
  {
    name: 'Ngữ văn',
    code: 'LIT',
    description: 'Môn học bắt buộc - Ngữ văn Việt Nam',
    credits: 3,
    periods_per_week: 3,
    metadata: {
      category: SUBJECT_CATEGORIES.LANGUAGE_ARTS,
      subject_type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 105,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Toán',
    code: 'MATH',
    description: 'Môn học bắt buộc - Toán học',
    credits: 3,
    periods_per_week: 3,
    metadata: {
      category: SUBJECT_CATEGORIES.MATHEMATICS,
      subject_type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 105,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Tiếng Anh',
    code: 'ENG',
    description: 'Môn học bắt buộc - Ngoại ngữ',
    credits: 3,
    periods_per_week: 3,
    metadata: {
      category: SUBJECT_CATEGORIES.LANGUAGE_ARTS,
      subject_type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 105,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Lịch sử',
    code: 'HIST',
    description: 'Môn học bắt buộc - Lịch sử Việt Nam và thế giới',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.SOCIAL_SCIENCES,
      subject_type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Giáo dục quốc phòng và an ninh',
    code: 'NDSE',
    description: 'Môn học bắt buộc - Giáo dục quốc phòng và an ninh',
    credits: 1,
    periods_per_week: 1,
    metadata: {
      category: SUBJECT_CATEGORIES.CIVIC_EDUCATION,
      subject_type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 35,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Hoạt động trải nghiệm - Hướng nghiệp',
    code: 'EXPR',
    description: 'Môn học bắt buộc - Hoạt động trải nghiệm và hướng nghiệp',
    credits: 3,
    periods_per_week: 3,
    metadata: {
      category: SUBJECT_CATEGORIES.EXPERIENTIAL_ACTIVITIES,
      subject_type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 105,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Giáo dục địa phương',
    code: 'LOCAL',
    description: 'Môn học bắt buộc - Giáo dục địa phương',
    credits: 1,
    periods_per_week: 1,
    metadata: {
      category: SUBJECT_CATEGORIES.CIVIC_EDUCATION,
      subject_type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 35,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Giáo dục thể chất',
    code: 'PE',
    description: 'Môn học bắt buộc - Giáo dục thể chất',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.PHYSICAL_EDUCATION,
      subject_type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },

  // ============================================
  // MÔN HỌC TỰ CHỌN (ELECTIVE SUBJECTS)
  // ============================================
  {
    name: 'Địa lý',
    code: 'GEO',
    description: 'Môn học tự chọn - Địa lý',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.SOCIAL_SCIENCES,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Giáo dục kinh tế và pháp luật',
    code: 'ECON',
    description: 'Môn học tự chọn - Giáo dục kinh tế và pháp luật',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.SOCIAL_SCIENCES,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Vật lý',
    code: 'PHYS',
    description: 'Môn học tự chọn - Vật lý',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.NATURAL_SCIENCES,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Hóa học',
    code: 'CHEM',
    description: 'Môn học tự chọn - Hóa học',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.NATURAL_SCIENCES,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Sinh học',
    code: 'BIO',
    description: 'Môn học tự chọn - Sinh học',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.NATURAL_SCIENCES,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Công nghệ',
    code: 'TECH',
    description: 'Môn học tự chọn - Công nghệ',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.TECHNOLOGY,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Tin học',
    code: 'CS',
    description: 'Môn học tự chọn - Tin học',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.TECHNOLOGY,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Âm nhạc',
    code: 'MUSIC',
    description: 'Môn học tự chọn - Âm nhạc',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.ARTS,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  },
  {
    name: 'Mỹ thuật',
    code: 'ART',
    description: 'Môn học tự chọn - Mỹ thuật',
    credits: 2,
    periods_per_week: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.ARTS,
      subject_type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      curriculum: 'THPT_2018'
    }
  }
] 