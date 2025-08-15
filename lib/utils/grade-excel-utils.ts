import * as XLSX from 'xlsx'
import { 
  vnEduExcelRowSchema, 
  type VnEduExcelRow,
  gradeValueSchema 
} from '@/lib/validations/grade-management-validations'

// Subject-specific regular grade column counts (as requested by user)
export const SUBJECT_REGULAR_COLUMNS = {
  'Ngữ văn': 4,
  'Toán': 4,
  'Ngoại ngữ 1': 4, // Tiếng Anh
  'Tiếng Anh': 4,
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
  'Nội dung giáo dục của địa phương': 2
} as const

// VNedu Excel format structure - Enhanced for comprehensive grading
export interface VnEduExcelFormat {
  headers: {
    stt: string
    ma_hoc_sinh: string
    ho_ten: string
    thuong_xuyen?: string
    giua_ky: string
    cuoi_ky: string
    ca_nam: string
    diem_so: string
    ghi_chu: string
  }
  startRow: number
  subjectName?: string // Added for subject-specific formatting
}

// Default VNedu format configuration - Enhanced for comprehensive grading
export const DEFAULT_VNEDU_FORMAT: VnEduExcelFormat = {
  headers: {
    stt: 'STT',
    ma_hoc_sinh: 'Mã học sinh',
    ho_ten: 'Họ và tên',
    thuong_xuyen: 'Thường xuyên',
    giua_ky: 'Giữa kỳ',
    cuoi_ky: 'Cuối kỳ',
    ca_nam: 'Cả năm',
    diem_so: 'Điểm số',
    ghi_chu: 'Nhận xét sự tiến bộ, ưu điểm nổi bật, hạn chế chủ yếu'
  },
  startRow: 6 // Data starts from row 6 (after title and headers)
}

// Detailed grade processing result for new multi-column structure
export interface DetailedGradeProcessingResult {
  success: boolean
  data?: Array<{
    student_id: string
    full_name: string
    regular_grades: (number | null)[]
    midterm_grade: number | null
    final_grade: number | null
    semester_1_grade: number | null
    semester_2_grade: number | null
    yearly_grade: number | null
    notes?: string
  }>
  errors?: string[]
  totalRows?: number
  validRows?: number
  invalidRows?: number
}

// Excel processing result
export interface ExcelProcessingResult {
  success: boolean
  totalRows: number
  validRows: VnEduExcelRow[]
  errorRows: ExcelErrorRow[]
  summary: {
    processed: number
    valid: number
    errors: number
  }
}

// Excel error row
export interface ExcelErrorRow {
  rowNumber: number
  data: Record<string, unknown>
  errors: string[]
}

// Grade validation result
export interface GradeValidationResult {
  isValid: boolean
  value?: number
  errors: string[]
}

// Validate grade value according to VNedu standards
export function validateGradeValue(value: unknown): GradeValidationResult {
  const errors: string[] = []
  
  // Handle empty values
  if (value === null || value === undefined || value === '') {
    errors.push('Điểm số không được để trống')
    return { isValid: false, errors }
  }

  // Convert string to number if needed
  let numericValue: number
  
  if (typeof value === 'string') {
    // Replace comma with dot for decimal separator
    const cleanValue = value.trim().replace(',', '.')
    
    // Check for non-numeric characters (except decimal point)
    if (!/^-?\d*\.?\d+$/.test(cleanValue)) {
      errors.push('Điểm số chỉ được chứa số và dấu thập phân')
      return { isValid: false, errors }
    }
    
    numericValue = parseFloat(cleanValue)
  } else if (typeof value === 'number') {
    numericValue = value
  } else {
    errors.push('Điểm số phải là số')
    return { isValid: false, errors }
  }

  // Check if conversion was successful
  if (isNaN(numericValue)) {
    errors.push('Điểm số không hợp lệ')
    return { isValid: false, errors }
  }

  // Validate using Zod schema
  try {
    const validatedValue = gradeValueSchema.parse(numericValue)
    return { isValid: true, value: validatedValue, errors: [] }
  } catch (error: unknown) {
    const zodError = error as { errors?: Array<{ message: string }> }
    const zodErrors = zodError.errors?.map((e) => e.message) || ['Điểm số không hợp lệ']
    return { isValid: false, errors: zodErrors }
  }
}

// Parse Excel file and extract data
export async function parseExcelFile(
  file: File,
  format: VnEduExcelFormat = DEFAULT_VNEDU_FORMAT
): Promise<ExcelProcessingResult> {
  try {
    // Validate file first
    if (!file) {
      throw new Error('Không có file được chọn')
    }

    if (file.size === 0) {
      throw new Error('File rỗng')
    }

    // Read file as array buffer (Context7 pattern: ArrayBuffer is default type)
    const arrayBuffer = await file.arrayBuffer()

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Không thể đọc nội dung file')
    }

    // Parse with XLSX (Context7 best practice)
    const workbook = XLSX.read(arrayBuffer, {
      cellText: false,
      cellDates: true
    })

    // Get first worksheet
    const worksheetName = workbook.SheetNames[0]
    if (!worksheetName) {
      throw new Error('File Excel không có worksheet nào')
    }

    const worksheet = workbook.Sheets[worksheetName]
    if (!worksheet) {
      throw new Error('Worksheet không hợp lệ')
    }

    // Convert to JSON with header mapping (Context7 pattern)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false
    })

    if (!Array.isArray(jsonData) || jsonData.length < format.startRow) {
      throw new Error('File Excel không có dữ liệu hợp lệ')
    }

    // Get header row (try multiple rows if needed)
    let headerRow: string[] = []
    let headerRowIndex = 0

    // Find the actual header row (may not be the first row)
    for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
      const row = jsonData[i] as string[]
      if (row && row.some(cell =>
        cell && typeof cell === 'string' &&
        (cell.toLowerCase().includes('stt') ||
         cell.toLowerCase().includes('họ') ||
         cell.toLowerCase().includes('tên') ||
         cell.toLowerCase().includes('điểm'))
      )) {
        headerRow = row
        headerRowIndex = i
        break
      }
    }

    if (headerRow.length === 0) {
      throw new Error('Không tìm thấy dòng tiêu đề trong file Excel')
    }

    // Update format start row based on found header
    format.startRow = headerRowIndex + 2 // Data starts after header row

    // Find column indices based on headers
    const columnIndices = findColumnIndices(headerRow, format.headers)

    // Validate essential columns exist (simplified validation)
    const essentialColumns: (keyof VnEduExcelFormat['headers'])[] = ['stt', 'ho_ten']
    const missingEssential = essentialColumns.filter(col => columnIndices[col] === -1)

    if (missingEssential.length > 0) {
      throw new Error(`Thiếu các cột bắt buộc: STT, Họ và tên`)
    }

    // Process data rows
    const dataRows = jsonData.slice(format.startRow - 1)
    const validRows: VnEduExcelRow[] = []
    const errorRows: ExcelErrorRow[] = []

    // Use for loop instead of forEach for better performance
    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index] as unknown[]
      const rowNumber = index + format.startRow

      // Skip empty rows (optimized check)
      if (!row || !Array.isArray(row) || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
        continue
      }

      try {
        // Extract data based on column indices - Simplified for new format
        const rowData = {
          stt: row[columnIndices.stt] || rowNumber - format.startRow + 1,
          ma_hoc_sinh: row[columnIndices.ma_hoc_sinh]?.toString().trim() || `HS${String(rowNumber - format.startRow + 1).padStart(3, '0')}`,
          ho_ten: row[columnIndices.ho_ten]?.toString().trim() || '',
          diem_so: row[columnIndices.diem_so] ||
                   row[columnIndices.cuoi_ky] ||
                   row[columnIndices.ca_nam] ||
                   row[2] || // Fallback to 3rd column (common grade position)
                   '',
          ghi_chu: row[columnIndices.ghi_chu]?.toString().trim() || ''
        }

        // Skip rows with no name
        if (!rowData.ho_ten) {
          continue
        }

        // Validate row data
        const validatedRow = vnEduExcelRowSchema.parse(rowData)
        validRows.push(validatedRow)

      } catch (error: unknown) {
        const zodError = error as { errors?: Array<{ message: string }>; message?: string }
        const errors = zodError.errors?.map((e) => e.message) || [zodError.message || 'Lỗi không xác định']
        errorRows.push({
          rowNumber,
          data: row as unknown as Record<string, unknown>,
          errors
        })
      }
    }

    return {
      success: true,
      totalRows: dataRows.length,
      validRows,
      errorRows,
      summary: {
        processed: dataRows.length,
        valid: validRows.length,
        errors: errorRows.length
      }
    }

  } catch (error) {
    console.error('Error parsing Excel file:', error)
    return {
      success: false,
      totalRows: 0,
      validRows: [],
      errorRows: [],
      summary: {
        processed: 0,
        valid: 0,
        errors: 0
      }
    }
  }
}

// Find column indices based on header names (improved flexibility)
function findColumnIndices(
  headerRow: string[],
  expectedHeaders: VnEduExcelFormat['headers']
): Record<keyof VnEduExcelFormat['headers'], number> {
  const indices: Record<string, number> = {}

  // Define flexible search patterns for each column type
  const searchPatterns = {
    stt: ['stt', 'số thứ tự', 'thứ tự', 'số'],
    ho_ten: ['họ', 'tên', 'họ tên', 'họ và tên', 'name'],
    ma_hoc_sinh: ['mã', 'id', 'student', 'học sinh'],
    diem_so: ['điểm', 'grade', 'score', 'lần', 'giữa', 'cuối'],
    thuong_xuyen: ['thường xuyên', 'lần 1', 'lần 2'],
    giua_ky: ['giữa kỳ', 'giữa kì', 'midterm'],
    cuoi_ky: ['cuối kỳ', 'cuối kì', 'final'],
    ca_nam: ['cả năm', 'năm', 'yearly'],
    ghi_chu: ['ghi chú', 'chú', 'note', 'comment']
  }

  Object.entries(expectedHeaders).forEach(([key, expectedHeader]) => {
    const patterns = searchPatterns[key as keyof typeof searchPatterns] || [expectedHeader]

    const index = headerRow.findIndex(header => {
      if (!header) return false
      const headerLower = header.toString().toLowerCase().trim()
      return patterns.some(pattern =>
        headerLower.includes(pattern.toLowerCase()) ||
        pattern.toLowerCase().includes(headerLower)
      )
    })

    indices[key] = index >= 0 ? index : -1
  })

  return indices as Record<keyof VnEduExcelFormat['headers'], number>
}

// Generate Excel template with proper multi-column structure as requested
export function generateExcelTemplate(
  students: Array<{ student_id: string; full_name: string }>,
  classInfo: { className: string; subjectName: string; gradeType: string }
): ArrayBuffer {
  // Create workbook using Context7 best practices
  const workbook = XLSX.utils.book_new()

  // Create worksheet data array
  const worksheetData: unknown[][] = []

  // Add title rows - VNedu style
  worksheetData.push([`Môn ${classInfo.subjectName} Lớp ${classInfo.className}`])
  worksheetData.push([]) // Empty row
  worksheetData.push([`Loại điểm: ${classInfo.gradeType === 'yearly' ? 'Cả năm' : classInfo.gradeType === 'semester1' ? 'Cuối học kỳ 1' : 'Cuối học kỳ 2'}`])
  worksheetData.push([]) // Empty row

  // Generate headers based on grade type - Exactly as user requested
  let headers: string[] = []

  if (classInfo.gradeType === 'yearly') {
    // For yearly grades: simple structure
    headers = [
      'STT',
      'Họ và tên',
      'Điểm học kì 1',
      'Điểm học kì 2',
      'Điểm cả năm'
    ]

    // Add single header row for yearly
    worksheetData.push(headers)
  } else {
    // For semester grades: create two-row header structure
    const subjectName = classInfo.subjectName
    const regularCount = SUBJECT_REGULAR_COLUMNS[subjectName as keyof typeof SUBJECT_REGULAR_COLUMNS] || 3

    // First header row: category headers
    const categoryHeaders = ['STT', 'Họ và tên']

    // Add "Thường xuyên" spanning across regular columns
    categoryHeaders.push('Thường xuyên')
    for (let i = 1; i < regularCount; i++) {
      categoryHeaders.push('') // Empty cells for merge
    }

    // Add individual headers for midterm and final
    categoryHeaders.push('Giữa kì', 'Cuối kì')

    // Second header row: specific column names
    const specificHeaders = ['', ''] // Empty for STT and Họ và tên (will be merged)

    // Add "Lần 1", "Lần 2", etc. for regular grades
    for (let i = 1; i <= regularCount; i++) {
      specificHeaders.push(`Lần ${i}`)
    }

    // Add empty cells for midterm and final (already labeled above)
    specificHeaders.push('', '')

    // Add both header rows
    worksheetData.push(categoryHeaders)
    worksheetData.push(specificHeaders)

    // Set headers for column width calculation
    headers = ['STT', 'Họ và tên']
    for (let i = 1; i <= regularCount; i++) {
      headers.push(`Lần ${i}`)
    }
    headers.push('Giữa kì', 'Cuối kì')
  }

  // Add student rows with empty cells for all grade columns
  students.forEach((student, index) => {
    const studentRow = [
      index + 1, // STT
      student.full_name, // Họ và tên
      ...Array(headers.length - 2).fill('') // Empty cells for all grade columns
    ]
    worksheetData.push(studentRow)
  })

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths dynamically based on number of columns (Context7 pattern)
  const columnWidths = [
    { wch: 8 },  // STT
    { wch: 25 }  // Họ và tên
  ]

  // Add width for grade columns (12 width each)
  for (let i = 2; i < headers.length; i++) {
    columnWidths.push({ wch: 12 })
  }

  worksheet['!cols'] = columnWidths

  // Apply formatting and borders
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

  // Style for title rows (rows 1-3)
  for (let row = 0; row <= 2; row++) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' }
    worksheet[cellRef].s = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'E6F3FF' } }
    }
  }

  // Style for header rows - different for yearly vs semester
  if (classInfo.gradeType === 'yearly') {
    // Single header row for yearly (row 5, index 4)
    const headerRowIndex = 4
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col })
      if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' }
      worksheet[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }
    }
  } else {
    // Two header rows for semester (rows 5-6, indices 4-5)
    for (let headerRow = 4; headerRow <= 5; headerRow++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col })
        if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' }
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        }
      }
    }
  }

  // Style for data rows (starting after header rows)
  const dataStartRow = classInfo.gradeType === 'yearly' ? 5 : 6 // Row 6 for yearly, row 7 for semester
  for (let row = dataStartRow; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
      if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' }

      // Apply borders to all data cells
      worksheet[cellRef].s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        },
        alignment: {
          horizontal: col === 0 ? 'center' : col === 1 ? 'left' : 'center',
          vertical: 'center'
        }
      }

      // Special formatting for grade columns (columns 2 and beyond)
      if (col >= 2) {
        worksheet[cellRef].s.fill = { fgColor: { rgb: 'FFF2CC' } }
        worksheet[cellRef].s.font = { bold: false }
      }
    }
  }

  // Merge title cells dynamically based on actual column count (Context7 pattern)
  const lastColumnIndex = headers.length - 1
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumnIndex } }, // Main title spans all columns
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumnIndex } }  // Grade type info spans all columns
  ]

  // Add merges for semester structure (two-row headers)
  if (classInfo.gradeType !== 'yearly') {
    const subjectName = classInfo.subjectName
    const regularCount = SUBJECT_REGULAR_COLUMNS[subjectName as keyof typeof SUBJECT_REGULAR_COLUMNS] || 3

    // Merge STT column (rows 4-5)
    merges.push({ s: { r: 4, c: 0 }, e: { r: 5, c: 0 } })

    // Merge Họ và tên column (rows 4-5)
    merges.push({ s: { r: 4, c: 1 }, e: { r: 5, c: 1 } })

    // Merge "Thường xuyên" header across regular columns (row 4)
    if (regularCount > 1) {
      merges.push({ s: { r: 4, c: 2 }, e: { r: 4, c: 1 + regularCount } })
    }

    // Merge Giữa kì column (rows 4-5)
    merges.push({ s: { r: 4, c: 2 + regularCount }, e: { r: 5, c: 2 + regularCount } })

    // Merge Cuối kì column (rows 4-5)
    merges.push({ s: { r: 4, c: 3 + regularCount }, e: { r: 5, c: 3 + regularCount } })
  }

  worksheet['!merges'] = merges

  // Set print settings
  worksheet['!printHeader'] = '1:4' // Print title rows on every page
  worksheet['!margins'] = {
    left: 0.7, right: 0.7, top: 0.75, bottom: 0.75,
    header: 0.3, footer: 0.3
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng điểm')

  // Generate buffer
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

// Validate Excel file format before processing
export function validateExcelFormat(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
  
  if (!validTypes.includes(file.type)) {
    errors.push('File phải có định dạng Excel (.xlsx hoặc .xls)')
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    errors.push('File không được vượt quá 10MB')
  }
  
  // Check file name
  if (!file.name || file.name.trim() === '') {
    errors.push('Tên file không hợp lệ')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Format grade value for display
export function formatGradeValue(value: number): string {
  return value.toFixed(1)
}

// Parse grade value from string input
export function parseGradeInput(input: string): number | null {
  if (!input || input.trim() === '') return null
  
  const cleanInput = input.trim().replace(',', '.')
  const parsed = parseFloat(cleanInput)
  
  if (isNaN(parsed)) return null
  
  // Round to 1 decimal place
  return Math.round(parsed * 10) / 10
}

// Export utility functions
// Parse Excel file for detailed grades (new multi-column structure)
export async function parseDetailedGradeExcelFile(
  file: File,
  gradeType: 'semester1' | 'semester2' | 'yearly',
  subjectName: string
): Promise<DetailedGradeProcessingResult> {
  try {
    // Validate file first
    if (!file) {
      throw new Error('Không có file được chọn')
    }

    if (file.size === 0) {
      throw new Error('File rỗng')
    }

    // Read file as array buffer (Context7 pattern)
    const arrayBuffer = await file.arrayBuffer()

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Không thể đọc nội dung file')
    }

    // Parse with XLSX (Context7 best practice)
    const workbook = XLSX.read(arrayBuffer, {
      cellText: false,
      cellDates: true
    })

    // Get first worksheet
    const worksheetName = workbook.SheetNames[0]
    if (!worksheetName) {
      throw new Error('File Excel không có worksheet nào')
    }

    const worksheet = workbook.Sheets[worksheetName]
    if (!worksheet) {
      throw new Error('Worksheet không hợp lệ')
    }

    // Convert to JSON with header mapping
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false
    })

    if (!Array.isArray(jsonData) || jsonData.length < 5) {
      throw new Error('File Excel không có dữ liệu hợp lệ')
    }

    // Find header row (should be around row 5, index 4)
    let headerRow: string[] = []
    let headerRowIndex = -1

    for (let i = 3; i < Math.min(jsonData.length, 8); i++) {
      const row = jsonData[i] as string[]
      if (row && row.some(cell =>
        cell && typeof cell === 'string' &&
        (cell.toLowerCase().includes('stt') ||
         cell.toLowerCase().includes('họ'))
      )) {
        headerRow = row
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1 || !headerRow.length) {
      throw new Error('Không tìm thấy dòng tiêu đề trong file Excel')
    }

    // Parse data rows
    const dataRows = jsonData.slice(headerRowIndex + 1) as string[][]
    const results = []
    const errors = []
    let validRows = 0
    let invalidRows = 0

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row || row.length < 3) continue

      const rowNumber = headerRowIndex + i + 2 // Excel row number (1-based)

      try {
        // Extract STT and student name
        const stt = row[0]?.toString().trim()
        const fullName = row[1]?.toString().trim()

        if (!stt || !fullName) {
          continue // Skip empty rows
        }

        if (gradeType === 'yearly') {
          // For yearly: STT, Họ và tên, Điểm học kì 1, Điểm học kì 2, Điểm cả năm
          const semester1Grade = parseGradeInput(row[2]?.toString() || '')
          const semester2Grade = parseGradeInput(row[3]?.toString() || '')
          const yearlyGrade = parseGradeInput(row[4]?.toString() || '')

          results.push({
            student_id: '', // Will be resolved later
            full_name: fullName,
            regular_grades: [],
            midterm_grade: null,
            final_grade: null,
            semester_1_grade: semester1Grade,
            semester_2_grade: semester2Grade,
            yearly_grade: yearlyGrade,
            notes: row[5]?.toString().trim() || ''
          })
        } else {
          // For semester: STT, Họ và tên, Lần 1, Lần 2, ..., Giữa kì, Cuối kì
          const regularCount = SUBJECT_REGULAR_COLUMNS[subjectName as keyof typeof SUBJECT_REGULAR_COLUMNS] || 3
          const regularGrades: (number | null)[] = []

          // Parse regular grades (Thường xuyên)
          for (let j = 0; j < regularCount; j++) {
            const gradeValue = parseGradeInput(row[2 + j]?.toString() || '')
            regularGrades.push(gradeValue)
          }

          // Parse midterm and final grades
          const midtermIndex = 2 + regularCount
          const finalIndex = midtermIndex + 1

          const midtermGrade = parseGradeInput(row[midtermIndex]?.toString() || '')
          const finalGrade = parseGradeInput(row[finalIndex]?.toString() || '')

          results.push({
            student_id: '', // Will be resolved later
            full_name: fullName,
            regular_grades: regularGrades,
            midterm_grade: midtermGrade,
            final_grade: finalGrade,
            semester_1_grade: null,
            semester_2_grade: null,
            yearly_grade: null,
            notes: row[finalIndex + 1]?.toString().trim() || ''
          })
        }

        validRows++
      } catch (error) {
        invalidRows++
        errors.push(`Dòng ${rowNumber}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
      }
    }

    return {
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      totalRows: dataRows.length,
      validRows,
      invalidRows
    }

  } catch (error) {
    console.error('Error parsing detailed grade Excel file:', error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Không thể xử lý file Excel'],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0
    }
  }
}

export const gradeExcelUtils = {
  validateGradeValue,
  parseExcelFile,
  parseDetailedGradeExcelFile,
  generateExcelTemplate,
  validateExcelFormat,
  formatGradeValue,
  parseGradeInput,
  DEFAULT_VNEDU_FORMAT
}
