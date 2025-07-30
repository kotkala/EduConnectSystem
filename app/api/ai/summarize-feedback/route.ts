import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'

// Initialize Google Generative AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
})

interface FeedbackItem {
  id: string
  subject_name: string
  teacher_name: string
  rating: number
  comment: string
  created_at: string
}

interface PreviousWeekFeedbackData {
  id: string
  rating: number
  feedback_text: string | null
  created_at: string
  subjects: { name_vietnamese: string }[] | null
  teacher: { full_name: string }[] | null
}

interface SummarizeFeedbackRequest {
  feedbacks: FeedbackItem[]
  studentName: string
  date: string
  saveToDatabase?: boolean
  studentId?: string
  dayOfWeek?: number
  academicYearId?: string
  semesterId?: string
  weekNumber?: number
  includeProgressTracking?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user role (teacher or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Only teachers and admins can summarize feedback' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: SummarizeFeedbackRequest = await request.json()
    const { feedbacks, studentName, date, saveToDatabase, studentId, dayOfWeek, academicYearId, semesterId, weekNumber, includeProgressTracking } = body

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json(
        { error: 'No feedback data provided' },
        { status: 400 }
      )
    }

    // Fetch previous week feedback for progress tracking
    let previousWeekFeedback: FeedbackItem[] = []
    let progressContext = ""

    if (includeProgressTracking && studentId && weekNumber && weekNumber > 1) {
      try {
        const { data: prevFeedback, error: prevError } = await supabase
          .from('student_feedback')
          .select(`
            id,
            rating,
            feedback_text,
            created_at,
            subjects:subjects!student_feedback_subject_id_fkey(name_vietnamese),
            teacher:profiles!student_feedback_teacher_id_fkey(full_name),
            timetable_events!inner(
              day_of_week,
              week_number,
              semester_id,
              semesters!inner(academic_year_id)
            )
          `)
          .eq('student_id', studentId)
          .eq('timetable_events.day_of_week', dayOfWeek)
          .eq('timetable_events.week_number', weekNumber - 1)
          .eq('timetable_events.semester_id', semesterId)
          .eq('timetable_events.semesters.academic_year_id', academicYearId)

        if (!prevError && prevFeedback && prevFeedback.length > 0) {
          previousWeekFeedback = prevFeedback.map((f: PreviousWeekFeedbackData) => ({
            id: f.id,
            subject_name: f.subjects?.[0]?.name_vietnamese || 'Unknown',
            teacher_name: f.teacher?.[0]?.full_name || 'Unknown',
            rating: f.rating,
            comment: f.feedback_text || '',
            created_at: f.created_at
          }))

          // Calculate progress metrics
          const currentAvgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
          const previousAvgRating = previousWeekFeedback.reduce((sum, f) => sum + f.rating, 0) / previousWeekFeedback.length
          const ratingChange = currentAvgRating - previousAvgRating

          if (Math.abs(ratingChange) >= 0.5) {
            if (ratingChange > 0) {
              progressContext = `\n\nTIẾN BỘ: Điểm trung bình tăng ${ratingChange.toFixed(1)} so với tuần trước (từ ${previousAvgRating.toFixed(1)} lên ${currentAvgRating.toFixed(1)}). Hãy khen ngợi sự tiến bộ này.`
            } else {
              progressContext = `\n\nCẦN CHÚ Ý: Điểm trung bình giảm ${Math.abs(ratingChange).toFixed(1)} so với tuần trước (từ ${previousAvgRating.toFixed(1)} xuống ${currentAvgRating.toFixed(1)}). Cần quan tâm và hỗ trợ thêm.`
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch previous week feedback:', error)
        // Continue without progress tracking if there's an error
      }
    }

    // Prepare feedback data for AI summarization
    const feedbackText = feedbacks.map(feedback => {
      const ratingText = feedback.rating === 5 ? 'Xuất sắc' :
                        feedback.rating === 4 ? 'Tốt' :
                        feedback.rating === 3 ? 'Trung bình' :
                        feedback.rating === 2 ? 'Cần cải thiện' : 'Kém'
      
      return `Môn ${feedback.subject_name} (GV: ${feedback.teacher_name}):
- Đánh giá: ${ratingText} (${feedback.rating}/5)
- Nhận xét: ${feedback.comment || 'Không có nhận xét'}`
    }).join('\n\n')

    // Create AI prompt for summarization
    const prompt = `Tóm tắt feedback học tập của ${studentName} ngày ${date} cho phụ huynh:

${feedbackText}${progressContext}

YÊU CẦU NGHIÊM NGẶT:
- Chỉ 1-2 câu ngắn gọn (tối đa 50 từ)
- Ưu tiên thông tin tiến bộ nếu có
- Tập trung vào điểm nổi bật nhất trong ngày
- Nếu có vấn đề, đưa ra 1 gợi ý cụ thể cho phụ huynh
- Giọng điệu tích cực, khuyến khích

Ví dụ format:
- Có tiến bộ: "Con tiến bộ rõ rệt tuần này! Điểm Toán tăng từ 3 lên 5. Tiếp tục duy trì."
- Bình thường: "Hôm nay con học tập tích cực, đặc biệt xuất sắc ở môn Toán (5/5)."
- Cần chú ý: "Con cần tập trung hơn ở môn Văn. Phụ huynh hỗ trợ ôn bài ở nhà."

Tóm tắt:`

    try {
      // Generate AI summary using Gemini
      const model = genAI.models
      const response = await model.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
        config: {
          maxOutputTokens: 80,  // Reduced for shorter summaries
          temperature: 0.5,     // Lower for more focused output
          topP: 0.9,
          topK: 20              // More focused token selection
        }
      })

      const summary = response.text?.trim()

      if (!summary) {
        throw new Error('AI failed to generate summary')
      }

      // Log the summarization for monitoring
      console.log(`AI Feedback Summary generated for student: ${studentName}, date: ${date}`)

      // Save to database if requested
      if (saveToDatabase && studentId && dayOfWeek !== undefined && academicYearId && semesterId && weekNumber !== undefined) {
        try {
          // Get all feedback IDs for this day
          const feedbackIds = feedbacks.map(f => f.id)

          // Update student_feedback with AI summary
          const { error: updateError } = await supabase
            .from('student_feedback')
            .update({
              ai_summary: summary,
              use_ai_summary: true,
              ai_generated_at: new Date().toISOString()
            })
            .in('id', feedbackIds)
            .eq('teacher_id', user.id)
            .eq('student_id', studentId)

          if (updateError) {
            console.error('Failed to save AI summary to database:', updateError)
            // Don't fail the request, just log the error
          } else {
            console.log(`AI summary saved to database for student: ${studentName}`)
          }
        } catch (dbError) {
          console.error('Database error while saving AI summary:', dbError)
          // Don't fail the request, just log the error
        }
      }

      return NextResponse.json({
        success: true,
        summary,
        originalFeedbackCount: feedbacks.length,
        studentName,
        date,
        savedToDatabase: saveToDatabase
      })

    } catch (aiError) {
      console.error('AI Summarization Error:', aiError)
      return NextResponse.json(
        { 
          error: 'Failed to generate AI summary',
          details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Summarize Feedback API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
