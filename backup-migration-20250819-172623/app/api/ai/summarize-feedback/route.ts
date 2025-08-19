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

// Helper function to verify authentication and authorization
async function verifyUserAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    return { 
      error: NextResponse.json(
        { error: 'Forbidden - Only teachers and admins can summarize feedback' },
        { status: 403 }
      )
    }
  }

  return { user, supabase }
}

// Helper function to validate request body
function validateRequestBody(body: SummarizeFeedbackRequest) {
  const { feedbacks } = body
  
  if (!feedbacks || feedbacks.length === 0) {
    return NextResponse.json(
      { error: 'No feedback data provided' },
      { status: 400 }
    )
  }
  
  return null
}

// Helper function to generate rating text
function getRatingText(rating: number): string {
  switch (rating) {
    case 5: return 'Xuất sắc'
    case 4: return 'Tốt'
    case 3: return 'Trung bình'
    case 2: return 'Cần cải thiện'
    default: return 'Kém'
  }
}

// Helper function to prepare feedback text
function prepareFeedbackText(feedbacks: FeedbackItem[]): string {
  return feedbacks.map(feedback => {
    const ratingText = getRatingText(feedback.rating)
    return `Môn ${feedback.subject_name} (GV: ${feedback.teacher_name}):
- Đánh giá: ${ratingText} (${feedback.rating}/5)
- Nhận xét: ${feedback.comment || 'Không có nhận xét'}`
  }).join('\n\n')
}

// Helper function to create AI prompt
function createAIPrompt(studentName: string, date: string, feedbackText: string, progressContext: string): string {
  return `Tóm tắt feedback học tập của ${studentName} ngày ${date} cho phụ huynh:

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
}

// Helper function to generate AI summary
async function generateAISummary(
  feedbacks: FeedbackItem[], 
  studentName: string, 
  date: string, 
  progressContext: string
): Promise<string> {
  const feedbackText = prepareFeedbackText(feedbacks)
  const prompt = createAIPrompt(studentName, date, feedbackText, progressContext)

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        maxOutputTokens: 80,
        temperature: 0.5,
        topP: 0.9,
        topK: 20
      }
    })

    const summary = response.text?.trim()

    if (!summary) {
      throw new Error('AI failed to generate summary')
    }

    console.log(`AI Feedback Summary generated for student: ${studentName}, date: ${date}`)
    return summary

  } catch (aiError) {
    console.error('AI Summarization Error:', aiError)
    throw new Error(`Failed to generate AI summary: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}`)
  }
}

// Helper function to save summary to database
async function saveSummaryToDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
  feedbacks: FeedbackItem[],
  summary: string,
  studentId: string,
  studentName: string
): Promise<void> {
  try {
    const feedbackIds = feedbacks.map(f => f.id)

    const { error: updateError } = await supabase
      .from('student_feedback')
      .update({
        ai_summary: summary,
        use_ai_summary: true,
        ai_generated_at: new Date().toISOString()
      })
      .in('id', feedbackIds)
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)

    if (updateError) {
      console.error('Failed to save AI summary to database:', updateError)
      throw updateError
    } else {
      console.log(`AI summary saved to database for student: ${studentName}`)
    }
  } catch (dbError) {
    console.error('Database error while saving AI summary:', dbError)
    throw dbError
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const authResult = await verifyUserAccess()
    if (authResult.error) {
      return authResult.error
    }
    const { user, supabase } = authResult

    // Parse and validate request body
    const body: SummarizeFeedbackRequest = await request.json()
    const validationError = validateRequestBody(body)
    if (validationError) {
      return validationError
    }

    const { feedbacks, studentName, date, saveToDatabase, studentId, dayOfWeek, academicYearId, semesterId, weekNumber, includeProgressTracking } = body

    // Get progress tracking context (simplified for now)
    let progressContext = ""
    if (includeProgressTracking && studentId && weekNumber && weekNumber > 1) {
      // Simplified progress tracking to reduce complexity
      progressContext = "\n\nTiếp tục theo dõi tiến bộ của con."
    }

    // Generate AI summary
    const summary = await generateAISummary(feedbacks, studentName, date, progressContext)
    
    // Save to database if requested
    if (saveToDatabase && studentId && dayOfWeek !== undefined && academicYearId && semesterId && weekNumber !== undefined) {
      await saveSummaryToDatabase(supabase, user.id, feedbacks, summary, studentId, studentName)
    }

    return NextResponse.json({
      success: true,
      summary,
      originalFeedbackCount: feedbacks.length,
      studentName,
      date,
      savedToDatabase: saveToDatabase
    })

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
