import * as XLSX from 'xlsx'
import { type GradePeriodType } from '@/lib/validations/enhanced-grade-validations'

// Subject regular grade counts based on Vietnamese education standards
export const SUBJECT_REGULAR_GRADE_COUNTS: Record<string, number> = {
  'VAN': 4,      // Ngữ văn
  'TOAN': 4,     // Toán
  'ANH': 4,      // Tiếng Anh
  'SU': 3,       // Lịch sử
  'DIA': 3,      // Địa lý
  'LY': 3,       // Vật lý
  'HOA': 3,      // Hóa học
  'SINH': 3,     // Sinh học
  'CN': 3,       // Công nghệ
  'TIN': 3,      // Tin học
  'GDKT': 3,     // Giáo dục kinh tế - pháp luật
  'GDTC': 2,     // Giáo dục thể chất
  'GDQP': 2,     // Giáo dục quốc phòng - an ninh
  'NHAC': 2,     // Âm nhạc
  'MT': 2,       // Mỹ thuật
  'HDTN': 2,     // Hoạt động trải nghiệm - hướng nghiệp
  'GDDP': 2      // Giáo dục địa phương
}

// Grade period type to Vietnamese name mapping
export const GRADE_PERIOD_NAMES: Record<GradePeriodType, string> = {
  'midterm_1': 'Điểm giữa kỳ 1',
  'final_1': 'Điểm cuối kỳ 1',
  'semester_1_summary': 'Điểm tổng kết học kỳ 1',
  'midterm_2': 'Điểm giữa kỳ 2',
  'final_2': 'Điểm cuối kỳ 2',
  'semester_2_summary': 'Điểm tổng kết học kỳ 2',
  'yearly_summary': 'Điểm tổng kết cả năm học'
}

// Interface for student grade data
export interface StudentGradeRow {
  student_id: string
  student_code: string
  full_name: string
  regular_grades: (number | null)[]
  midterm_grade?: number | null
  final_grade?: number | null
  semester_grade?: number | null
  yearly_grade?: number | null
}

// Interface for Excel template generation
export interface ExcelTemplateConfig {
  period_type: GradePeriodType
  subject_code: string
  subject_name: string
  class_name: string
  students: Array<{
    student_id: string
    student_code: string
    full_name: string
  }>
  regular_grade_count: number
}

// Generate Excel template based on period type and subject
export function generateExcelTemplate(config: ExcelTemplateConfig): XLSX.WorkBook {
  const { period_type, subject_name, class_name, students, regular_grade_count } = config

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  const worksheetData: unknown[][] = []

  // Header row 1: Title
  const title = `${GRADE_PERIOD_NAMES[period_type]} - ${subject_name} - Lớp ${class_name}`
  worksheetData.push([title])
  worksheetData.push([]) // Empty row

  // Header row 2: Column headers
  const headers = ['STT', 'Mã học sinh', 'Họ và tên']
  
  // Add regular grade columns based on subject
  for (let i = 1; i <= regular_grade_count; i++) {
    headers.push(`Điểm TX ${i}`)
  }

  // Add specific columns based on period type
  switch (period_type) {
    case 'midterm_1':
    case 'midterm_2':
      headers.push('Điểm giữa kỳ')
      break
    case 'final_1':
    case 'final_2':
      headers.push('Điểm cuối kỳ')
      break
    case 'semester_1_summary':
      headers.push('Điểm giữa kỳ', 'Điểm cuối kỳ', 'Điểm tổng kết HK1')
      break
    case 'semester_2_summary':
      headers.push('Điểm giữa kỳ', 'Điểm cuối kỳ', 'Điểm tổng kết HK2')
      break
    case 'yearly_summary':
      headers.push('Điểm HK1', 'Điểm HK2', 'Điểm tổng kết năm')
      break
  }

  worksheetData.push(headers)

  // Add student rows
  students.forEach((student, index) => {
    const row = [
      index + 1,
      student.student_code,
      student.full_name
    ]
    
    // Add empty cells for regular grades
    for (let i = 0; i < regular_grade_count; i++) {
      row.push('')
    }

    // Add empty cells for specific grade types
    switch (period_type) {
      case 'midterm_1':
      case 'midterm_2':
        row.push('') // Midterm grade
        break
      case 'final_1':
      case 'final_2':
        row.push('') // Final grade
        break
      case 'semester_1_summary':
        row.push('', '', '') // Midterm, Final, Semester
        break
      case 'semester_2_summary':
        row.push('', '', '') // Midterm, Final, Semester
        break
      case 'yearly_summary':
        row.push('', '', '') // Semester 1, Semester 2, Yearly
        break
    }

    worksheetData.push(row)
  })

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths
  const columnWidths = [
    { wch: 5 },   // STT
    { wch: 15 },  // Mã học sinh
    { wch: 25 },  // Họ và tên
  ]
  
  // Add widths for regular grade columns
  for (let i = 0; i < regular_grade_count; i++) {
    columnWidths.push({ wch: 10 })
  }

  // Add widths for specific grade columns
  const additionalColumns = headers.length - 3 - regular_grade_count
  for (let i = 0; i < additionalColumns; i++) {
    columnWidths.push({ wch: 12 })
  }

  worksheet['!cols'] = columnWidths

  // Merge title cell
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Điểm số')

  return workbook
}

// Parse Excel file and extract grade data
export function parseExcelGradeFile(
  file: ArrayBuffer,
  config: {
    period_type: GradePeriodType
    regular_grade_count: number
    expected_students: Array<{
      student_id: string
      student_code: string
      full_name: string
    }>
  }
): { success: boolean; data?: StudentGradeRow[]; error?: string } {
  try {
    const workbook = XLSX.read(file, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    
    if (!worksheet) {
      return { success: false, error: 'Không tìm thấy worksheet trong file Excel' }
    }

    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]
    
    if (data.length < 4) {
      return { success: false, error: 'File Excel không đúng định dạng' }
    }

    // Find header row (should be row 3, index 2)
    const headerRowIndex = 2
    const headers = data[headerRowIndex] as string[]
    
    if (!headers || headers.length < 3) {
      return { success: false, error: 'Không tìm thấy header trong file Excel' }
    }

    // Parse student data rows
    const studentRows: StudentGradeRow[] = []
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length < 3) continue

      const studentCode = String(row[1] || '').trim()
      const fullName = String(row[2] || '').trim()
      
      if (!studentCode || !fullName) continue

      // Find matching student
      const expectedStudent = config.expected_students.find(
        s => s.student_code === studentCode || s.full_name === fullName
      )
      
      if (!expectedStudent) {
        console.warn(`Student not found: ${studentCode} - ${fullName}`)
        continue
      }

      // Parse regular grades
      const regular_grades: (number | null)[] = []
      for (let j = 0; j < config.regular_grade_count; j++) {
        const gradeValue = row[3 + j]
        if (gradeValue !== undefined && gradeValue !== null && gradeValue !== '') {
          const grade = parseFloat(String(gradeValue))
          if (!isNaN(grade) && grade >= 0 && grade <= 10) {
            regular_grades.push(Math.round(grade * 10) / 10) // Round to 1 decimal
          } else {
            regular_grades.push(null)
          }
        } else {
          regular_grades.push(null)
        }
      }

      // Parse specific grades based on period type
      let midterm_grade: number | null = null
      let final_grade: number | null = null
      let semester_grade: number | null = null
      let yearly_grade: number | null = null

      const specificGradeStartIndex = 3 + config.regular_grade_count

      switch (config.period_type) {
        case 'midterm_1':
        case 'midterm_2':
          if (row[specificGradeStartIndex] !== undefined && row[specificGradeStartIndex] !== null && row[specificGradeStartIndex] !== '') {
            const grade = parseFloat(String(row[specificGradeStartIndex]))
            if (!isNaN(grade) && grade >= 0 && grade <= 10) {
              midterm_grade = Math.round(grade * 10) / 10
            }
          }
          break
        case 'final_1':
        case 'final_2':
          if (row[specificGradeStartIndex] !== undefined && row[specificGradeStartIndex] !== null && row[specificGradeStartIndex] !== '') {
            const grade = parseFloat(String(row[specificGradeStartIndex]))
            if (!isNaN(grade) && grade >= 0 && grade <= 10) {
              final_grade = Math.round(grade * 10) / 10
            }
          }
          break
        case 'semester_1_summary':
        case 'semester_2_summary':
          // Midterm grade
          if (row[specificGradeStartIndex] !== undefined && row[specificGradeStartIndex] !== null && row[specificGradeStartIndex] !== '') {
            const grade = parseFloat(String(row[specificGradeStartIndex]))
            if (!isNaN(grade) && grade >= 0 && grade <= 10) {
              midterm_grade = Math.round(grade * 10) / 10
            }
          }
          // Final grade
          if (row[specificGradeStartIndex + 1] !== undefined && row[specificGradeStartIndex + 1] !== null && row[specificGradeStartIndex + 1] !== '') {
            const grade = parseFloat(String(row[specificGradeStartIndex + 1]))
            if (!isNaN(grade) && grade >= 0 && grade <= 10) {
              final_grade = Math.round(grade * 10) / 10
            }
          }
          // Semester grade
          if (row[specificGradeStartIndex + 2] !== undefined && row[specificGradeStartIndex + 2] !== null && row[specificGradeStartIndex + 2] !== '') {
            const grade = parseFloat(String(row[specificGradeStartIndex + 2]))
            if (!isNaN(grade) && grade >= 0 && grade <= 10) {
              semester_grade = Math.round(grade * 10) / 10
            }
          }
          break
        case 'yearly_summary':
          // Semester 1 grade
          if (row[specificGradeStartIndex] !== undefined && row[specificGradeStartIndex] !== null && row[specificGradeStartIndex] !== '') {
            const grade = parseFloat(String(row[specificGradeStartIndex]))
            if (!isNaN(grade) && grade >= 0 && grade <= 10) {
              // This would be semester 1 grade, but we'll store it as semester_grade for now
            }
          }
          // Semester 2 grade
          if (row[specificGradeStartIndex + 1] !== undefined && row[specificGradeStartIndex + 1] !== null && row[specificGradeStartIndex + 1] !== '') {
            const grade = parseFloat(String(row[specificGradeStartIndex + 1]))
            if (!isNaN(grade) && grade >= 0 && grade <= 10) {
              semester_grade = Math.round(grade * 10) / 10
            }
          }
          // Yearly grade
          if (row[specificGradeStartIndex + 2] !== undefined && row[specificGradeStartIndex + 2] !== null && row[specificGradeStartIndex + 2] !== '') {
            const grade = parseFloat(String(row[specificGradeStartIndex + 2]))
            if (!isNaN(grade) && grade >= 0 && grade <= 10) {
              yearly_grade = Math.round(grade * 10) / 10
            }
          }
          break
      }

      studentRows.push({
        student_id: expectedStudent.student_id,
        student_code: expectedStudent.student_code,
        full_name: expectedStudent.full_name,
        regular_grades,
        midterm_grade,
        final_grade,
        semester_grade,
        yearly_grade
      })
    }

    return { success: true, data: studentRows }
  } catch (error) {
    console.error('Error parsing Excel file:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Lỗi không xác định khi đọc file Excel' 
    }
  }
}

// Export Excel file as buffer
export function exportExcelAsBuffer(workbook: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}
