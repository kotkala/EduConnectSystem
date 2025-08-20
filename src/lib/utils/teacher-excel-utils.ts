import * as XLSX from 'xlsx'

// Vietnamese Education Standards for Regular Grade Counts (Grades 10-12)
export const VIETNAMESE_EDUCATION_STANDARDS: Record<string, number> = {
  // Core subjects - 4 regular grades
  'Ngữ văn': 4,
  'Toán': 4,
  'Ngoại ngữ 1': 4,
  'Tiếng Anh': 4,
  'Tiếng dân tộc thiểu số': 4,
  'Ngoại ngữ 2': 4,

  // Social sciences - 3 regular grades
  'Lịch sử': 3,
  'Địa lí': 3,
  'Địa lý': 3,
  'Giáo dục kinh tế và pháp luật': 3,

  // Natural sciences - 3 regular grades
  'Vật lí': 3,
  'Vật lý': 3,
  'Hóa học': 3,
  'Sinh học': 3,

  // Technology subjects - 3 regular grades
  'Công nghệ': 3,
  'Tin học': 3,

  // Physical and arts education - 2 regular grades
  'Giáo dục thể chất': 2,
  'Giáo dục quốc phòng và an ninh': 2,
  'Âm nhạc': 2,
  'Mĩ thuật': 2,
  'Mỹ thuật': 2,

  // Experiential activities - 2 regular grades
  'Hoạt động trải nghiệm, hướng nghiệp': 2,
  'Nội dung giáo dục của địa phương': 2
}

// Grade period types
export type GradePeriodType =
  | 'regular_1' | 'regular_2'
  | 'midterm_1' | 'midterm_2'
  | 'final_1' | 'final_2'
  | 'summary_1' | 'summary_2'

export interface StudentInfo {
  id: string
  full_name: string
  student_id: string
}

export interface TeacherExcelTemplateData {
  period_type: GradePeriodType
  period_name: string
  class_name: string
  subject_name: string
  subject_code: string
  academic_year: string
  semester: string
  students: StudentInfo[]
  regular_grade_count?: number // Optional - will be calculated from subject name
}

// Get regular grade count based on Vietnamese education standards
export function getRegularGradeCount(subjectName: string): number {
  // Try exact match first
  if (VIETNAMESE_EDUCATION_STANDARDS[subjectName]) {
    return VIETNAMESE_EDUCATION_STANDARDS[subjectName]
  }

  // Try case-insensitive match
  const normalizedSubjectName = subjectName.trim()
  for (const [standardName, count] of Object.entries(VIETNAMESE_EDUCATION_STANDARDS)) {
    if (standardName.toLowerCase() === normalizedSubjectName.toLowerCase()) {
      return count
    }
  }

  // Try partial match for common variations
  const lowerSubjectName = normalizedSubjectName.toLowerCase()
  if (lowerSubjectName.includes('ngữ văn') || lowerSubjectName.includes('văn')) return 4
  if (lowerSubjectName.includes('toán')) return 4
  if (lowerSubjectName.includes('tiếng anh') || lowerSubjectName.includes('anh')) return 4
  if (lowerSubjectName.includes('lịch sử') || lowerSubjectName.includes('sử')) return 3
  if (lowerSubjectName.includes('địa lí') || lowerSubjectName.includes('địa lý')) return 3
  if (lowerSubjectName.includes('vật lí') || lowerSubjectName.includes('vật lý')) return 3
  if (lowerSubjectName.includes('hóa học') || lowerSubjectName.includes('hóa')) return 3
  if (lowerSubjectName.includes('sinh học') || lowerSubjectName.includes('sinh')) return 3
  if (lowerSubjectName.includes('thể chất') || lowerSubjectName.includes('tdtt')) return 2
  if (lowerSubjectName.includes('âm nhạc') || lowerSubjectName.includes('nhạc')) return 2
  if (lowerSubjectName.includes('mỹ thuật') || lowerSubjectName.includes('mĩ thuật')) return 2

  // Default to 3 for unknown subjects
  console.warn(`Unknown subject "${subjectName}", defaulting to 3 regular grades`)
  return 3
}

// Generate column headers based on period type
function generateColumnHeaders(data: TeacherExcelTemplateData): string[] {
  const baseHeaders = ['STT', 'Mã học sinh', 'Họ và tên']
  const { period_type, subject_name } = data

  // Get regular grade count from Vietnamese education standards
  const regular_grade_count = data.regular_grade_count || getRegularGradeCount(subject_name)

  switch (period_type) {
    case 'regular_1':
    case 'regular_2':
      // Only regular grade columns
      for (let i = 1; i <= regular_grade_count; i++) {
        baseHeaders.push(`Điểm thường xuyên ${i}`)
      }
      break

    case 'midterm_1':
    case 'midterm_2':
      // Regular grades + midterm
      for (let i = 1; i <= regular_grade_count; i++) {
        baseHeaders.push(`Điểm thường xuyên ${i}`)
      }
      baseHeaders.push('Điểm giữa kì')
      break

    case 'final_1':
    case 'final_2':
      // Regular grades + midterm + final
      for (let i = 1; i <= regular_grade_count; i++) {
        baseHeaders.push(`Điểm thường xuyên ${i}`)
      }
      baseHeaders.push('Điểm giữa kì')
      baseHeaders.push('Điểm cuối kì')
      break

    case 'summary_1':
    case 'summary_2':
      // All grade types + summary
      for (let i = 1; i <= regular_grade_count; i++) {
        baseHeaders.push(`Điểm thường xuyên ${i}`)
      }
      baseHeaders.push('Điểm giữa kì')
      baseHeaders.push('Điểm cuối kì')
      baseHeaders.push('Điểm tổng kết học kì')
      break

    default:
      // Default to regular grades only (same as regular case)
      for (let i = 1; i <= regular_grade_count; i++) {
        baseHeaders.push(`Điểm thường xuyên ${i}`)
      }
      break
  }

  baseHeaders.push('Ghi chú')
  return baseHeaders
}

// Generate student rows
function generateStudentRows(data: TeacherExcelTemplateData): (string | number)[][] {
  const headers = generateColumnHeaders(data)
  const rows: (string | number)[][] = []

  data.students.forEach((student, index) => {
    const row: (string | number)[] = [
      index + 1, // STT
      student.student_id, // Mã học sinh
      student.full_name // Họ và tên
    ]

    // Add empty cells for grade columns (excluding STT, Mã học sinh, Họ và tên, Ghi chú)
    const gradeColumnCount = headers.length - 4
    for (let i = 0; i < gradeColumnCount; i++) {
      row.push('') // Empty grade cells
    }

    row.push('') // Ghi chú
    rows.push(row)
  })

  return rows
}

// Create Excel template for teacher grade input
export async function createTeacherGradeTemplate(data: TeacherExcelTemplateData): Promise<ArrayBuffer> {
  try {
    // Validate input data
    if (!data?.students?.length) {
      throw new Error('Dữ liệu học sinh không hợp lệ')
    }

    if (!data.subject_name) {
      throw new Error('Tên môn học không hợp lệ')
    }

    // Validate subject name and get regular grade count
    const regularGradeCount = data.regular_grade_count || getRegularGradeCount(data.subject_name)
    if (regularGradeCount < 1 || regularGradeCount > 10) {
      throw new Error('Số lượng điểm thường xuyên không hợp lệ')
    }

    const workbook = XLSX.utils.book_new()

    // Generate headers and data
    const headers = generateColumnHeaders(data)
    const studentRows = generateStudentRows(data)
    
    // Create worksheet data
    const worksheetData = [
      // Title rows
      [`BẢNG ĐIỂM ${data.subject_name.toUpperCase()}`],
      [`Lớp: ${data.class_name} - ${data.period_name}`],
      [`Năm học: ${data.academic_year} - ${data.semester}`],
      [], // Empty row
      // Headers
      headers,
      // Student data
      ...studentRows
    ]

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // STT
      { wch: 15 }, // Mã học sinh
      { wch: 25 }, // Họ và tên
    ]

    // Add widths for grade columns
    const gradeColumnCount = headers.length - 4 // Exclude STT, Mã học sinh, Họ và tên, Ghi chú
    for (let i = 0; i < gradeColumnCount; i++) {
      columnWidths.push({ wch: 12 }) // Grade columns
    }
    columnWidths.push({ wch: 20 }) // Ghi chú

    worksheet['!cols'] = columnWidths

    // Merge title cells
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Class info
      { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }  // Academic year
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng điểm')

    // Generate Excel file as Uint8Array using Context7 recommended approach
    const uint8Array = XLSX.write(workbook, {
      type: 'buffer',  // Use 'buffer' type for better compatibility
      bookType: 'xlsx',
      compression: true
    })

    // Validate the result
    if (!uint8Array || !(uint8Array instanceof Uint8Array)) {
      throw new Error('Không thể tạo dữ liệu Excel')
    }

    // Convert Uint8Array to ArrayBuffer
    // Create a new ArrayBuffer from the Uint8Array to ensure compatibility
    const arrayBuffer = new ArrayBuffer(uint8Array.length)
    const view = new Uint8Array(arrayBuffer)
    view.set(uint8Array)

    return arrayBuffer
  } catch (error) {
    console.error('Error creating Excel template:', error)
    throw new Error('Không thể tạo template Excel. Vui lòng thử lại.')
  }
}

// Download Excel file
export function downloadExcelFile(buffer: ArrayBuffer, filename: string): void {
  try {
    // Validate inputs
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Buffer rỗng hoặc không hợp lệ')
    }

    if (!filename || filename.trim() === '') {
      throw new Error('Tên file không hợp lệ')
    }

    // Create blob with correct MIME type for XLSX files
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.trim()
    link.style.display = 'none'

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading Excel file:', error)
    throw new Error(`Không thể tải file Excel: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
  }
}

// Get period type display name (unified for both admin and teacher systems)
export function getPeriodTypeDisplayName(periodType: GradePeriodType | string): string {
  const displayNames: Record<string, string> = {
    // Teacher system period types
    'regular_1': 'Điểm thường xuyên HK1',
    'regular_2': 'Điểm thường xuyên HK2',
    'midterm_1': 'Điểm giữa kì 1',
    'midterm_2': 'Điểm giữa kì 2',
    'final_1': 'Điểm cuối kì 1',
    'final_2': 'Điểm cuối kì 2',
    'summary_1': 'Điểm tổng kết HK1',
    'summary_2': 'Điểm tổng kết HK2',

    // Admin system period types (unified mapping)
    'semester_1_summary': 'Điểm tổng kết học kì 1',
    'semester_2_summary': 'Điểm tổng kết học kì 2',
    'yearly_summary': 'Điểm tổng kết cả năm'
  }

  return displayNames[periodType] || periodType
}

// Generate filename for Excel template
export function generateExcelFilename(data: TeacherExcelTemplateData): string {
  const periodName = getPeriodTypeDisplayName(data.period_type)
  const timestamp = new Date().toISOString().slice(0, 10)
  
  return `${periodName}_${data.class_name}_${data.subject_code}_${timestamp}.xlsx`
}
