import * as XLSX from 'xlsx'
import { getRegularGradeCount } from './teacher-excel-utils'

// Import validation result types
export interface ExcelImportValidationResult {
  success: boolean
  data?: ValidatedGradeData[]
  statistics: ImportStatistics
  errors: ValidationError[]
  warnings: string[]
}

export interface ValidatedGradeData {
  rowNumber: number
  studentId: string
  studentName: string
  regularGrades: (number | null)[]
  midtermGrade?: number | null
  finalGrade?: number | null
  summaryGrade?: number | null
  notes?: string
}

export interface ImportStatistics {
  totalRows: number
  validRows: number
  invalidRows: number
  emptyRows: number
  duplicateStudents: number
  validGrades: number
  invalidGrades: number
  missingGrades: number
}

export interface ValidationError {
  rowNumber: number
  studentId?: string
  studentName?: string
  field: string
  value: unknown
  message: string
  severity: 'error' | 'warning'
}

// Grade validation according to Vietnamese education standards
export function validateGradeValue(value: unknown, fieldName: string): { isValid: boolean; value?: number | null; error?: string } {
  // Handle empty values
  if (value === null || value === undefined || value === '' || value === '-') {
    return { isValid: true, value: null }
  }

  // Convert to string first
  const strValue = String(value).trim()
  if (strValue === '' || strValue === '-') {
    return { isValid: true, value: null }
  }

  // Try to parse as number
  const numValue = parseFloat(strValue.replace(',', '.'))
  
  if (isNaN(numValue)) {
    return { 
      isValid: false, 
      error: `${fieldName}: "${value}" không phải là số hợp lệ` 
    }
  }

  // Check range (0-10)
  if (numValue < 0 || numValue > 10) {
    return { 
      isValid: false, 
      error: `${fieldName}: ${numValue} phải trong khoảng 0-10` 
    }
  }

  // Check decimal places (max 1)
  const decimalPlaces = (numValue.toString().split('.')[1] || '').length
  if (decimalPlaces > 1) {
    return { 
      isValid: false, 
      error: `${fieldName}: ${numValue} chỉ được có tối đa 1 chữ số thập phân` 
    }
  }

  // Round to 1 decimal place
  const roundedValue = Math.round(numValue * 10) / 10

  return { isValid: true, value: roundedValue }
}

// Validate student ID format
export function validateStudentId(value: unknown): { isValid: boolean; value?: string; error?: string } {
  if (!value || String(value).trim() === '') {
    return { isValid: false, error: 'Mã học sinh không được để trống' }
  }

  const studentId = String(value).trim()
  
  // Basic format validation (alphanumeric, 3-20 characters)
  if (!/^[A-Za-z0-9]{3,20}$/.test(studentId)) {
    return { 
      isValid: false, 
      error: `Mã học sinh "${studentId}" không đúng định dạng (3-20 ký tự, chỉ chữ và số)` 
    }
  }

  return { isValid: true, value: studentId }
}

// Validate student name
export function validateStudentName(value: unknown): { isValid: boolean; value?: string; error?: string } {
  if (!value || String(value).trim() === '') {
    return { isValid: false, error: 'Tên học sinh không được để trống' }
  }

  const studentName = String(value).trim()
  
  // Basic name validation (2-50 characters, Vietnamese characters allowed)
  if (studentName.length < 2 || studentName.length > 50) {
    return { 
      isValid: false, 
      error: `Tên học sinh "${studentName}" phải có độ dài 2-50 ký tự` 
    }
  }

  return { isValid: true, value: studentName }
}

// Detect Excel column structure based on headers
export function detectColumnStructure(headerRow: unknown[]): {
  sttColumn: number
  studentIdColumn: number
  studentNameColumn: number
  regularGradeColumns: number[]
  midtermColumn?: number
  finalColumn?: number
  summaryColumn?: number
  notesColumn?: number
  errors: string[]
} {
  const errors: string[] = []
  let sttColumn = -1
  let studentIdColumn = -1
  let studentNameColumn = -1
  const regularGradeColumns: number[] = []
  let midtermColumn: number | undefined
  let finalColumn: number | undefined
  let summaryColumn: number | undefined
  let notesColumn: number | undefined

  // Search for required columns
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').toLowerCase().trim()
    
    if (header.includes('stt') || header.includes('số thứ tự')) {
      sttColumn = i
    } else if (header.includes('mã học sinh') || header.includes('mã hs')) {
      studentIdColumn = i
    } else if (header.includes('họ và tên') || header.includes('họ tên') || header.includes('tên')) {
      studentNameColumn = i
    } else if (header.includes('điểm thường xuyên') || header.includes('tx')) {
      regularGradeColumns.push(i)
    } else if (header.includes('điểm giữa kì') || header.includes('giữa kì')) {
      midtermColumn = i
    } else if (header.includes('điểm cuối kì') || header.includes('cuối kì')) {
      finalColumn = i
    } else if (header.includes('điểm tổng kết') || header.includes('tổng kết')) {
      summaryColumn = i
    } else if (header.includes('ghi chú') || header.includes('notes')) {
      notesColumn = i
    }
  }

  // Validate required columns
  if (sttColumn === -1) errors.push('Không tìm thấy cột "STT"')
  if (studentIdColumn === -1) errors.push('Không tìm thấy cột "Mã học sinh"')
  if (studentNameColumn === -1) errors.push('Không tìm thấy cột "Họ và tên"')
  if (regularGradeColumns.length === 0) errors.push('Không tìm thấy cột điểm thường xuyên')

  return {
    sttColumn,
    studentIdColumn,
    studentNameColumn,
    regularGradeColumns,
    midtermColumn,
    finalColumn,
    summaryColumn,
    notesColumn,
    errors
  }
}

// Main Excel import validation function
export async function validateExcelImport(
  file: File,
  subjectName: string,
  periodType: string,
  expectedStudents?: { id: string; name: string; studentId: string }[]
): Promise<ExcelImportValidationResult> {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const validatedData: ValidatedGradeData[] = []
  
  const statistics: ImportStatistics = {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    emptyRows: 0,
    duplicateStudents: 0,
    validGrades: 0,
    invalidGrades: 0,
    missingGrades: 0
  }

  try {
    // Validate file
    if (!file) {
      throw new Error('Không có file được chọn')
    }

    if (file.size === 0) {
      throw new Error('File rỗng')
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File quá lớn (tối đa 10MB)')
    }

    // Read file using Context7 best practices
    const arrayBuffer = await file.arrayBuffer()
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Không thể đọc nội dung file')
    }

    // Parse with XLSX
    const workbook = XLSX.read(arrayBuffer, {
      cellText: false,
      cellDates: true,
      cellFormula: false,
      sheetStubs: false
    })

    if (!workbook.SheetNames.length) {
      throw new Error('File Excel không có sheet nào')
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    
    // Convert to array of arrays
    const data: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: ''
    })

    if (data.length < 6) {
      throw new Error('File Excel phải có ít nhất 6 dòng (title + header + dữ liệu)')
    }

    // Validate subject name in Excel file title (row 0)
    if (data.length > 0 && data[0] && Array.isArray(data[0]) && data[0].length > 0) {
      const titleRow = data[0][0]?.toString().toLowerCase() || ''
      const expectedSubjectName = subjectName.toLowerCase()

      // Check if the Excel file contains the expected subject name
      if (!titleRow.includes(expectedSubjectName)) {
        // Try to extract subject name from title
        const titleMatch = titleRow.match(/bảng điểm\s+(.+)/i)
        const fileSubjectName = titleMatch ? titleMatch[1].trim() : 'không xác định'

        throw new Error(
          `File Excel không đúng môn học. ` +
          `Môn học được chọn: "${subjectName}", ` +
          `nhưng file Excel dành cho môn: "${fileSubjectName}". ` +
          `Vui lòng tải template đúng cho môn "${subjectName}" và nhập điểm.`
        )
      }
    }

    // Find the header row (skip title rows)
    // Template structure: Title (row 0), Class info (row 1), Academic year (row 2), Empty (row 3), Headers (row 4)
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i]
      if (row && Array.isArray(row)) {
        const rowStr = row.join('').toLowerCase()
        if (rowStr.includes('stt') || rowStr.includes('mã học sinh') || rowStr.includes('họ và tên')) {
          headerRowIndex = i
          break
        }
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('Không tìm thấy dòng tiêu đề trong file Excel. Vui lòng sử dụng template đúng định dạng.')
    }

    // Detect column structure from the actual header row
    const columnStructure = detectColumnStructure(data[headerRowIndex])
    if (columnStructure.errors.length > 0) {
      columnStructure.errors.forEach(error => {
        errors.push({
          rowNumber: headerRowIndex + 1,
          field: 'header',
          value: data[headerRowIndex],
          message: error,
          severity: 'error'
        })
      })

      return {
        success: false,
        statistics,
        errors,
        warnings
      }
    }

    // Get expected regular grade count
    const expectedRegularGradeCount = getRegularGradeCount(subjectName)
    
    // Validate regular grade columns count
    if (columnStructure.regularGradeColumns.length !== expectedRegularGradeCount) {
      warnings.push(
        `Số cột điểm thường xuyên (${columnStructure.regularGradeColumns.length}) khác với chuẩn của môn ${subjectName} (${expectedRegularGradeCount})`
      )
    }

    // Process data rows (start from row after header)
    const seenStudentIds = new Set<string>()

    for (let rowIndex = headerRowIndex + 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      const rowNumber = rowIndex + 1
      statistics.totalRows++

      // Check if row is empty
      const isEmptyRow = row.every(cell => !cell || String(cell).trim() === '')
      if (isEmptyRow) {
        statistics.emptyRows++
        continue
      }

      let hasRowErrors = false
      const rowErrors: ValidationError[] = []

      // Validate student ID
      const studentIdValidation = validateStudentId(row[columnStructure.studentIdColumn])
      if (!studentIdValidation.isValid) {
        hasRowErrors = true
        rowErrors.push({
          rowNumber,
          field: 'studentId',
          value: row[columnStructure.studentIdColumn],
          message: studentIdValidation.error!,
          severity: 'error'
        })
      }

      // Validate student name
      const studentNameValidation = validateStudentName(row[columnStructure.studentNameColumn])
      if (!studentNameValidation.isValid) {
        hasRowErrors = true
        rowErrors.push({
          rowNumber,
          field: 'studentName',
          value: row[columnStructure.studentNameColumn],
          message: studentNameValidation.error!,
          severity: 'error'
        })
      }

      // Check for duplicate student IDs
      if (studentIdValidation.isValid && seenStudentIds.has(studentIdValidation.value!)) {
        hasRowErrors = true
        statistics.duplicateStudents++
        rowErrors.push({
          rowNumber,
          studentId: studentIdValidation.value,
          field: 'studentId',
          value: studentIdValidation.value,
          message: `Mã học sinh "${studentIdValidation.value}" bị trùng lặp`,
          severity: 'error'
        })
      } else if (studentIdValidation.isValid) {
        seenStudentIds.add(studentIdValidation.value!)
      }

      // Validate regular grades
      const regularGrades: (number | null)[] = []
      for (let i = 0; i < columnStructure.regularGradeColumns.length; i++) {
        const colIndex = columnStructure.regularGradeColumns[i]
        const gradeValidation = validateGradeValue(row[colIndex], `Điểm TX ${i + 1}`)
        
        if (!gradeValidation.isValid) {
          hasRowErrors = true
          statistics.invalidGrades++
          rowErrors.push({
            rowNumber,
            studentId: studentIdValidation.value,
            studentName: studentNameValidation.value,
            field: `regularGrade${i + 1}`,
            value: row[colIndex],
            message: gradeValidation.error!,
            severity: 'error'
          })
        } else {
          if (gradeValidation.value !== null && gradeValidation.value !== undefined) {
            statistics.validGrades++
          } else {
            statistics.missingGrades++
          }
          regularGrades.push(gradeValidation.value ?? null)
        }
      }

      // Validate optional grades (midterm, final, summary)
      let midtermGrade: number | null = null
      let finalGrade: number | null = null
      let summaryGrade: number | null = null

      if (columnStructure.midtermColumn !== undefined) {
        const midtermValidation = validateGradeValue(row[columnStructure.midtermColumn], 'Điểm giữa kì')
        if (!midtermValidation.isValid) {
          hasRowErrors = true
          statistics.invalidGrades++
          rowErrors.push({
            rowNumber,
            studentId: studentIdValidation.value,
            studentName: studentNameValidation.value,
            field: 'midtermGrade',
            value: row[columnStructure.midtermColumn],
            message: midtermValidation.error!,
            severity: 'error'
          })
        } else {
          midtermGrade = midtermValidation.value ?? null
          if (midtermGrade !== null) statistics.validGrades++
          else statistics.missingGrades++
        }
      }

      if (columnStructure.finalColumn !== undefined) {
        const finalValidation = validateGradeValue(row[columnStructure.finalColumn], 'Điểm cuối kì')
        if (!finalValidation.isValid) {
          hasRowErrors = true
          statistics.invalidGrades++
          rowErrors.push({
            rowNumber,
            studentId: studentIdValidation.value,
            studentName: studentNameValidation.value,
            field: 'finalGrade',
            value: row[columnStructure.finalColumn],
            message: finalValidation.error!,
            severity: 'error'
          })
        } else {
          finalGrade = finalValidation.value ?? null
          if (finalGrade !== null) statistics.validGrades++
          else statistics.missingGrades++
        }
      }

      if (columnStructure.summaryColumn !== undefined) {
        const summaryValidation = validateGradeValue(row[columnStructure.summaryColumn], 'Điểm tổng kết')
        if (!summaryValidation.isValid) {
          hasRowErrors = true
          statistics.invalidGrades++
          rowErrors.push({
            rowNumber,
            studentId: studentIdValidation.value,
            studentName: studentNameValidation.value,
            field: 'summaryGrade',
            value: row[columnStructure.summaryColumn],
            message: summaryValidation.error!,
            severity: 'error'
          })
        } else {
          summaryGrade = summaryValidation.value ?? null
          if (summaryGrade !== null) statistics.validGrades++
          else statistics.missingGrades++
        }
      }

      // Get notes
      const notes = columnStructure.notesColumn !== undefined 
        ? String(row[columnStructure.notesColumn] || '').trim() 
        : ''

      // Add row errors to main errors array
      errors.push(...rowErrors)

      if (hasRowErrors) {
        statistics.invalidRows++
      } else {
        statistics.validRows++
        
        // Add to validated data
        validatedData.push({
          rowNumber,
          studentId: studentIdValidation.value!,
          studentName: studentNameValidation.value!,
          regularGrades,
          midtermGrade,
          finalGrade,
          summaryGrade,
          notes: notes || undefined
        })
      }
    }

    // Check against expected students if provided
    if (expectedStudents && expectedStudents.length > 0) {
      const importedStudentIds = new Set(validatedData.map(d => d.studentId))
      const expectedStudentIds = new Set(expectedStudents.map(s => s.studentId))
      
      // Find missing students
      const missingStudents = expectedStudents.filter(s => !importedStudentIds.has(s.studentId))
      if (missingStudents.length > 0) {
        warnings.push(
          `Thiếu ${missingStudents.length} học sinh trong file Excel: ${missingStudents.map(s => s.studentId).join(', ')}`
        )
      }
      
      // Find extra students
      const extraStudents = validatedData.filter(d => !expectedStudentIds.has(d.studentId))
      if (extraStudents.length > 0) {
        warnings.push(
          `Có ${extraStudents.length} học sinh không thuộc lớp: ${extraStudents.map(s => s.studentId).join(', ')}`
        )
      }
    }

    return {
      success: errors.filter(e => e.severity === 'error').length === 0,
      data: validatedData,
      statistics,
      errors,
      warnings
    }

  } catch (error) {
    console.error('Error validating Excel import:', error)
    
    return {
      success: false,
      statistics,
      errors: [{
        rowNumber: 0,
        field: 'file',
        value: file.name,
        message: error instanceof Error ? error.message : 'Lỗi không xác định khi xử lý file',
        severity: 'error'
      }],
      warnings
    }
  }
}
