import * as XLSX from 'xlsx'
import { 
  vnEduExcelRowSchema, 
  type VnEduExcelRow,
  gradeValueSchema 
} from '@/lib/validations/grade-management-validations'

// VNedu Excel format structure
export interface VnEduExcelFormat {
  headers: {
    stt: string
    ma_hoc_sinh: string
    ho_ten: string
    diem_so: string
    ghi_chu: string
  }
  startRow: number
}

// Default VNedu format configuration
export const DEFAULT_VNEDU_FORMAT: VnEduExcelFormat = {
  headers: {
    stt: 'STT',
    ma_hoc_sinh: 'Mã học sinh',
    ho_ten: 'Họ và tên',
    diem_so: 'Điểm số',
    ghi_chu: 'Ghi chú'
  },
  startRow: 2 // Data starts from row 2 (after header)
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
    
    // Validate required columns exist
    const missingColumns = Object.entries(format.headers)
      .filter(([key]) => key !== 'ghi_chu') // ghi_chu is optional
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
        // Extract data based on column indices
        const rowData = {
          stt: row[columnIndices.stt] || rowNumber - format.startRow + 1,
          ma_hoc_sinh: row[columnIndices.ma_hoc_sinh]?.toString().trim() || '',
          ho_ten: row[columnIndices.ho_ten]?.toString().trim() || '',
          diem_so: row[columnIndices.diem_so],
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

// Generate Excel template for VNedu format
export function generateExcelTemplate(
  students: Array<{ student_id: string; full_name: string }>,
  format: VnEduExcelFormat = DEFAULT_VNEDU_FORMAT
): ArrayBuffer {
  // Create workbook
  const workbook = XLSX.utils.book_new()
  
  // Create worksheet data
  const worksheetData: unknown[][] = []
  
  // Add header row
  worksheetData.push([
    format.headers.stt,
    format.headers.ma_hoc_sinh,
    format.headers.ho_ten,
    format.headers.diem_so,
    format.headers.ghi_chu
  ])
  
  // Add student rows
  students.forEach((student, index) => {
    worksheetData.push([
      index + 1,
      student.student_id,
      student.full_name,
      '', // Empty grade field for input
      '' // Empty notes field
    ])
  })
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  
  // Set column widths
  worksheet['!cols'] = [
    { width: 5 },  // STT
    { width: 15 }, // Mã học sinh
    { width: 25 }, // Họ tên
    { width: 10 }, // Điểm số
    { width: 20 }  // Ghi chú
  ]
  
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
