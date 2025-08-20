// Teacher class and subject types
export interface TeacherClass {
  id: string
  name: string
  grade_level: number
}

export interface TeacherSubject {
  id: string
  name_vietnamese: string
  code: string
  regular_grade_count: number
}

// Database response types
export interface TeacherClassAssignment {
  class: TeacherClass
}

export interface TeacherSubjectAssignment {
  subject: {
    id: string
    name_vietnamese: string
    code: string
  }
}

// Vietnamese education grade count standards
export const VIETNAMESE_GRADE_STANDARDS: Record<string, number> = {
  'Ngữ văn': 4,
  'Toán': 4,
  'Ngoại ngữ 1': 4,
  'Lịch sử': 3,
  'Giáo dục thể chất': 2,
  'Giáo dục quốc phòng và an ninh': 2,
  'Địa lí': 3,
  'Giáo dục kinh tế và pháp luật': 3,
  'Vật lí': 3,
  'Hóa học': 3,
  'Sinh học': 3,
  'Công nghệ': 3,
  'Tin học': 3,
  'Âm nhạc': 2,
  'Mĩ thuật': 2,
  'Hoạt động trải nghiệm, hướng nghiệp': 2,
  'Nội dung giáo dục của địa phương': 2,
  'Tiếng dân tộc thiểu số': 4,
  'Ngoại ngữ 2': 4
}
