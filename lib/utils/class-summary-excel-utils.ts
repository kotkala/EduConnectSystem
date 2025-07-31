import * as XLSX from 'xlsx'

export interface ClassSummaryData {
  className: string
  academicYear: string
  semester: string
  homeroomTeacher: string
  students: StudentGradeData[]
}

export interface StudentGradeData {
  studentId: string
  studentName: string
  studentCode: string
  subjects: SubjectGradeData[]
  averageGrade?: number
  rank?: number
}

export interface SubjectGradeData {
  subjectName: string
  midtermGrade?: number
  finalGrade?: number
  averageGrade?: number
}

// Create Excel file for class grade summary
export function createClassSummaryExcel(data: ClassSummaryData): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  
  // Create main worksheet
  const worksheetData: (string | number)[][] = []
  
  // Header rows
  worksheetData.push([
    `BẢNG ĐIỂM TỔNG HỢP LỚP ${data.className}`,
    '', '', '', '', '', '', '', '', ''
  ])
  worksheetData.push([
    `Năm học: ${data.academicYear} - ${data.semester}`,
    '', '', '', '', '', '', '', '', ''
  ])
  worksheetData.push([
    `Giáo viên chủ nhiệm: ${data.homeroomTeacher}`,
    '', '', '', '', '', '', '', '', ''
  ])
  worksheetData.push([
    `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
    '', '', '', '', '', '', '', '', ''
  ])
  worksheetData.push([]) // Empty row
  
  // Get all unique subjects
  const allSubjects = new Set<string>()
  data.students.forEach(student => {
    student.subjects.forEach(subject => {
      allSubjects.add(subject.subjectName)
    })
  })
  const subjectList = Array.from(allSubjects).sort()
  
  // Column headers
  const headers = [
    'STT',
    'Mã HS',
    'Họ và tên',
    ...subjectList.map(subject => `${subject} (TB)`),
    'Điểm TB',
    'Xếp hạng'
  ]
  
  worksheetData.push(headers)
  
  // Student rows
  data.students.forEach((student, index) => {
    const row: (string | number)[] = [
      index + 1,
      student.studentCode,
      student.studentName
    ]
    
    // Add subject grades
    subjectList.forEach(subjectName => {
      const subjectGrade = student.subjects.find(s => s.subjectName === subjectName)
      if (subjectGrade && subjectGrade.averageGrade !== undefined) {
        row.push(subjectGrade.averageGrade)
      } else {
        row.push('')
      }
    })
    
    // Add overall average and rank
    row.push(student.averageGrade || '')
    row.push(student.rank || '')
    
    worksheetData.push(row)
  })
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  
  // Set column widths
  const columnWidths = [
    { wch: 5 },  // STT
    { wch: 12 }, // Mã HS
    { wch: 25 }, // Họ và tên
    ...subjectList.map(() => ({ wch: 12 })), // Subject columns
    { wch: 12 }, // Điểm TB
    { wch: 10 }  // Xếp hạng
  ]
  
  worksheet['!cols'] = columnWidths
  
  // Merge header cells
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Academic year
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }, // Teacher
    { s: { r: 3, c: 0 }, e: { r: 3, c: headers.length - 1 } }  // Date
  ]
  
  // Apply styles
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  
  // Style header rows (0-4)
  for (let R = 0; R <= 4; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      if (!worksheet[cellAddress]) continue
      
      if (R === 0) {
        // Title row
        worksheet[cellAddress].s = {
          font: { bold: true, size: 16 },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'E3F2FD' } }
        }
      } else if (R >= 1 && R <= 3) {
        // Info rows
        worksheet[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'left', vertical: 'center' },
          fill: { fgColor: { rgb: 'F5F5F5' } }
        }
      } else if (R === 5) {
        // Column headers
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
      }
    }
  }
  
  // Style data rows
  for (let R = 6; R <= range.e.r; R++) {
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
      
      // Left align name column
      if (C === 2) {
        worksheet[cellAddress].s.alignment.horizontal = 'left'
      }
    }
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng điểm tổng hợp')
  
  // Create individual sheets for each student
  data.students.forEach((student, index) => {
    if (index >= 10) return // Limit to first 10 students to avoid too many sheets
    
    const studentWorksheetData: (string | number)[][] = []
    
    // Student header
    studentWorksheetData.push([
      `BẢNG ĐIỂM CÁ NHÂN`,
      '', '', '', ''
    ])
    studentWorksheetData.push([
      `Học sinh: ${student.studentName} (${student.studentCode})`,
      '', '', '', ''
    ])
    studentWorksheetData.push([
      `Lớp: ${data.className}`,
      '', '', '', ''
    ])
    studentWorksheetData.push([
      `Năm học: ${data.academicYear} - ${data.semester}`,
      '', '', '', ''
    ])
    studentWorksheetData.push([]) // Empty row
    
    // Subject headers
    studentWorksheetData.push([
      'STT',
      'Môn học',
      'Điểm giữa kì',
      'Điểm cuối kì',
      'Điểm trung bình'
    ])
    
    // Subject rows
    student.subjects.forEach((subject, subjectIndex) => {
      studentWorksheetData.push([
        subjectIndex + 1,
        subject.subjectName,
        subject.midtermGrade || '',
        subject.finalGrade || '',
        subject.averageGrade || ''
      ])
    })
    
    // Overall average
    studentWorksheetData.push([])
    studentWorksheetData.push([
      '',
      'ĐIỂM TRUNG BÌNH TỔNG KẾT',
      '',
      '',
      student.averageGrade || ''
    ])
    studentWorksheetData.push([
      '',
      'XẾP HẠNG LỚP',
      '',
      '',
      student.rank || ''
    ])
    
    const studentWorksheet = XLSX.utils.aoa_to_sheet(studentWorksheetData)
    studentWorksheet['!cols'] = [
      { wch: 5 },  // STT
      { wch: 25 }, // Môn học
      { wch: 15 }, // Điểm giữa kì
      { wch: 15 }, // Điểm cuối kì
      { wch: 18 }  // Điểm trung bình
    ]
    
    const sheetName = `${student.studentCode}_${student.studentName}`.substring(0, 31) // Excel sheet name limit
    XLSX.utils.book_append_sheet(workbook, studentWorksheet, sheetName)
  })
  
  // Convert to array buffer
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
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
