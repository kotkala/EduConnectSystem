import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

// Initialize Google Generative AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
})

interface DailyFeedbackItem {
  id: string
  subject_name: string
  teacher_name: string
  rating: number
  comment: string
  start_time: string
  end_time: string
}

interface DailySummaryRequest {
  feedbacks: DailyFeedbackItem[]
  studentName: string
  dayName: string
  date: string
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

    // Parse request body
    const body: DailySummaryRequest = await request.json()
    const { feedbacks, studentName, dayName, date } = body

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json(
        { error: 'No feedback data provided' },
        { status: 400 }
      )
    }

    // Helper function to get rating text
    const getRatingText = (rating: number): string => {
      if (rating === 5) return 'Xuất sắc'
      if (rating === 4) return 'Tốt'
      if (rating === 3) return 'Trung bình'
      if (rating === 2) return 'Cần cải thiện'
      return 'Kém'
    }

    // Prepare feedback data for AI summarization
    const feedbackText = feedbacks.map(feedback => {
      const ratingText = getRatingText(feedback.rating)
      const timeRange = `${feedback.start_time}-${feedback.end_time}`
      const commentPart = feedback.comment ? ` - "${feedback.comment}"` : ''

      return `${feedback.subject_name} (${timeRange}): ${ratingText} (${feedback.rating}/5)${commentPart}`
    }).join('\n')

    // Calculate average rating for context
    const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length

    // Create AI prompt for daily summarization
    const prompt = `Tóm tắt ngày học ${dayName} của ${studentName} cho phụ huynh:

${feedbackText}

ĐIỂM TRUNG BÌNH: ${avgRating.toFixed(1)}/5

YÊU CẦU NGHIÊM NGẶT:
- Chỉ 1 câu ngắn gọn (tối đa 30 từ)
- Tập trung vào điểm nổi bật nhất trong ngày
- Nếu có nhiều môn, nêu môn tốt nhất hoặc cần chú ý nhất
- Giọng điệu tích cực, khuyến khích

Ví dụ format:
- Tốt: "Hôm nay con học tập tích cực, đặc biệt xuất sắc ở môn Toán (5/5)."
- Trung bình: "Ngày học ổn định với 3 môn, cần chú ý hơn ở môn Văn."
- Cần cải thiện: "Con cần tập trung hơn, phụ huynh hỗ trợ ôn bài môn Anh."

Tóm tắt ngày ${dayName}:`

    try {
      // Generate AI summary using Gemini
      const model = genAI.models
      const response = await model.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
        config: {
          maxOutputTokens: 50,   // Very short for daily summaries
          temperature: 0.4,      // Lower for consistent output
          topP: 0.9,
          topK: 20
        }
      })

      const summary = response.text?.trim()

      if (!summary) {
        throw new Error('AI failed to generate daily summary')
      }

      // Log the summarization for monitoring
      console.log(`Daily AI Summary generated for student: ${studentName}, day: ${dayName}`)

      return NextResponse.json({
        success: true,
        summary,
        feedbackCount: feedbacks.length,
        averageRating: avgRating,
        studentName,
        dayName,
        date
      })

    } catch (aiError) {
      console.error('AI Daily Summarization Error:', aiError)
      return NextResponse.json(
        { 
          error: 'Failed to generate daily AI summary',
          details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Daily Summary API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
