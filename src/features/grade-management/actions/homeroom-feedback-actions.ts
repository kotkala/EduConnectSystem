'use server'

import { createClient } from '@/lib/supabase/server'

// Types for homeroom feedback system
export interface HomeroomFeedbackFilters {
  academic_year_id: string
  semester_id: string
  week_number: number
}

export interface StudentWeeklySchedule {
  student_id: string
  student_name: string
  student_code: string
  student_email: string
  student_avatar_url: string | null
  class_id: string
  class_name: string
  daily_schedules: {
    [day: string]: LessonWithFeedback[]
  }
}

export interface LessonWithFeedback {
  timetable_event_id: string
  start_time: string
  end_time: string
  subject_name: string
  subject_code: string
  teacher_name: string
  feedback?: StudentFeedback
}

export interface StudentFeedback {
  id: string
  rating: number
  comment: string | null
  created_at: string
  teacher_name: string
}

export interface StudentDaySchedule {
  student_id: string
  student_name: string
  student_code: string
  day_of_week: number
  lessons: StudentDayLesson[]
}

export interface StudentDayLesson {
  period: number
  subject_name: string
  teacher_name: string
  classroom?: string
  feedback?: string
  feedback_date?: string
}



// Check if user is a homeroom teacher
async function checkHomeroomTeacherPermissions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, homeroom_enabled')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    throw new Error("Từ chối truy cập. Yêu cầu vai trò giáo viên.")
  }

  if (!profile.homeroom_enabled) {
    throw new Error("Từ chối truy cập. Yêu cầu quyền giáo viên chủ nhiệm.")
  }

  return { userId: user.id }
}

// Get homeroom students with their weekly schedule and feedback
export async function getHomeroomStudentsWeeklyFeedbackAction(
  filters: HomeroomFeedbackFilters
): Promise<{ success: boolean; data?: StudentWeeklySchedule[]; error?: string }> {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Build parameters object following Context7 pattern - only include defined values
    const rpcParams: Record<string, unknown> = {
      p_teacher_id: userId,
      p_academic_year_id: filters.academic_year_id,
      p_semester_id: filters.semester_id,
      p_week_number: filters.week_number
    }

    // Use optimized RPC function following Context7 pattern for complex queries
    const { data: studentsData, error } = await supabase
      .rpc('get_homeroom_students_weekly_feedback', rpcParams)

    if (error) {
      console.error('Error fetching students weekly feedback:', error)
      throw new Error(error.message)
    }

    return {
      success: true,
      data: studentsData || []
    }

  } catch (error) {
    console.error("Get homeroom students weekly feedback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy phản hồi theo tuần của học sinh"
    }
  }
}

// Get student schedule for a specific day with feedback
export async function getStudentDayScheduleWithFeedbackAction(
  student_id: string,
  day_of_week: number,
  filters: HomeroomFeedbackFilters
): Promise<{ success: boolean; data?: StudentDaySchedule; error?: string }> {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Build parameters object following Context7 pattern
    const rpcParams: Record<string, unknown> = {
      p_teacher_id: userId,
      p_student_id: student_id,
      p_day_of_week: day_of_week,
      p_academic_year_id: filters.academic_year_id,
      p_semester_id: filters.semester_id,
      p_week_number: filters.week_number
    }

    // Use optimized RPC function following Context7 pattern for complex queries
    const { data: daySchedule, error } = await supabase
      .rpc('get_student_day_schedule_with_feedback', rpcParams)

    if (error) {
      console.error('Error fetching student day schedule:', error)
      throw new Error(error.message)
    }

    return {
      success: true,
      data: daySchedule?.[0] || null
    }

  } catch (error) {
    console.error("Get student day schedule error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy thời khóa biểu theo ngày của học sinh"
    }
  }
}

// Get available academic years for homeroom teacher
export async function getHomeroomAcademicYearsAction(): Promise<{ success: boolean; data?: Array<{id: string, name: string}>; error?: string }> {
  try {
    await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Get academic years where teacher has a homeroom class
    const { data: academicYears, error } = await supabase
      .from('academic_years')
      .select(`
        id,
        name
      `)
      .order('start_date', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: academicYears || []
    }

  } catch (error) {
    console.error("Get homeroom academic years error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách niên khóa"
    }
  }
}

// Get available semesters for homeroom teacher
export async function getHomeroomSemestersAction(academic_year_id: string): Promise<{ success: boolean; data?: Array<{id: string, name: string, start_date: string, end_date: string}>; error?: string }> {
  try {
    await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Get semesters for the academic year where teacher has a homeroom class
    const { data: semesters, error } = await supabase
      .from('semesters')
      .select(`
        id,
        name,
        start_date,
        end_date
      `)
      .eq('academic_year_id', academic_year_id)
      .order('start_date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: semesters || []
    }

  } catch (error) {
    console.error("Get homeroom semesters error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách học kỳ"
    }
  }
}

// Get student day feedback details
export async function getStudentDayFeedbackAction({
  studentId,
  dayOfWeek,
  semester_id,
  week_number
}: {
  studentId: string
  dayOfWeek: number
  academic_year_id: string
  semester_id: string
  week_number: number
}) {
  try {
    const supabase = await createClient()

    // Get student basic info and class using the correct view
    const { data: studentAssignment, error: studentError } = await supabase
      .from('student_class_assignments_view')
      .select(`
        student_id,
        student_name,
        student_number,
        class_id,
        class_name
      `)
      .eq('student_id', studentId)
      .eq('assignment_type', 'student')
      .eq('is_active', true)
      .single()

    if (studentError) {
      throw new Error(studentError.message)
    }

    if (!studentAssignment) {
      throw new Error('Student class assignment not found')
    }

    // Get timetable events for the specific day and join with feedback
    const { data: timetableEvents, error: timetableError } = await supabase
      .from('timetable_events')
      .select(`
        id,
        start_time,
        end_time,
        day_of_week,
        week_number,
        subjects:subject_id (
          name_vietnamese
        ),
        profiles:teacher_id (
          full_name
        ),
        classrooms:classroom_id (
          name
        ),
        student_feedback (
          id,
          student_id,
          feedback_text,
          rating,
          created_at
        )
      `)
      .eq('class_id', studentAssignment.class_id)
      .eq('day_of_week', dayOfWeek)
      .eq('semester_id', semester_id)
      .eq('week_number', week_number)
      .order('start_time', { ascending: true })

    if (timetableError) {
      throw new Error(timetableError.message)
    }

    // Format the lessons data
    const formattedLessons: StudentDayLesson[] = (timetableEvents || []).map((event: unknown, index) => {
      const evt = event as {
        start_time: string;
        end_time: string;
        subjects: { name_vietnamese: string }[] | { name_vietnamese: string };
        profiles: { full_name: string }[] | { full_name: string };
        classrooms: { name: string }[] | { name: string };
        student_feedback: {
          student_id: string;
          feedback_text: string;
          created_at: string;
        }[] | null;
      }

      const subject = Array.isArray(evt.subjects) ? evt.subjects[0] : evt.subjects
      const teacher = Array.isArray(evt.profiles) ? evt.profiles[0] : evt.profiles
      const classroom = Array.isArray(evt.classrooms) ? evt.classrooms[0] : evt.classrooms

      // Handle feedback - filter for this specific student
      const studentFeedback = evt.student_feedback?.find((fb: { student_id: string; feedback_text: string; created_at: string }) =>
        fb.student_id === studentId
      )

      return {
        period: index + 1, // Use index as period since we don't have period in timetable_events
        subject_name: subject?.name_vietnamese || 'Không xác định',
        teacher_name: teacher?.full_name || 'Không xác định',
        classroom: classroom?.name || undefined,
        feedback: studentFeedback?.feedback_text || undefined,
        feedback_date: studentFeedback?.created_at || undefined
      }
    })

    const result: StudentDaySchedule = {
      student_id: studentId,
      student_name: studentAssignment.student_name,
      student_code: studentAssignment.student_number,
      day_of_week: dayOfWeek,
      lessons: formattedLessons
    }

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error("Get student day feedback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy dữ liệu phản hồi học sinh"
    }
  }
}

// Generate daily feedback summary using AI
export async function generateDailyFeedbackSummaryAction({
  dayOfWeek,
  lessons,
  week_number
}: {
  studentId: string
  dayOfWeek: number
  lessons: StudentDayLesson[]
  academic_year_id: string
  semester_id: string
  week_number: number
}) {
  try {
    // Standardized prompt for daily feedback summary
    const DAILY_FEEDBACK_SUMMARY_PROMPT = `Bạn là trợ lý AI chuyên phân tích phản hồi học tập hàng ngày của học sinh. Nhiệm vụ của bạn là tóm tắt và phân tích tất cả phản hồi trong ngày một cách chuyên nghiệp và có ích.

QUY TẮC TÓM TẮT:
- Phân tích tất cả phản hồi từ các giáo viên trong ngày
- Xác định xu hướng chung về thái độ học tập và hành vi
- Đưa ra nhận xét tổng quan về hiệu suất học tập
- Ghi nhận những điểm tích cực và cần cải thiện
- Đề xuất hướng hỗ trợ cụ thể cho ngày hôm sau

CẤU TRÚC TÓM TẮT:
📊 TỔNG QUAN NGÀY HỌC:
- Tổng số tiết: [X] tiết
- Số tiết có phản hồi: [Y] tiết
- Đánh giá chung: [Tích cực/Trung bình/Cần cải thiện]

📝 PHÂN TÍCH PHẢN HỒI:
- Điểm mạnh: [Liệt kê các điểm tích cực từ phản hồi]
- Cần chú ý: [Các vấn đề cần theo dõi]
- Xu hướng: [Nhận xét về sự thay đổi so với trước]

🎯 KHUYẾN NGHỊ:
- Cho học sinh: [Gợi ý cụ thể để cải thiện]
- Cho phụ huynh: [Cách hỗ trợ tại nhà]
- Theo dõi: [Điểm cần quan sát trong những ngày tới]

DỮLIỆU PHẢN HỒI NGÀY HÔM NAY:`

    // Prepare feedback data for AI analysis
    const dayNames = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
    const dayName = dayNames[dayOfWeek] || 'Không xác định'

    const feedbackData = lessons.map((lesson) => {
      const feedbackText = lesson.feedback ? `Phản hồi: "${lesson.feedback}"` : 'Chưa có phản hồi'
      return `Tiết ${lesson.period} - ${lesson.subject_name} (GV: ${lesson.teacher_name}):
${feedbackText}`
    }).join('\n\n')

    const fullPrompt = `${DAILY_FEEDBACK_SUMMARY_PROMPT}

Ngày: ${dayName}, Tuần ${week_number}
Học sinh: [Tên sẽ được thay thế]

${feedbackData}

Hãy tạo tóm tắt chi tiết và hữu ích dựa trên dữ liệu phản hồi trên.`

    // For now, return a structured summary based on the data
    // In a real implementation, this would call an AI service
    const totalLessons = lessons.length
    const lessonsWithFeedback = lessons.filter(lesson => lesson.feedback).length
    const feedbackRate = totalLessons > 0 ? Math.round((lessonsWithFeedback / totalLessons) * 100) : 0

    let overallAssessment = "Trung bình"
    if (feedbackRate >= 80) overallAssessment = "Tích cực"
    else if (feedbackRate < 50) overallAssessment = "Cần cải thiện"

    const positiveFeedbacks = lessons.filter(lesson =>
      lesson.feedback && (
        lesson.feedback.toLowerCase().includes('tốt') ||
        lesson.feedback.toLowerCase().includes('tích cực') ||
        lesson.feedback.toLowerCase().includes('chăm chỉ') ||
        lesson.feedback.toLowerCase().includes('xuất sắc')
      )
    )

    const concernFeedbacks = lessons.filter(lesson =>
      lesson.feedback && (
        lesson.feedback.toLowerCase().includes('cần cải thiện') ||
        lesson.feedback.toLowerCase().includes('chưa tốt') ||
        lesson.feedback.toLowerCase().includes('cần chú ý') ||
        lesson.feedback.toLowerCase().includes('yếu')
      )
    )

    const summary = `📊 TỔNG QUAN NGÀY HỌC:
- Tổng số tiết: ${totalLessons} tiết
- Số tiết có phản hồi: ${lessonsWithFeedback} tiết (${feedbackRate}%)
- Đánh giá chung: ${overallAssessment}

📝 PHÂN TÍCH PHẢN HỒI:
- Điểm mạnh: ${positiveFeedbacks.length > 0 ?
  positiveFeedbacks.map(l => `${l.subject_name} - ${l.feedback?.substring(0, 50)}...`).join('; ') :
  'Cần có thêm phản hồi tích cực từ giáo viên'}
- Cần chú ý: ${concernFeedbacks.length > 0 ?
  concernFeedbacks.map(l => `${l.subject_name} - ${l.feedback?.substring(0, 50)}...`).join('; ') :
  'Không có vấn đề đáng lo ngại'}
- Xu hướng: ${feedbackRate >= 70 ? 'Tích cực, duy trì phong độ' : 'Cần tăng cường tương tác với giáo viên'}

🎯 KHUYẾN NGHỊ:
- Cho học sinh: ${feedbackRate < 70 ? 'Tăng cường tham gia tích cực trong các tiết học, chủ động hỏi bài khi chưa hiểu' : 'Tiếp tục duy trì thái độ học tập tích cực hiện tại'}
- Cho phụ huynh: Theo dõi và động viên con trong việc hoàn thành bài tập, tạo môi trường học tập tích cực tại nhà
- Theo dõi: ${concernFeedbacks.length > 0 ? 'Quan sát sự tiến bộ trong các môn đã được ghi nhận cần cải thiện' : 'Duy trì mức độ tham gia hiện tại trong tất cả các môn học'}`

    return {
      success: true,
      summary: summary,
      prompt: fullPrompt // Return the prompt for reference
    }

  } catch (error) {
    console.error("Generate daily feedback summary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể tạo tóm tắt phản hồi"
    }
  }
}
