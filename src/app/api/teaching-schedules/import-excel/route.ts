import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface ImportedSchedule {
  class_id: string
  teacher_id?: string
  subject_id?: string
  day_of_week: number
  time_slot_id: string
  week_number: number
  room_number?: string
  notes?: string
  is_special_activity?: boolean
}

interface ImportResult {
  success: boolean
  class_name: string
  schedules_created: number
  errors: string[]
  warnings: string[]
}

function parseTeacherCell(cellValue: string): { teacher_id?: string, subject_id?: string, subject_name?: string, room_number?: string } {
  if (!cellValue || cellValue.trim() === '') {
    return {}
  }

  const cleanValue = cellValue.trim()
  
  // Handle special activities
  if (cleanValue === 'Chào cờ' || cleanValue === 'Sinh hoạt lớp') {
    return {}
  }

  // Parse format: "Teacher Name - Subject Name (teacher_id|subject_id) - Room"
  const newFormatMatch = cleanValue.match(/^(.+?)\s*-\s*(.+?)\s*\(([^|]+)\|([^)]+)\)\s*(?:-\s*(.+?))?$/)
  if (newFormatMatch) {
    return {
      teacher_id: newFormatMatch[3].trim(),
      subject_id: newFormatMatch[4].trim(),
      subject_name: newFormatMatch[2].trim(),
      room_number: newFormatMatch[5]?.trim()
    }
  }

  // Parse format: "Teacher Name - Subject Name (teacher_id|subject_id)"
  const newFormatMatch2 = cleanValue.match(/^(.+?)\s*-\s*(.+?)\s*\(([^|]+)\|([^)]+)\)$/)
  if (newFormatMatch2) {
    return {
      teacher_id: newFormatMatch2[3].trim(),
      subject_id: newFormatMatch2[4].trim(),
      subject_name: newFormatMatch2[2].trim()
    }
  }

  // Parse old format: "Teacher Name (teacher_id) - Subject - Room"
  const parts = cleanValue.split(' - ')
  if (parts.length >= 2) {
    const teacherPart = parts[0].trim()
    const subjectPart = parts[1].trim()
    const roomPart = parts[2]?.trim()

    const teacherMatch = teacherPart.match(/^(.+)\s*\(([^)]+)\)$/)
    if (teacherMatch) {
      return {
        teacher_id: teacherMatch[2].trim(),
        subject_name: subjectPart,
        room_number: roomPart
      }
    }
  }

  // If no specific format matches, treat entire value as subject name
  return {
    subject_name: cleanValue
  }
}

async function findSubjectByName(supabase: any, subjectName: string): Promise<string | null> {
  if (!subjectName || subjectName.trim() === '') {
    return null
  }

  const cleanSubjectName = subjectName.trim()
  
  // First try exact match
  const { data: exactMatch, error: exactError } = await supabase
    .from('subjects')
    .select('id, name, code')
    .or(`name.eq.${cleanSubjectName},code.eq.${cleanSubjectName}`)
    .limit(1)

  if (!exactError && exactMatch && exactMatch.length > 0) {
    return exactMatch[0].id
  }

  // Then try case-insensitive match
  const { data: caseInsensitive, error: caseError } = await supabase
    .from('subjects')
    .select('id, name, code')
    .or(`name.ilike.${cleanSubjectName},code.ilike.${cleanSubjectName}`)
    .limit(1)

  if (!caseError && caseInsensitive && caseInsensitive.length > 0) {
    return caseInsensitive[0].id
  }

  // Finally try partial match
  const { data: partialMatch, error: partialError } = await supabase
    .from('subjects')
    .select('id, name, code')
    .or(`name.ilike.%${cleanSubjectName}%,code.ilike.%${cleanSubjectName}%`)
    .limit(1)

  if (!partialError && partialMatch && partialMatch.length > 0) {
    return partialMatch[0].id
  }

  return null
}

async function validateTeacherAssignment(
  supabase: any, 
  teacher_id: string, 
  class_id: string, 
  subject_id: string, 
  academic_term_id: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('teacher_id', teacher_id)
    .eq('class_id', class_id)
    .eq('subject_id', subject_id)
    .eq('academic_term_id', academic_term_id)
    .eq('is_active', true)
    .single()

  return !error && data
}

async function checkScheduleConflicts(
  supabase: any,
  teacher_id: string,
  class_id: string,
  day_of_week: number,
  time_slot_id: string,
  academic_term_id: string
): Promise<string[]> {
  const conflicts: string[] = []

  // Check teacher conflict
  const { data: teacherConflict } = await supabase
    .from('teaching_schedules')
    .select('id, class:classes!class_id(name)')
    .eq('teacher_id', teacher_id)
    .eq('day_of_week', day_of_week)
    .eq('time_slot_id', time_slot_id)
    .eq('academic_term_id', academic_term_id)
    .eq('is_active', true)
    .single()

  if (teacherConflict) {
    conflicts.push(`Giáo viên đã có lịch dạy lớp ${teacherConflict.class.name} vào thời gian này`)
  }

  // Check class conflict
  const { data: classConflict } = await supabase
    .from('teaching_schedules')
    .select('id, teacher:users!teacher_id(full_name)')
    .eq('class_id', class_id)
    .eq('day_of_week', day_of_week)
    .eq('time_slot_id', time_slot_id)
    .eq('academic_term_id', academic_term_id)
    .eq('is_active', true)
    .single()

  if (classConflict) {
    conflicts.push(`Lớp đã có tiết học với giáo viên ${classConflict.teacher.full_name} vào thời gian này`)
  }

  return conflicts
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const academic_term_id = formData.get('academic_term_id') as string
    const week_number = formData.get('week_number') as string || '1'
    const replace_existing = formData.get('replace_existing') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!academic_term_id) {
      return NextResponse.json({ error: 'Academic term ID is required' }, { status: 400 })
    }

    // Get academic term info
    const { data: termData, error: termError } = await supabase
      .from('academic_terms')
      .select('*')
      .eq('id', academic_term_id)
      .single()

    if (termError || !termData) {
      return NextResponse.json({ error: 'Academic term not found' }, { status: 404 })
    }

    // Get time slots for mapping
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('*')
      .order('order_index')

    if (timeSlotsError) {
      return NextResponse.json({ error: 'Failed to load time slots' }, { status: 500 })
    }

    const teachingTimeSlots = timeSlots.filter(ts => !ts.is_break)

    // Load Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const results: ImportResult[] = []
    const allSchedulesToCreate: ImportedSchedule[] = []

    // Process each class sheet (skip reference sheets)
    for (const worksheet of workbook.worksheets) {
      if (['Timetable', 'Danh sách giáo viên', 'Danh sách môn học', 'Khung giờ học', 'Hướng dẫn sử dụng'].includes(worksheet.name)) {
        continue
      }

      const className = worksheet.name
      const errors: string[] = []
      const warnings: string[] = []
      const classSchedules: ImportedSchedule[] = []

      try {
        // Find class by name
        let { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('name', className)
          .single()

        // If not found, create a default class
        if (classError || !classData) {
          // Get academic_year_id from termData
          const academic_year_id = termData.academic_year_id
          // Get the lowest grade level
          const { data: gradeLevels, error: gradeLevelError } = await supabase
            .from('grade_levels')
            .select('id, level')
            .order('level', { ascending: true })
            .limit(1)
          let grade_level_id = null
          if (!gradeLevelError && gradeLevels && gradeLevels.length > 0) {
            grade_level_id = gradeLevels[0].id
          }
          // Generate a code from the class name (remove spaces, add a number if needed)
          let baseCode = className.replace(/\s+/g, '').toUpperCase()
          let code = baseCode
          // Ensure code is unique
          let codeExists = true
          let codeIndex = 1
          while (codeExists) {
            const { data: codeCheck } = await supabase
              .from('classes')
              .select('id')
              .eq('code', code)
              .eq('academic_year_id', academic_year_id)
              .maybeSingle()
            if (!codeCheck) {
              codeExists = false
            } else {
              code = `${baseCode}${++codeIndex}`
            }
          }
          // Only create if we have academic_year_id and grade_level_id
          if (academic_year_id && grade_level_id) {
            const { data: createdClass, error: createError } = await supabase
              .from('classes')
              .insert({
                academic_year_id,
                grade_level_id,
                name: className,
                code,
                capacity: 30,
                is_combined: false,
                metadata: { created_by_import: true },
                created_by: user.id
              })
              .select('*')
              .single()
            if (createError || !createdClass) {
              errors.push(`Không tìm thấy lớp ${className} và không thể tự động tạo lớp: ${createError?.message || 'Unknown error'}`)
              results.push({
                success: false,
                class_name: className,
                schedules_created: 0,
                errors,
                warnings
              })
              continue
            } else {
              classData = createdClass
            }
          } else {
            errors.push(`Không tìm thấy lớp ${className} và không thể xác định năm học hoặc khối lớp để tạo lớp mới.`)
          results.push({
            success: false,
            class_name: className,
            schedules_created: 0,
            errors,
            warnings
          })
          continue
          }
        }

        // Add a counter for room numbers for this class
        let roomCounter = 1;
        // Process timetable starting from row 10 (after class info and header)
        const startRow = 10
        const maxRow = startRow + teachingTimeSlots.length - 1

        for (let rowIndex = startRow; rowIndex <= maxRow; rowIndex++) {
          const row = worksheet.getRow(rowIndex)
          const timeSlotIndex = rowIndex - startRow
          const timeSlot = teachingTimeSlots[timeSlotIndex]

          if (!timeSlot) continue

          // Process each day (columns 2-7 for Monday-Saturday)
          for (let colIndex = 2; colIndex <= 7; colIndex++) {
            const dayOfWeek = colIndex - 1 // Monday = 1, Saturday = 6
            const cell = row.getCell(colIndex)
            const cellValue = cell.value?.toString() || ''

            // Skip empty cells
            if (!cellValue.trim()) continue

            // Handle special activities
            if (cellValue === 'Chào cờ' || cellValue === 'Sinh hoạt lớp') {
              classSchedules.push({
                class_id: classData.id,
                day_of_week: dayOfWeek,
                time_slot_id: timeSlot.id,
                week_number: parseInt(week_number),
                notes: cellValue,
                is_special_activity: true,
                room_number: `P${roomCounter++}`
              })
              continue
            }

            // Parse teacher/subject/room information
            const parsed = parseTeacherCell(cellValue)
            
            if (!parsed.teacher_id && !parsed.subject_name) {
              warnings.push(`Dòng ${rowIndex}, cột ${colIndex}: Không thể phân tích "${cellValue}"`)
              continue
            }

            // Get subject ID - use parsed subject_id if available, otherwise find by name
            let subject_id: string | undefined = parsed.subject_id
            if (!subject_id && parsed.subject_name) {
              const foundSubjectId = await findSubjectByName(supabase, parsed.subject_name)
              if (foundSubjectId) {
                subject_id = foundSubjectId
              } else {
                warnings.push(`Dòng ${rowIndex}, cột ${colIndex}: Không tìm thấy môn học "${parsed.subject_name}". Vui lòng kiểm tra tên môn học hoặc thêm môn học vào hệ thống.`)
                // Continue processing without subject_id - this will create a schedule with notes only
              }
            }

            // If we have teacher but no subject, skip this entry
            if (parsed.teacher_id && !subject_id) {
              warnings.push(`Dòng ${rowIndex}, cột ${colIndex}: Bỏ qua do không xác định được môn học cho giáo viên`)
              continue
            }

            // Validate teacher assignment if teacher is specified
            if (parsed.teacher_id && subject_id) {
              const hasAssignment = await validateTeacherAssignment(
                supabase,
                parsed.teacher_id,
                classData.id,
                subject_id,
                academic_term_id
              )

              if (!hasAssignment) {
                warnings.push(`Dòng ${rowIndex}, cột ${colIndex}: Giáo viên chưa được phân công dạy môn này cho lớp ${className}`)
              }
            }

            // Check for conflicts
            if (parsed.teacher_id) {
              const conflicts = await checkScheduleConflicts(
                supabase,
                parsed.teacher_id,
                classData.id,
                dayOfWeek,
                timeSlot.id,
                academic_term_id
              )

              if (conflicts.length > 0) {
                errors.push(`Dòng ${rowIndex}, cột ${colIndex}: ${conflicts.join(', ')}`)
                continue
              }
            }

            // Create schedule entry
            const scheduleEntry: ImportedSchedule = {
              class_id: classData.id,
              teacher_id: parsed.teacher_id,
              subject_id: subject_id,
              day_of_week: dayOfWeek,
              time_slot_id: timeSlot.id,
              week_number: parseInt(week_number),
              room_number: parsed.room_number || `P${roomCounter++}`,
              is_special_activity: false
            }

            // If no subject found, create as a note-only entry
            if (!subject_id && parsed.subject_name) {
              scheduleEntry.notes = parsed.subject_name
              scheduleEntry.teacher_id = undefined
              scheduleEntry.subject_id = undefined
            }

            classSchedules.push(scheduleEntry)
          }
        }

        allSchedulesToCreate.push(...classSchedules)
        results.push({
          success: errors.length === 0,
          class_name: className,
          schedules_created: classSchedules.length,
          errors,
          warnings
        })

      } catch (error) {
        errors.push(`Lỗi xử lý sheet ${className}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.push({
          success: false,
          class_name: className,
          schedules_created: 0,
          errors,
          warnings
        })
      }
    }

    // If there are any errors, don't create schedules
    const hasErrors = results.some(r => r.errors.length > 0)
    if (hasErrors) {
      return NextResponse.json({
        success: false,
        message: 'Import failed due to validation errors',
        results,
        summary: {
          total_classes: results.length,
          successful_classes: results.filter(r => r.success).length,
          total_schedules: 0,
          total_errors: results.reduce((sum, r) => sum + r.errors.length, 0),
          total_warnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
        }
      }, { status: 400 })
    }

    // Clear existing schedules if replace_existing is true
    if (replace_existing) {
      const classIds = [...new Set(allSchedulesToCreate.map(s => s.class_id))]
      
      for (const classId of classIds) {
        await supabase
          .from('teaching_schedules')
          .delete()
          .eq('academic_term_id', academic_term_id)
          .eq('class_id', classId)
      }
    }

    // Map day_of_week number to enum string for Postgres
    const dayOfWeekEnum = [null, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    // Create all schedules
    // Only insert entries that have both teacher_id and subject_id (required by schema)
    const schedulesToInsert = allSchedulesToCreate.filter(schedule => {
      // Allow note-only entries if they have notes and no teacher/subject
      if (!schedule.teacher_id && !schedule.subject_id && schedule.notes) return false; // skip note-only for now (schema requires teacher_id/subject_id)
      // Only insert if both teacher_id and subject_id are present
      return schedule.teacher_id && schedule.subject_id;
    }).map(schedule => ({
      academic_term_id,
      class_id: schedule.class_id,
      teacher_id: schedule.teacher_id || null,
      subject_id: schedule.subject_id || null,
      day_of_week: dayOfWeekEnum[schedule.day_of_week] || 'monday',
      time_slot_id: schedule.time_slot_id,
      week_number: schedule.week_number,
      room_number: schedule.room_number || null,
      notes: schedule.notes || null,
      is_active: true,
      created_by: user.id
    }))

    let createdSchedules = [];
    let insertError = null;
    if (schedulesToInsert.length > 0) {
      const insertResult = await supabase
      .from('teaching_schedules')
      .insert(schedulesToInsert)
        .select();
      createdSchedules = insertResult.data || [];
      insertError = insertResult.error;
    if (insertError) {
        console.error('Failed to create schedules:', insertError, schedulesToInsert);
      return NextResponse.json({
        success: false,
        error: 'Failed to create schedules: ' + insertError.message,
        results
      }, { status: 500 })
      }
    }

    // Update results with actual creation counts
    const createdByClass = createdSchedules.reduce((acc: any, schedule: any) => {
      acc[schedule.class_id] = (acc[schedule.class_id] || 0) + 1
      return acc
    }, {})

    results.forEach(result => {
      const classData = allSchedulesToCreate.find(s => s.class_id)
      if (classData) {
        result.schedules_created = createdByClass[classData.class_id] || 0
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Timetable imported successfully',
      results,
      summary: {
        total_classes: results.length,
        successful_classes: results.filter(r => r.success).length,
        total_schedules: createdSchedules.length,
        total_errors: 0,
        total_warnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error importing timetable:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to import timetable: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
} 