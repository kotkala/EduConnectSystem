'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

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

// Get existing daily feedback summary
export async function getDailyFeedbackSummaryAction({
  studentId,
  dayOfWeek,
  academic_year_id,
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

    const { data: summary, error } = await supabase
      .from('daily_feedback_summaries')
      .select('*')
      .eq('student_id', studentId)
      .eq('day_of_week', dayOfWeek)
      .eq('week_number', week_number)
      .eq('academic_year_id', academic_year_id)
      .eq('semester_id', semester_id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(error.message)
    }

    return {
      success: true,
      data: summary
    }

  } catch (error) {
    console.error("Get daily feedback summary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy tóm tắt phản hồi"
    }
  }
}

// Generate daily feedback summary using AI
export async function generateDailyFeedbackSummaryAction({
  studentId,
  dayOfWeek,
  lessons,
  academic_year_id,
  semester_id,
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
    // Enhanced prompt with 10 evaluation criteria
    const DAILY_FEEDBACK_SUMMARY_PROMPT = `Bạn là trợ lý AI chuyên phân tích phản hồi học tập hàng ngày của học sinh. Hãy tạo đánh giá chi tiết theo 10 tiêu chí sau:

**YÊU CẦU ĐÁNH GIÁ:**

1. **Thái độ học tập** - Mức độ tích cực, chú ý trong giờ học
2. **Tương tác lớp học** - Khả năng phát biểu, thảo luận, hợp tác
3. **Hoàn thành bài tập** - Chất lượng và tiến độ làm bài
4. **Kỹ năng tư duy** - Khả năng phân tích, suy luận, giải quyết vấn đề
5. **Kỹ năng giao tiếp** - Cách trình bày, lắng nghe, phản hồi
6. **Thói quen học tập** - Chuẩn bị bài, ghi chép, tổ chức thời gian
7. **Tinh thần trách nhiệm** - Hoàn thành nhiệm vụ, tuân thủ quy định
8. **Khả năng sáng tạo** - Ý tưởng mới, cách tiếp cận độc đáo
9. **Kỹ năng xã hội** - Quan hệ bạn bè, hỗ trợ lẫn nhau
10. **Điểm cần cải thiện** - Gợi ý cụ thể để phát triển

**ĐỊNH DẠNG MONG MUỐN:**
- Mỗi đánh giá có tiêu đề rõ ràng
- Nội dung tích cực, khích lệ
- Đưa ra gợi ý cải thiện cụ thể
- Phù hợp với độ tuổi học sinh
- Tập trung vào hành vi có thể quan sát được

**DỮ LIỆU PHẢN HỒI NGÀY HÔM NAY:**`

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

    // Call Google Gemini AI directly to generate the actual summary
    try {
      const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

      if (!GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error('AI service not configured')
      }

      // Create a concise prompt for short, clean summaries
      const enhancedPrompt = `Bạn là trợ lý AI tạo tóm tắt phản hồi học tập ngắn gọn cho phụ huynh.

YÊU CẦU:
- Chỉ viết 3-5 câu ngắn gọn
- Không sử dụng ký tự đặc biệt như **, ##, emoji
- Không viết in hoa
- Tập trung vào điểm mạnh và gợi ý cải thiện
- Ngôn ngữ tích cực, phù hợp với phụ huynh

DỮ LIỆU PHẢN HỒI NGÀY ${dayName}, TUẦN ${week_number}:
${lessons.map(lesson => `${lesson.subject_name}: ${lesson.feedback || 'Chưa có phản hồi'}`).join('\n')}

Hãy tạo tóm tắt ngắn gọn, rõ ràng về tình hình học tập trong ngày.`

      // Initialize Google Gemini AI
      const ai = new GoogleGenAI({
        apiKey: GOOGLE_GENERATIVE_AI_API_KEY
      })

      // Generate content using Gemini
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: enhancedPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 40
        }
      })

      if (!result?.text) {
        throw new Error('No text generated by AI')
      }

      const aiSummary = result.text

      // Save the AI summary to the database
      const supabase = await createClient()
      const { error: saveError } = await supabase
        .from('daily_feedback_summaries')
        .upsert({
          student_id: studentId,
          day_of_week: dayOfWeek,
          week_number,
          academic_year_id,
          semester_id,
          ai_summary: aiSummary,
          is_ai_generated: true,
          total_lessons: lessons.length,
          lessons_with_feedback: lessons.filter(lesson => lesson.feedback).length,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,day_of_week,week_number,academic_year_id,semester_id'
        })

      if (saveError) {
        console.error('Failed to save AI summary to database:', saveError)
        // Don't fail the entire operation, just log the error
      }

      return {
        success: true,
        summary: aiSummary,
        prompt: fullPrompt,
        isAIGenerated: true
      }
    } catch (aiError) {
      console.error("AI generation failed, falling back to template:", aiError)

      // Fallback to template-based summary if AI fails
      const totalLessons = lessons.length
      const lessonsWithFeedback = lessons.filter(lesson => lesson.feedback).length
      const feedbackRate = totalLessons > 0 ? Math.round((lessonsWithFeedback / totalLessons) * 100) : 0

      let overallAssessment = 'Cần cải thiện'
      if (feedbackRate >= 80) {
        overallAssessment = 'Tích cực'
      } else if (feedbackRate >= 50) {
        overallAssessment = 'Trung bình'
      }

      const fallbackSummary = `📊 TỔNG QUAN NGÀY HỌC:
- Tổng số tiết: ${totalLessons} tiết
- Số tiết có phản hồi: ${lessonsWithFeedback} tiết (${feedbackRate}%)
- Đánh giá chung: ${overallAssessment}

⚠️ Lưu ý: Đây là tóm tắt tự động do lỗi kết nối AI. Vui lòng thử lại để có phân tích chi tiết hơn.`

      return {
        success: true,
        summary: fallbackSummary,
        prompt: fullPrompt,
        isAIGenerated: false
      }
    }

  } catch (error) {
    console.error("Generate daily feedback summary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể tạo tóm tắt phản hồi"
    }
  }
}

// Update AI summary action
export async function updateDailyFeedbackSummaryAction({
  studentId,
  dayOfWeek,
  academic_year_id,
  semester_id,
  week_number,
  aiSummary
}: {
  studentId: string
  dayOfWeek: number
  academic_year_id: string
  semester_id: string
  week_number: number
  aiSummary: string
}) {
  try {
    const supabase = await createClient()

    // Update the existing AI summary
    const { error } = await supabase
      .from('daily_feedback_summaries')
      .update({
        ai_summary: aiSummary.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('day_of_week', dayOfWeek)
      .eq('academic_year_id', academic_year_id)
      .eq('semester_id', semester_id)
      .eq('week_number', week_number)

    if (error) {
      console.error("Update daily feedback summary error:", error)
      return {
        success: false,
        error: "Không thể cập nhật tóm tắt phản hồi"
      }
    }

    return {
      success: true,
      message: "Đã cập nhật tóm tắt thành công"
    }
  } catch (error) {
    console.error("Update daily feedback summary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể cập nhật tóm tắt phản hồi"
    }
  }
}
