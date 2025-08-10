// Lazy-load xlsx to reduce initial bundle size
let _XLSX: typeof import('xlsx') | null = null
async function getXLSX() {
  if (!_XLSX) {
    _XLSX = await import('xlsx')
  }
  return _XLSX
}

async function withXLSX<T>(fn: (XLSX: typeof import('xlsx')) => T | Promise<T>): Promise<T> {
  const XLSX = await getXLSX()
  return fn(XLSX)
}

import type * as XLSX from 'xlsx'

export interface StudentInfo {
  id: string
  full_name: string
  student_id: string
  email: string
}

export interface SubjectInfo {
  id: string
  code: string
  name_vietnamese: string
  name_english: string
  category: string
}

export interface IndividualGradeExportData {
  student: StudentInfo
  subjects: SubjectInfo[]
  className: string
  academicYear: string
  semester: string
}

export interface IndividualGradeData {
  subject_id: string
  subject_name: string
  midterm_grade?: number
  final_grade?: number
  notes?: string
}

interface CellStyleConfig {
  font?: { bold?: boolean; size?: number; italic?: boolean; color?: { rgb: string } }
  alignment?: { horizontal?: string; vertical?: string }
  fill?: { fgColor?: { rgb: string } }
  border?: {
    top?: { style: string }
    bottom?: { style: string }
    left?: { style: string }
    right?: { style: string }
  }
}

// Helper function to create standard border style - eliminates duplication
function createStandardBorder() {
  return {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' }
  }
}

// Helper function to get cell address - eliminates duplication
function getCellAddress(XLSX: typeof import('xlsx'), row: number, col: number): string {
  return XLSX.utils.encode_cell({ r: row, c: col })
}

// Helper function to create data row style - eliminates duplication
function createDataRowStyle(isSubjectNameColumn: boolean = false): CellStyleConfig {
  return {
    alignment: {
      horizontal: isSubjectNameColumn ? 'left' : 'center',
      vertical: 'center'
    },
    border: createStandardBorder()
  }
}

// Helper function to create header rows
function createHeaderRows(data: IndividualGradeExportData): (string | number)[][] {
  return [
    [`BẢNG ĐIỂM CÁ NHÂN`, '', '', '', ''],
    [`Học sinh: ${data.student.full_name} (${data.student.student_id})`, '', '', '', ''],
    [`Lớp: ${data.className}`, '', '', '', ''],
    [`Năm học: ${data.academicYear} - ${data.semester}`, '', '', '', ''],
    [], // Empty row
    ['STT', 'Môn học', 'Điểm giữa kì', 'Điểm cuối kì', 'Ghi chú'],
    ['---', '--- NHẬP ĐIỂM TỪ DÒNG NÀY ---', '---', '---', '---']
  ]
}

// Helper function to create subject rows
function createSubjectRows(subjects: SubjectInfo[]): (string | number)[][] {
  return subjects.map((subject, index) => [
    index + 1,
    subject.name_vietnamese,
    '', // Điểm giữa kì - để trống cho admin điền
    '', // Điểm cuối kì - để trống cho admin điền
    ''  // Ghi chú - để trống cho admin điền
  ])
}

// Helper function to set column widths and merges
function configureWorksheetLayout(worksheet: XLSX.WorkSheet): void {
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // STT
    { wch: 30 }, // Môn học
    { wch: 15 }, // Điểm giữa kì
    { wch: 15 }, // Điểm cuối kì
    { wch: 25 }  // Ghi chú
  ]

  // Merge header cells
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Student info
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Class
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }  // Academic year
  ]
}

// Helper function to get cell style based on row type
function getCellStyle(rowIndex: number): CellStyleConfig | null {
  if (rowIndex === 0) {
    return {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'E3F2FD' } }
    }
  } else if (rowIndex >= 1 && rowIndex <= 3) {
    return {
      font: { bold: true },
      alignment: { horizontal: 'left', vertical: 'center' },
      fill: { fgColor: { rgb: 'F5F5F5' } }
    }
  } else if (rowIndex === 5) {
    return {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'BBDEFB' } },
      border: createStandardBorder()
    }
  } else if (rowIndex === 6) {
    return {
      font: { italic: true, color: { rgb: '666666' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'FFFACD' } }
    }
  }
  return null
}

// Helper function to apply worksheet styling
async function applyWorksheetStyling(worksheet: XLSX.WorkSheet): Promise<void> {
  await withXLSX((XLSX) => {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

    // Style header rows (0-6)
    for (let R = 0; R <= 6; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = getCellAddress(XLSX, R, C)
        if (!worksheet[cellAddress]) continue

        const style = getCellStyle(R)
        if (style) {
          worksheet[cellAddress].s = style
        }
      }
    }

    // Style data rows with borders
    for (let R = 7; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = getCellAddress(XLSX, R, C)
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { t: 's', v: '' }
        }

        // Apply data row style with appropriate alignment
        worksheet[cellAddress].s = createDataRowStyle(C === 1)
      }
    }
  })
}

// Helper function to create instructions sheet
async function createInstructionsSheet(): Promise<import('xlsx').WorkSheet> {
  return withXLSX((XLSX) => {
    const instructionsData = [
      ['HƯỚNG DẪN NHẬP ĐIỂM CÁ NHÂN'],
      [''],
      ['1. Điểm số: Nhập số từ 0 đến 10, có thể có 1 chữ số thập phân (ví dụ: 8.5)'],
      ['2. Điểm giữa kì: Điểm kiểm tra giữa học kì'],
      ['3. Điểm cuối kì: Điểm kiểm tra cuối học kì'],
      ['4. Ghi chú: Có thể để trống hoặc nhập thông tin bổ sung'],
      ['5. Không được thay đổi cấu trúc bảng (thêm/xóa cột, hàng tiêu đề)'],
      ['6. Không được thay đổi thông tin học sinh và môn học'],
      ['7. Sau khi nhập xong, lưu file và import lại vào hệ thống'],
      [''],
      ['LƯU Ý:'],
      ['- File này chỉ dùng để nhập điểm, không dùng để in ấn'],
      ['- Hãy kiểm tra kỹ trước khi import'],
      ['- Liên hệ admin nếu có vấn đề'],
      ['- Điểm trung bình sẽ được tự động tính toán']
    ]

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
    instructionsSheet['!cols'] = [{ wch: 80 }]
    return instructionsSheet
  })
}

// Create Excel template for individual student grades
export async function createIndividualGradeTemplate(data: IndividualGradeExportData): Promise<ArrayBuffer> {
  return withXLSX(async (XLSX) => {
    const workbook = XLSX.utils.book_new()

    // Create worksheet data
    const worksheetData = [
      ...createHeaderRows(data),
      ...createSubjectRows(data.subjects)
    ]

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Configure layout and styling
    configureWorksheetLayout(worksheet)
    await applyWorksheetStyling(worksheet)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng điểm')

    // Add instructions sheet
    const instructionsSheet = await createInstructionsSheet()
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Hướng dẫn')

    // Convert to array buffer
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  })
}

// Helper function to validate if row should be skipped
function shouldSkipRow(row: Record<string, string | number>, subjectName: string): boolean {
  if (!row[1]) return true // Skip empty rows

  // Skip header row, separator row, or invalid rows
  if (subjectName === 'Môn học' ||
      subjectName === 'STT' ||
      subjectName === '' ||
      subjectName.includes('---') ||
      subjectName.includes('NHẬP ĐIỂM') ||
      !isNaN(Number(subjectName))) {
    return true
  }

  // Skip rows where column 1 is just a number (STT column)
  if (!isNaN(Number(row[0])) && subjectName.length < 3) {
    return true
  }

  return false
}

// Helper function to validate grades
function validateGrades(
  midtermGrade: number | undefined,
  finalGrade: number | undefined,
  subjectName: string,
  rowNumber: number
): string[] {
  const errors: string[] = []

  if (midtermGrade !== undefined && (midtermGrade < 0 || midtermGrade > 10)) {
    errors.push(`Dòng ${rowNumber}, ${subjectName}: Điểm giữa kì phải từ 0 đến 10`)
  }

  if (finalGrade !== undefined && (finalGrade < 0 || finalGrade > 10)) {
    errors.push(`Dòng ${rowNumber}, ${subjectName}: Điểm cuối kì phải từ 0 đến 10`)
  }

  return errors
}

// Helper function to process a single row
function processGradeRow(
  row: Record<string, string | number>,
  rowIndex: number,
  expectedSubjects: SubjectInfo[]
): { gradeData?: IndividualGradeData; errors: string[] } {
  const actualRowNumber = rowIndex + 9
  const subjectName = String(row[1]).trim()
  const errors: string[] = []

  if (shouldSkipRow(row, subjectName)) {
    return { errors }
  }

  const midtermGrade = parseFloat(String(row[2] || '')) || undefined
  const finalGrade = parseFloat(String(row[3] || '')) || undefined
  const notes = String(row[4] || '').trim() || undefined

  // Find subject by name
  const subject = expectedSubjects.find(s => s.name_vietnamese === subjectName)
  if (!subject) {
    const availableSubjects = expectedSubjects.map(s => s.name_vietnamese).join(', ')
    errors.push(`Dòng ${actualRowNumber}: Không tìm thấy môn học "${subjectName}". Các môn học có sẵn: ${availableSubjects}`)
    return { errors }
  }

  // Validate grades
  errors.push(...validateGrades(midtermGrade, finalGrade, subjectName, actualRowNumber))

  // Add grade data if any grade is provided
  if (midtermGrade !== undefined || finalGrade !== undefined || notes) {
    return {
      gradeData: {
        subject_id: subject.id,
        subject_name: subjectName,
        midterm_grade: midtermGrade,
        final_grade: finalGrade,
        notes: notes
      },
      errors
    }
  }

  return { errors }
}

// Parse Excel file and extract individual grade data
export async function parseIndividualGradeExcel(file: ArrayBuffer, expectedSubjects: SubjectInfo[]): Promise<{
  success: boolean
  data?: IndividualGradeData[]
  errors?: string[]
}> {
  try {
    return withXLSX((XLSX) => {
      const workbook = XLSX.read(file, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]

      if (!worksheet) {
        return {
          success: false,
          errors: ['Không tìm thấy worksheet trong file Excel']
        }
      }

      // Convert to JSON, starting from row 8 (after headers, column titles, and separator)
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        range: 7, // Start from row 8 (0-indexed) to skip headers, column titles, and separator
        header: 1,
        defval: ''
      }) as unknown as Record<string, string | number>[]

      // Type guard to ensure proper typing
      const jsonData: Record<string, string | number>[] = Array.isArray(rawData)
        ? rawData.filter((row): row is Record<string, string | number> =>
            typeof row === 'object' && row !== null
          )
        : []

      const gradeData: IndividualGradeData[] = []
      const errors: string[] = []

      // Debug: Log the raw data to understand the structure
      console.log('Raw Excel data:', jsonData.slice(0, 5)) // Log first 5 rows for debugging
      console.log('Expected subjects:', expectedSubjects.map(s => s.name_vietnamese))

      // Process each subject row
      jsonData.forEach((row, rowIndex) => {
        const result = processGradeRow(row, rowIndex, expectedSubjects)

        if (result.gradeData) {
          gradeData.push(result.gradeData)
        }

        errors.push(...result.errors)
      })

      if (errors.length > 0) {
        return {
          success: false,
          errors
        }
      }

      return {
        success: true,
        data: gradeData
      }
    })
  } catch (error) {
    return {
      success: false,
      errors: [`Lỗi đọc file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Download file helper
export function downloadExcelFile(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
