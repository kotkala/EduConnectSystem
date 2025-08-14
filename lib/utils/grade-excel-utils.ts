import * as XLSX from 'xlsx'
import { 
  vnEduExcelRowSchema, 
  type VnEduExcelRow,
  gradeValueSchema 
} from '@/lib/validations/grade-management-validations'

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
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Get first worksheet
    const worksheetName = workbook.SheetNames[0]
    if (!worksheetName) {
      throw new Error('File Excel không có worksheet nào')
    }
    
    const worksheet = workbook.Sheets[worksheetName]
    
    // Convert to JSON with header mapping
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    }) as unknown[][]

    if (jsonData.length < format.startRow) {
      throw new Error('File Excel không có dữ liệu')
    }

    // Get header row
    const headerRow = jsonData[0] as string[]
    
    // Find column indices based on headers
    const columnIndices = findColumnIndices(headerRow, format.headers)
    
    // Validate required columns exist - Updated for VNedu format
    const requiredColumns = ['stt', 'ho_ten', 'diem_so'] // Only essential columns required
    const missingColumns = Object.entries(format.headers)
      .filter(([key]) => requiredColumns.includes(key))
      .filter(([, header]) => !headerRow.some(h =>
        h && h.toString().toLowerCase().includes(header.toLowerCase())
      ))
      .map(([, header]) => header)

    if (missingColumns.length > 0) {
      throw new Error(`Thiếu các cột bắt buộc: ${missingColumns.join(', ')}`)
    }

    // Process data rows
    const dataRows = jsonData.slice(format.startRow - 1)
    const validRows: VnEduExcelRow[] = []
    const errorRows: ExcelErrorRow[] = []

    dataRows.forEach((row, index) => {
      const rowNumber = index + format.startRow
      
      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        return
      }

      try {
        // Extract data based on column indices - Enhanced for VNedu format
        const rowData = {
          stt: row[columnIndices.stt] || rowNumber - format.startRow + 1,
          ma_hoc_sinh: row[columnIndices.ma_hoc_sinh]?.toString().trim() || `HS${String(rowNumber - format.startRow + 1).padStart(3, '0')}`,
          ho_ten: row[columnIndices.ho_ten]?.toString().trim() || '',
          diem_so: row[columnIndices.diem_so] || row[columnIndices.cuoi_ky] || row[columnIndices.ca_nam], // Try multiple grade columns
          ghi_chu: row[columnIndices.ghi_chu]?.toString().trim() || ''
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
    })

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

// Find column indices based on header names
function findColumnIndices(
  headerRow: string[], 
  expectedHeaders: VnEduExcelFormat['headers']
): Record<keyof VnEduExcelFormat['headers'], number> {
  const indices: Record<string, number> = {}
  
  Object.entries(expectedHeaders).forEach(([key, expectedHeader]) => {
    const index = headerRow.findIndex(header => 
      header && header.toString().toLowerCase().includes(expectedHeader.toLowerCase())
    )
    indices[key] = index >= 0 ? index : -1
  })
  
  return indices as Record<keyof VnEduExcelFormat['headers'], number>
}

// Generate Excel template for VNedu format with borders and formatting
export function generateExcelTemplate(
  students: Array<{ student_id: string; full_name: string }>,
  classInfo: { className: string; subjectName: string; gradeType: string },
  format: VnEduExcelFormat = DEFAULT_VNEDU_FORMAT
): ArrayBuffer {
  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Create worksheet data
  const worksheetData: unknown[][] = []

  // Add title rows - VNedu style
  worksheetData.push([`Môn Nội dung giáo dục của địa phương Lớp ${classInfo.className} (dùng cho môn học đánh giá bằng nhận xét)`])
  worksheetData.push([]) // Empty row
  worksheetData.push([`Môn học: ${classInfo.subjectName} - ${classInfo.gradeType}`])
  worksheetData.push([]) // Empty row

  // Add main header row
  worksheetData.push([
    format.headers.stt,
    format.headers.ho_ten,
    'Mục đánh giá',
    '',
    '',
    '',
    'Mục đánh giá lại Đạt(D)',
    format.headers.ghi_chu
  ])

  // Add sub-header row for grading columns
  worksheetData.push([
    '',
    '',
    format.headers.thuong_xuyen || 'Thường xuyên',
    format.headers.giua_ky,
    format.headers.cuoi_ky,
    format.headers.ca_nam,
    'Học kỳ',
    'Cả năm'
  ])

  // Add student rows - VNedu style with comprehensive grading columns
  students.forEach((student, index) => {
    worksheetData.push([
      index + 1, // STT
      student.full_name, // Họ và tên
      '', // Thường xuyên
      '', // Giữa kỳ
      '', // Cuối kỳ
      '', // Cả năm
      '', // Mục đánh giá lại - Học kỳ
      '' // Nhận xét
    ])
  })

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths - VNedu style
  worksheet['!cols'] = [
    { width: 8 },  // STT
    { width: 25 }, // Họ và tên
    { width: 12 }, // Thường xuyên
    { width: 12 }, // Giữa kỳ
    { width: 12 }, // Cuối kỳ
    { width: 12 }, // Cả năm
    { width: 12 }, // Mục đánh giá lại
    { width: 40 }  // Nhận xét
  ]

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

  // Style for header row (row 5, index 4)
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

  // Style for data rows (starting from row 6, index 5)
  for (let row = headerRowIndex + 1; row <= range.e.r; row++) {
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
          horizontal: col === 0 ? 'center' : col === 3 ? 'center' : 'left',
          vertical: 'center'
        }
      }

      // Special formatting for grade column (column 3)
      if (col === 3) {
        worksheet[cellRef].s.fill = { fgColor: { rgb: 'FFF2CC' } }
        worksheet[cellRef].s.font = { bold: true }
      }
    }
  }

  // Merge title cells - VNedu style
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Main title
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // Subject info
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // STT column merge
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // Họ và tên column merge
    { s: { r: 4, c: 2 }, e: { r: 4, c: 5 } }, // Mục đánh giá header merge
    { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } }  // Mục đánh giá lại header merge
  ]

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
export const gradeExcelUtils = {
  validateGradeValue,
  parseExcelFile,
  generateExcelTemplate,
  validateExcelFormat,
  formatGradeValue,
  parseGradeInput,
  DEFAULT_VNEDU_FORMAT
}
