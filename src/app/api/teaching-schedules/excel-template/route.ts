import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const academic_year_id = searchParams.get('academic_year_id')
    const academic_term_id = searchParams.get('academic_term_id')
    const week_number = searchParams.get('week_number') || '1'
    const class_type = searchParams.get('class_type') || 'all' // 'base', 'combined', 'all'
    const class_id = searchParams.get('class_id')

    if (!academic_year_id || !academic_term_id) {
      return NextResponse.json({ 
        error: 'academic_year_id and academic_term_id are required' 
      }, { status: 400 })
    }

    // Get academic term info
    const { data: termData, error: termError } = await supabase
      .from('academic_terms')
      .select('*, academic_year:academic_years!academic_year_id(*)')
      .eq('id', academic_term_id)
      .single()

    if (termError || !termData) {
      return NextResponse.json({ error: 'Academic term not found' }, { status: 404 })
    }

    // Get classes based on type
    let classesQuery = supabase
      .from('classes')
      .select(`
        *,
        grade_level:grade_levels!grade_level_id(*)
      `)
      .eq('academic_year_id', academic_year_id)
      .order('name')

    if (class_type === 'base') {
      classesQuery = classesQuery.eq('is_combined', false)
    } else if (class_type === 'combined') {
      classesQuery = classesQuery.eq('is_combined', true)
    }

    if (class_id) {
      classesQuery = classesQuery.eq('id', class_id)
    }

    const { data: classes, error: classesError } = await classesQuery

    if (classesError) {
      return NextResponse.json({ error: classesError.message }, { status: 500 })
    }

    // Get teacher assignments for this term to create proper dropdown options
    const { data: teacherAssignments, error: assignmentsError } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        teacher:users!teacher_id(*),
        subject:subjects!subject_id(*),
        class:classes!class_id(*)
      `)
      .eq('academic_term_id', academic_term_id)
      .eq('is_active', true)

    if (assignmentsError) {
      return NextResponse.json({ error: assignmentsError.message }, { status: 500 })
    }

    // Create teacher-subject combinations grouped by class
    const teacherSubjectMap = new Map<string, Array<{
      teacher_id: string
      teacher_name: string
      subject_id: string
      subject_name: string
      class_id: string
    }>>()

    teacherAssignments?.forEach(assignment => {
      const key = assignment.class_id
      if (!teacherSubjectMap.has(key)) {
        teacherSubjectMap.set(key, [])
      }
      teacherSubjectMap.get(key)?.push({
        teacher_id: assignment.teacher_id,
        teacher_name: assignment.teacher.full_name,
        subject_id: assignment.subject_id,
        subject_name: assignment.subject.name,
        class_id: assignment.class_id
      })
    })

    // Also get all teachers and subjects for fallback options
    const { data: allTeachers, error: teachersError } = await supabase
      .from('users')
      .select('id, full_name')
      .in('role', ['subject_teacher', 'homeroom_teacher', 'school_administrator'])
      .eq('status', 'active')

    if (teachersError) {
      return NextResponse.json({ error: teachersError.message }, { status: 500 })
    }

    const { data: allSubjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name, code')
      .order('name')

    if (subjectsError) {
      return NextResponse.json({ error: subjectsError.message }, { status: 500 })
    }

    // Get time slots
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('*')
      .order('order_index')

    if (timeSlotsError) {
      return NextResponse.json({ error: timeSlotsError.message }, { status: 500 })
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    
    // Add metadata
    workbook.creator = 'EduConnect System'
    workbook.lastModifiedBy = 'EduConnect System'
    workbook.created = new Date()
    workbook.modified = new Date()

    // Create main timetable sheet
    const mainSheet = workbook.addWorksheet('Timetable')
    
    // Set up headers
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    const teachingTimeSlots = timeSlots.filter(ts => !ts.is_break)
    
    // Create header row
    const headerRow = ['Tiết học', ...days]
    mainSheet.addRow(headerRow)
    
    // Style header row
    const headerRowObj = mainSheet.getRow(1)
    headerRowObj.font = { bold: true }
    headerRowObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    }
    
    // Add time slot rows
    teachingTimeSlots.forEach((timeSlot, index) => {
      const row = mainSheet.addRow([
        `${timeSlot.name} (${timeSlot.start_time} - ${timeSlot.end_time})`,
        '', '', '', '', '', '' // Empty cells for each day
      ])
      
      // Style time slot column
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      }
    })

    // Set column widths
    mainSheet.getColumn(1).width = 25
    for (let i = 2; i <= 7; i++) {
      mainSheet.getColumn(i).width = 30
    }

    // Add borders to all cells
    mainSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })

    // Create separate sheets for each class
    classes.forEach(classData => {
      const classSheet = workbook.addWorksheet(`${classData.name}`)
      
      // Add class information
      classSheet.addRow(['Thông tin lớp'])
      classSheet.addRow(['Tên lớp:', classData.name])
      classSheet.addRow(['Khối:', classData.grade_level.name])
      classSheet.addRow(['Loại lớp:', classData.is_combined ? 'Lớp ghép' : 'Lớp tách'])
      classSheet.addRow(['Năm học:', termData.academic_year.name])
      classSheet.addRow(['Học kỳ:', termData.name])
      classSheet.addRow(['Tuần:', week_number])
      classSheet.addRow([]) // Empty row
      
      // Create timetable structure
      const classHeaderRow = ['Tiết học', ...days]
      classSheet.addRow(classHeaderRow)
      
      // Style header
      const classHeaderRowObj = classSheet.getRow(9)
      classHeaderRowObj.font = { bold: true }
      classHeaderRowObj.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      }
      
      // Add time slot rows for this class
      teachingTimeSlots.forEach((timeSlot, timeIndex) => {
        const rowData = [`${timeSlot.name} (${timeSlot.start_time} - ${timeSlot.end_time})`]
        
        // Add cells for each day
        days.forEach((day, dayIndex) => {
          const dayOfWeek = dayIndex + 1 // Monday = 1, Saturday = 6
          
          // Skip first period Monday (flag ceremony) and last period Saturday (class activities)
          if ((dayOfWeek === 1 && timeIndex === 0) || (dayOfWeek === 6 && timeIndex === teachingTimeSlots.length - 1)) {
            rowData.push(dayOfWeek === 1 && timeIndex === 0 ? 'Chào cờ' : 'Sinh hoạt lớp')
          } else {
            // Add formula for dropdown (will be processed later)
            rowData.push(`TEACHER_DROPDOWN_${timeIndex}_${dayIndex}`)
          }
        })
        
        classSheet.addRow(rowData)
      })
      
      // Set column widths for class sheet
      classSheet.getColumn(1).width = 25
      for (let i = 2; i <= 7; i++) {
        classSheet.getColumn(i).width = 30
      }
      
      // Add borders
      classSheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 9) { // Only timetable rows
          row.eachCell((cell, colNumber) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            }
          })
        }
      })
      
      // Add data validation for teacher dropdowns
      teachingTimeSlots.forEach((timeSlot, timeIndex) => {
        days.forEach((day, dayIndex) => {
          const dayOfWeek = dayIndex + 1
          
          // Skip special slots
          if ((dayOfWeek === 1 && timeIndex === 0) || (dayOfWeek === 6 && timeIndex === teachingTimeSlots.length - 1)) {
            return
          }
          
          const rowNum = 10 + timeIndex // Starting from row 10
          const colNum = 2 + dayIndex // Starting from column B
          
          const cell = classSheet.getCell(rowNum, colNum)
          
          // Get teacher-subject combinations for this class
          const classTeacherSubjects = teacherSubjectMap.get(classData.id) || []
          
          // Create dropdown options with teacher-subject combinations
          const teacherSubjectOptions = ['', ...classTeacherSubjects.map(ts => 
            `${ts.teacher_name} - ${ts.subject_name} (${ts.teacher_id}|${ts.subject_id})`
          )]
          
          // If no specific assignments, fall back to all teachers with all subjects
          if (classTeacherSubjects.length === 0) {
            const fallbackOptions = ['']
            allTeachers?.forEach(teacher => {
              allSubjects?.forEach(subject => {
                fallbackOptions.push(`${teacher.full_name} - ${subject.name} (${teacher.id}|${subject.id})`)
              })
            })
            teacherSubjectOptions.splice(1, 0, ...fallbackOptions)
          }
          
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${teacherSubjectOptions.join(',')}"`],
            showErrorMessage: true,
            errorTitle: 'Lỗi',
            error: 'Vui lòng chọn giáo viên và môn học từ danh sách'
          }
          
          // Add comment with instructions
          cell.note = {
            texts: [
              { text: 'Chọn giáo viên và môn học từ dropdown, sau đó thêm phòng học:\n' },
              { text: 'Format: [Tên giáo viên] - [Môn học] (ID) - [Phòng học]\n' },
              { text: 'Ví dụ: Nguyễn Văn A - Toán (uuid|uuid) - A101\n' },
              { text: 'Hoặc chỉ nhập tên môn học: Toán\n' },
              { text: 'Hoặc nhập: Chào cờ / Sinh hoạt lớp cho các hoạt động đặc biệt' }
            ]
          }
        })
      })
    })

    // Create reference sheets
    const teachersSheet = workbook.addWorksheet('Danh sách giáo viên')
    teachersSheet.addRow(['ID', 'Họ tên', 'Chuyên môn'])
    allTeachers?.forEach(teacher => {
      teachersSheet.addRow([
        teacher.id,
        teacher.full_name,
        'Chưa xác định' // Since we don't have metadata in the simplified query
      ])
    })

    const subjectsSheet = workbook.addWorksheet('Danh sách môn học')
    subjectsSheet.addRow(['ID', 'Mã môn', 'Tên môn', 'Tín chỉ'])
    allSubjects?.forEach(subject => {
      subjectsSheet.addRow([
        subject.id,
        subject.code,
        subject.name,
        'N/A' // Since we don't have credits in the simplified query
      ])
    })

    const timeSlotsSheet = workbook.addWorksheet('Khung giờ học')
    timeSlotsSheet.addRow(['ID', 'Tên tiết', 'Giờ bắt đầu', 'Giờ kết thúc', 'Thứ tự', 'Là giờ nghỉ'])
    timeSlots.forEach(slot => {
      timeSlotsSheet.addRow([
        slot.id,
        slot.name,
        slot.start_time,
        slot.end_time,
        slot.order_index,
        slot.is_break ? 'Có' : 'Không'
      ])
    })

    // Create rooms reference sheet
    const roomsSheet = workbook.addWorksheet('Danh sách phòng học')
    roomsSheet.addRow(['Phòng học', 'Loại phòng', 'Sức chứa'])
    
    // Generate sample room data
    const sampleRooms = [
      ['A101', 'Phòng học thường', '40'],
      ['A102', 'Phòng học thường', '40'],
      ['A103', 'Phòng học thường', '40'],
      ['B101', 'Phòng học thường', '40'],
      ['B102', 'Phòng học thường', '40'],
      ['LAB1', 'Phòng thí nghiệm', '30'],
      ['LAB2', 'Phòng thí nghiệm', '30'],
      ['GYM', 'Phòng thể dục', '50'],
      ['MUSIC', 'Phòng âm nhạc', '35'],
      ['ART', 'Phòng mỹ thuật', '35']
    ]
    
    sampleRooms.forEach(room => {
      roomsSheet.addRow(room)
    })

    // Create instructions sheet
    const instructionsSheet = workbook.addWorksheet('Hướng dẫn sử dụng')
    instructionsSheet.addRow(['HƯỚNG DẪN NHẬP THỜI KHÓA BIỂU'])
    instructionsSheet.addRow([])
    instructionsSheet.addRow(['1. Cấu trúc file:'])
    instructionsSheet.addRow(['   - Sheet chính: Tổng quan thời khóa biểu'])
    instructionsSheet.addRow(['   - Sheet từng lớp: Chi tiết thời khóa biểu mỗi lớp'])
    instructionsSheet.addRow(['   - Sheet tham chiếu: Danh sách giáo viên, môn học, khung giờ, phòng học'])
    instructionsSheet.addRow([])
    instructionsSheet.addRow(['2. Cách nhập liệu:'])
    instructionsSheet.addRow(['   CÁCH 1: Chọn từ dropdown (khuyến nghị)'])
    instructionsSheet.addRow(['   - Chọn giáo viên và môn học từ dropdown'])
    instructionsSheet.addRow(['   - Thêm phòng học: [Lựa chọn dropdown] - [Phòng học]'])
    instructionsSheet.addRow(['   - Ví dụ: Nguyễn Văn A - Toán (uuid|uuid) - A101'])
    instructionsSheet.addRow([])
    instructionsSheet.addRow(['   CÁCH 2: Nhập trực tiếp'])
    instructionsSheet.addRow(['   - Chỉ nhập tên môn học: Toán'])
    instructionsSheet.addRow(['   - Nhập môn học với phòng: Toán - A101'])
    instructionsSheet.addRow(['   - Nhập đầy đủ: Nguyễn Văn A (ID) - Toán - A101'])
    instructionsSheet.addRow([])
    instructionsSheet.addRow(['3. Hoạt động đặc biệt:'])
    instructionsSheet.addRow(['   - Tiết 1 thứ 2: Nhập "Chào cờ"'])
    instructionsSheet.addRow(['   - Tiết cuối thứ 7: Nhập "Sinh hoạt lớp"'])
    instructionsSheet.addRow(['   - Các hoạt động khác: Nhập tên hoạt động'])
    instructionsSheet.addRow([])
    instructionsSheet.addRow(['4. Lưu ý:'])
    instructionsSheet.addRow(['   - Mỗi ô có thể để trống nếu không có tiết học'])
    instructionsSheet.addRow(['   - Hệ thống sẽ tự động tìm môn học nếu không có trong dropdown'])
    instructionsSheet.addRow(['   - Phòng học có thể tham khảo từ sheet "Danh sách phòng học"'])
    instructionsSheet.addRow([])
    instructionsSheet.addRow(['5. Sau khi hoàn thành:'])
    instructionsSheet.addRow(['   - Lưu file Excel'])
    instructionsSheet.addRow(['   - Upload lại vào hệ thống'])
    instructionsSheet.addRow(['   - Hệ thống sẽ tự động xử lý và tạo thời khóa biểu'])

    // Style instructions sheet
    instructionsSheet.getColumn(1).width = 80
    instructionsSheet.getRow(1).font = { bold: true, size: 16 }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Create filename with ASCII-safe characters
    const sanitizeFilename = (str: string) => {
      return str
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim()
    }
    
    const safeAcademicYear = sanitizeFilename(termData.academic_year.name)
    const safeTerm = sanitizeFilename(termData.name)
    const filename = `timetable_template_${safeAcademicYear}_${safeTerm}_week${week_number}_${class_type}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Error generating Excel template:', error)
    return NextResponse.json({ 
      error: 'Failed to generate Excel template' 
    }, { status: 500 })
  }
} 