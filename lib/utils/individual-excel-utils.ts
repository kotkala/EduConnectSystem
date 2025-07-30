import * as XLSX from 'xlsx'

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

// Create Excel template for individual student grades
export function createIndividualGradeTemplate(data: IndividualGradeExportData): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  
  // Create main worksheet
  const worksheetData: (string | number)[][] = []
  
  // Header rows
  worksheetData.push([
    `BẢNG ĐIỂM CÁ NHÂN`,
    '', '', '', ''
  ])
  worksheetData.push([
    `Học sinh: ${data.student.full_name} (${data.student.student_id})`,
    '', '', '', ''
  ])
  worksheetData.push([
    `Lớp: ${data.className}`,
    '', '', '', ''
  ])
  worksheetData.push([
    `Năm học: ${data.academicYear} - ${data.semester}`,
    '', '', '', ''
  ])
  worksheetData.push([]) // Empty row
  
  // Column headers
  const headers = [
    'STT',
    'Môn học',
    'Điểm giữa kì',
    'Điểm cuối kì',
    'Ghi chú'
  ]

  worksheetData.push(headers)

  // Add a separator row to make it clear where data starts
  worksheetData.push(['---', '--- NHẬP ĐIỂM TỪ DÒNG NÀY ---', '---', '---', '---'])
  
  // Subject rows
  data.subjects.forEach((subject, index) => {
    const row = [
      index + 1,
      subject.name_vietnamese,
      '', // Điểm giữa kì - để trống cho admin điền
      '', // Điểm cuối kì - để trống cho admin điền
      ''  // Ghi chú - để trống cho admin điền
    ]
    worksheetData.push(row)
  })
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  
  // Set column widths
  const columnWidths = [
    { wch: 5 },  // STT
    { wch: 30 }, // Môn học
    { wch: 15 }, // Điểm giữa kì
    { wch: 15 }, // Điểm cuối kì
    { wch: 25 }  // Ghi chú
  ]
  
  worksheet['!cols'] = columnWidths
  
  // Merge header cells
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Student info
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Class
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }  // Academic year
  ]
  
  // Apply styles to make table more readable
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  
  // Style header rows (0-6)
  for (let R = 0; R <= 6; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      if (!worksheet[cellAddress]) continue

      if (R === 0) {
        // Title row - bold and centered
        worksheet[cellAddress].s = {
          font: { bold: true, size: 14 },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'E3F2FD' } }
        }
      } else if (R >= 1 && R <= 3) {
        // Info rows - bold
        worksheet[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'left', vertical: 'center' },
          fill: { fgColor: { rgb: 'F5F5F5' } }
        }
      } else if (R === 5) {
        // Column headers - bold and centered
        worksheet[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'BBDEFB' } },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      } else if (R === 6) {
        // Separator row - italic and centered
        worksheet[cellAddress].s = {
          font: { italic: true, color: { rgb: '666666' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'FFFACD' } }
        }
      }
    }
  }
  
  // Style data rows with borders
  for (let R = 7; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' }
      }
      
      worksheet[cellAddress].s = {
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
      
      // Left align subject name column
      if (C === 1) {
        worksheet[cellAddress].s.alignment.horizontal = 'left'
      }
    }
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng điểm')
  
  // Create instructions sheet
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
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Hướng dẫn')
  
  // Convert to array buffer
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

// Parse Excel file and extract individual grade data
export function parseIndividualGradeExcel(file: ArrayBuffer, expectedSubjects: SubjectInfo[]): {
  success: boolean
  data?: IndividualGradeData[]
  errors?: string[]
} {
  try {
    const workbook = XLSX.read(file, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    
    if (!worksheet) {
      return {
        success: false,
        errors: ['Không tìm thấy worksheet trong file Excel']
      }
    }
    
    // Convert to JSON, starting from row 8 (after headers, column titles, and separator)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      range: 7, // Start from row 8 (0-indexed) to skip headers, column titles, and separator
      header: 1,
      defval: ''
    }) as Record<string, string | number>[]
    
    const gradeData: IndividualGradeData[] = []
    const errors: string[] = []

    // Debug: Log the raw data to understand the structure
    console.log('Raw Excel data:', jsonData.slice(0, 5)) // Log first 5 rows for debugging
    console.log('Expected subjects:', expectedSubjects.map(s => s.name_vietnamese))

    // Process each subject row
    jsonData.forEach((row, rowIndex) => {
      const actualRowNumber = rowIndex + 9 // Adjust for header rows (now starting from row 8)

      if (!row[1]) { // Skip empty rows (no subject name)
        return
      }

      const subjectName = String(row[1]).trim()

      // Skip header row, separator row, or invalid rows
      if (subjectName === 'Môn học' ||
          subjectName === 'STT' ||
          subjectName === '' ||
          subjectName.includes('---') ||
          subjectName.includes('NHẬP ĐIỂM') ||
          !isNaN(Number(subjectName))) {
        return
      }

      // Skip rows where column 1 is just a number (STT column)
      if (!isNaN(Number(row[0])) && subjectName.length < 3) {
        return
      }

      const midtermGrade = parseFloat(String(row[2] || '')) || undefined
      const finalGrade = parseFloat(String(row[3] || '')) || undefined
      const notes = String(row[4] || '').trim() || undefined

      // Find subject by name
      const subject = expectedSubjects.find(s => s.name_vietnamese === subjectName)
      if (!subject) {
        // Add more detailed error message with available subjects for debugging
        const availableSubjects = expectedSubjects.map(s => s.name_vietnamese).join(', ')
        errors.push(`Dòng ${actualRowNumber}: Không tìm thấy môn học "${subjectName}". Các môn học có sẵn: ${availableSubjects}`)
        return
      }
      
      // Validate grades
      if (midtermGrade !== undefined && (midtermGrade < 0 || midtermGrade > 10)) {
        errors.push(`Dòng ${actualRowNumber}, ${subjectName}: Điểm giữa kì phải từ 0 đến 10`)
      }
      
      if (finalGrade !== undefined && (finalGrade < 0 || finalGrade > 10)) {
        errors.push(`Dòng ${actualRowNumber}, ${subjectName}: Điểm cuối kì phải từ 0 đến 10`)
      }
      
      // Add grade data if any grade is provided
      if (midtermGrade !== undefined || finalGrade !== undefined || notes) {
        gradeData.push({
          subject_id: subject.id,
          subject_name: subjectName,
          midterm_grade: midtermGrade,
          final_grade: finalGrade,
          notes: notes
        })
      }
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
