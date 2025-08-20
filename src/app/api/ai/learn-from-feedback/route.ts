import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get feedback analytics for AI learning
    const { data: feedbackStats, error: statsError } = await supabase
      .from('chat_feedback')
      .select(`
        rating,
        is_helpful,
        comment,
        user_question,
        ai_response,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (statsError) {
      console.error('Error fetching feedback stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    // Analyze feedback patterns
    const analytics = {
      totalFeedback: feedbackStats.length,
      helpfulCount: feedbackStats.filter(f => f.is_helpful).length,
      ratingDistribution: {
        excellent: feedbackStats.filter(f => f.rating === 'excellent').length,
        good: feedbackStats.filter(f => f.rating === 'good').length,
        average: feedbackStats.filter(f => f.rating === 'average').length,
        poor: feedbackStats.filter(f => f.rating === 'poor').length,
        very_poor: feedbackStats.filter(f => f.rating === 'very_poor').length
      },
      commonIssues: extractCommonIssues(feedbackStats),
      improvementSuggestions: generateImprovementSuggestions(feedbackStats)
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      learningInsights: {
        averageRating: calculateAverageRating(feedbackStats),
        helpfulPercentage: (analytics.helpfulCount / analytics.totalFeedback * 100).toFixed(1),
        topIssues: analytics.commonIssues.slice(0, 5),
        recommendations: analytics.improvementSuggestions
      }
    })

  } catch (error) {
    console.error('AI learning endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to extract common issues from feedback
function extractCommonIssues(feedbackData: {
  rating: string
  comment?: string
}[]) {
  const issues: { [key: string]: number } = {}
  
  feedbackData
    .filter(f => f.rating === 'poor' || f.rating === 'very_poor')
    .forEach(f => {
      if (f.comment) {
        // Simple keyword extraction for common issues
        const keywords = ['không chính xác', 'sai thông tin', 'không hiểu', 'không rõ ràng', 'thiếu thông tin']
        keywords.forEach(keyword => {
          if (f.comment?.toLowerCase().includes(keyword)) {
            issues[keyword] = (issues[keyword] || 0) + 1
          }
        })
      }
    })

  return Object.entries(issues)
    .sort(([,a], [,b]) => b - a)
    .map(([issue, count]) => ({ issue, count }))
}

// Helper function to generate improvement suggestions
function generateImprovementSuggestions(feedbackData: {
  rating: string
  is_helpful: boolean
}[]) {
  const suggestions = []
  
  const poorRatings = feedbackData.filter(f => f.rating === 'poor' || f.rating === 'very_poor')
  const excellentRatings = feedbackData.filter(f => f.rating === 'excellent')
  
  if (poorRatings.length > feedbackData.length * 0.2) {
    suggestions.push('Cần cải thiện độ chính xác của thông tin')
  }
  
  if (excellentRatings.length > feedbackData.length * 0.6) {
    suggestions.push('Duy trì chất lượng trả lời hiện tại')
  }
  
  const unhelpfulCount = feedbackData.filter(f => !f.is_helpful).length
  if (unhelpfulCount > feedbackData.length * 0.3) {
    suggestions.push('Cần tăng tính hữu ích của câu trả lời')
  }

  return suggestions
}

// Helper function to calculate average rating
function calculateAverageRating(feedbackData: {
  rating: string
}[]) {
  const ratingValues = {
    'excellent': 5,
    'good': 4,
    'average': 3,
    'poor': 2,
    'very_poor': 1
  }
  
  const totalScore = feedbackData.reduce((sum, f) => {
    return sum + (ratingValues[f.rating as keyof typeof ratingValues] || 0)
  }, 0)
  
  return feedbackData.length > 0 ? (totalScore / feedbackData.length).toFixed(2) : '0'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, learningContext } = body

    // Update AI learning context based on feedback
    // This could be used to adjust future responses
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({
        context_used: {
          ...learningContext,
          feedback_learned: true,
          learning_timestamp: new Date().toISOString()
        }
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('Error updating learning context:', updateError)
      return NextResponse.json({ error: 'Failed to update learning context' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'AI đã học từ phản hồi của bạn'
    })

  } catch (error) {
    console.error('AI learning POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
