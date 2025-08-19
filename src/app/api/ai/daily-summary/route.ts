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
      if (rating === 5) return 'Xuáº¥t sáº¯c'
      if (rating === 4) return 'Tá»‘t'
      if (rating === 3) return 'Trung bÃ¬nh'
      if (rating === 2) return 'Cáº§n cáº£i thiá»‡n'
      return 'KÃ©m'
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
    const prompt = `TÃ³m táº¯t ngÃ y há»c ${dayName} cá»§a ${studentName} cho phá»¥ huynh:

${feedbackText}

ÄIá»‚M TRUNG BÃŒNH: ${avgRating.toFixed(1)}/5

YÃŠU Cáº¦U NGHIÃŠM NGáº¶T:
- Chá»‰ 1 cÃ¢u ngáº¯n gá»n (tá»‘i Ä‘a 30 tá»«)
- Táº­p trung vÃ o Ä‘iá»ƒm ná»•i báº­t nháº¥t trong ngÃ y
- Náº¿u cÃ³ nhiá»u mÃ´n, nÃªu mÃ´n tá»‘t nháº¥t hoáº·c cáº§n chÃº Ã½ nháº¥t
- Giá»ng Ä‘iá»‡u tÃ­ch cá»±c, khuyáº¿n khÃ­ch

VÃ­ dá»¥ format:
- Tá»‘t: "HÃ´m nay con há»c táº­p tÃ­ch cá»±c, Ä‘áº·c biá»‡t xuáº¥t sáº¯c á»Ÿ mÃ´n ToÃ¡n (5/5)."
- Trung bÃ¬nh: "NgÃ y há»c á»•n Ä‘á»‹nh vá»›i 3 mÃ´n, cáº§n chÃº Ã½ hÆ¡n á»Ÿ mÃ´n VÄƒn."
- Cáº§n cáº£i thiá»‡n: "Con cáº§n táº­p trung hÆ¡n, phá»¥ huynh há»— trá»£ Ã´n bÃ i mÃ´n Anh."

TÃ³m táº¯t ngÃ y ${dayName}:`

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
