import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

interface AutoTableOptions {
  head?: string[][]
  body?: string[][]
  startY?: number
  theme?: string
  styles?: Record<string, unknown>
  headStyles?: Record<string, unknown>
  columnStyles?: Record<string, Record<string, unknown>>
  didParseCell?: (data: CellData) => void
  margin?: Record<string, number>
  tableWidth?: string | number
}

interface CellData {
  section: string
  column: { index: number }
  cell: {
    text: string[]
    styles: {
      fillColor?: number[] | string
      textColor?: number[] | string
      [key: string]: unknown
    }
  }
}

export interface GradeExportData {
  studentId: string
  studentName: string
  regularGrades: (number | null)[]
  midtermGrade?: number | null
  finalGrade?: number | null
  summaryGrade?: number | null
  calculatedAverage?: number | null
  lastModified?: string
  modifiedBy?: string
}

export interface GradeExportOptions {
  className: string
  subjectName: string
  subjectCode?: string
  periodName: string
  academicYear?: string
  semester?: string
  teacherName?: string
  schoolName?: string
  exportDate?: Date
  includeFormula?: boolean
}

// Vietnamese grade calculation formula
export const calculateVietnameseAverage = (student: GradeExportData): number | null => {
  const regularGrades = student.regularGrades.filter((g): g is number => g !== null)
  const midtermGrade = student.midtermGrade
  const finalGrade = student.finalGrade
  
  // Need at least midterm and final grades for calculation
  if (midtermGrade === null || midtermGrade === undefined || 
      finalGrade === null || finalGrade === undefined) {
    return null
  }
  
  // Vietnamese formula: ĐTBmhk = (Tổng điểm thường xuyên + 2 x Điểm giữa kỳ + 3 x Điểm cuối kỳ) / (Số bài thường xuyên + 5)
  const regularSum = regularGrades.reduce((sum, grade) => sum + grade, 0)
  const regularCount = regularGrades.length
  const totalScore = regularSum + (2 * midtermGrade) + (3 * finalGrade)
  const totalWeight = regularCount + 5
  
  return Math.round((totalScore / totalWeight) * 10) / 10
}

export const generateGradePDF = (
  data: GradeExportData[],
  options: GradeExportOptions
): jsPDF => {
  const doc = new jsPDF('l', 'mm', 'a4') // Landscape orientation for better table fit

  // Set up fonts and colors
  doc.setFont('helvetica', 'normal')
  
  // Header information
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  
  // School header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const schoolName = options.schoolName || 'TRƯỜNG TRUNG HỌC PHỔ THÔNG'
  doc.text(schoolName, pageWidth / 2, 20, { align: 'center' })
  
  // Title
  doc.setFontSize(14)
  doc.text('BẢNG ĐIỂM CHI TIẾT', pageWidth / 2, 30, { align: 'center' })
  
  // Class and subject info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Lớp: ${options.className}`, margin, 45)
  doc.text(`Môn học: ${options.subjectName}`, margin, 52)
  doc.text(`Kỳ: ${options.periodName}`, margin, 59)
  
  // Right side info
  const rightX = pageWidth - margin
  if (options.academicYear) {
    doc.text(`Năm học: ${options.academicYear}`, rightX, 45, { align: 'right' })
  }
  if (options.semester) {
    doc.text(`Học kỳ: ${options.semester}`, rightX, 52, { align: 'right' })
  }
  if (options.teacherName) {
    doc.text(`Giáo viên: ${options.teacherName}`, rightX, 59, { align: 'right' })
  }
  
  // Export date
  const exportDate = options.exportDate || new Date()
  doc.text(`Ngày xuất: ${exportDate.toLocaleDateString('vi-VN')}`, rightX, 66, { align: 'right' })
  
  // Formula explanation (if requested)
  let startY = 75
  if (options.includeFormula) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('Công thức tính điểm trung bình môn học kỳ:', margin, startY)
    doc.text('ĐTBmhk = (Tổng điểm thường xuyên + 2 × Điểm giữa kỳ + 3 × Điểm cuối kỳ) / (Số bài thường xuyên + 5)', margin, startY + 5)
    doc.text('Hệ số: Thường xuyên (1) • Giữa kỳ (2) • Cuối kỳ (3)', margin, startY + 10)
    startY += 20
  }
  
  // Prepare table data
  const tableHeaders = [
    'STT',
    'Họ và tên',
    'TX1',
    'TX2', 
    'TX3',
    'TX4',
    'Giữa kỳ',
    'Cuối kỳ',
    'Tổng kết',
    'Thời gian nhập'
  ]
  
  const tableData = data.map((student, index) => {
    // Calculate Vietnamese average if summary grade not available
    const calculatedAverage = student.summaryGrade || calculateVietnameseAverage(student)
    
    return [
      (index + 1).toString(),
      student.studentName,
      student.regularGrades[0]?.toString() || '-',
      student.regularGrades[1]?.toString() || '-',
      student.regularGrades[2]?.toString() || '-',
      student.regularGrades[3]?.toString() || '-',
      student.midtermGrade?.toString() || '-',
      student.finalGrade?.toString() || '-',
      calculatedAverage?.toString() || '-',
      student.lastModified ? new Date(student.lastModified).toLocaleDateString('vi-VN') : '-'
    ]
  })
  
  // Generate table using autoTable function
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: startY,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [41, 128, 185], // Blue header
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 15 }, // STT
      1: { cellWidth: 45, halign: 'left' }, // Name
      2: { cellWidth: 20 }, // TX1
      3: { cellWidth: 20 }, // TX2
      4: { cellWidth: 20 }, // TX3
      5: { cellWidth: 20 }, // TX4
      6: { cellWidth: 25 }, // Midterm
      7: { cellWidth: 25 }, // Final
      8: { cellWidth: 25, fontStyle: 'bold' }, // Summary
      9: { cellWidth: 35, fontSize: 8 } // Date
    },
    // Remove complex cell styling for now to fix build issues
    margin: { left: margin, right: margin },
    tableWidth: 'auto'
  })
  
  // Footer with statistics
  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Calculate statistics
  const totalStudents = data.length
  const studentsWithGrades = data.filter(s => 
    s.regularGrades.some(g => g !== null) || 
    s.midtermGrade !== null || 
    s.finalGrade !== null
  ).length
  
  const allGrades = data.flatMap(s => [
    ...s.regularGrades.filter(g => g !== null),
    ...(s.midtermGrade !== null ? [s.midtermGrade] : []),
    ...(s.finalGrade !== null ? [s.finalGrade] : [])
  ]) as number[]
  
  const averageGrade = allGrades.length > 0 
    ? Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) / 10
    : null
  
  doc.text(`Tổng số học sinh: ${totalStudents}`, margin, finalY)
  doc.text(`Học sinh có điểm: ${studentsWithGrades}`, margin, finalY + 7)
  doc.text(`Điểm trung bình lớp: ${averageGrade ?? 'N/A'}`, margin, finalY + 14)
  
  // Signature area
  doc.text('Giáo viên bộ môn', pageWidth - 80, finalY + 7)
  doc.text('(Ký và ghi rõ họ tên)', pageWidth - 80, finalY + 14)
  
  return doc
}

export const downloadGradePDF = (
  data: GradeExportData[],
  options: GradeExportOptions
): void => {
  const doc = generateGradePDF(data, options)
  const fileName = `BangDiem_${options.className}_${options.subjectName}_${options.periodName}.pdf`
    .replace(/\s+/g, '_')
    .replace(/[^\w\-.]/g, '')
  
  doc.save(fileName)
}
