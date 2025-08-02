import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'
import { checkParentPermissions } from '@/lib/utils/permission-utils'

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    // Check parent permissions
    const { userId } = await checkParentPermissions()
    
    const { message, conversationHistory = [] } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get parent's children data for context
    const supabase = await createClient()
    
    // Get parent-student relationships
    const { data: relationships, error: relError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        profiles!parent_student_relationships_student_id_fkey(
          full_name,
          student_id
        )
      `)
      .eq('parent_id', userId)

    if (relError) {
      throw new Error(relError.message)
    }

    const studentIds = relationships?.map(rel => rel.student_id) || []
    
    // Get recent feedback data for context
    const { data: feedbackData } = await supabase
      .from('parent_feedback_with_ai_summary')
      .select(`
        student_name,
        subject_name,
        teacher_name,
        rating,
        comment,
        ai_summary,
        feedback_created_at,
        week_number
      `)
      .in('student_id', studentIds)
      .gte('feedback_created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('feedback_created_at', { ascending: false })
      .limit(50)

    // Get grade data for context
    const { data: gradeData } = await supabase
      .from('submission_grades')
      .select(`
        grade,
        submission_date,
        subjects(name_vietnamese),
        profiles!submission_grades_student_id_fkey(full_name)
      `)
      .in('student_id', studentIds)
      .gte('submission_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('submission_date', { ascending: false })
      .limit(30)

    // Prepare context for AI
    const studentNames = relationships?.map(rel => (rel as { profiles?: { full_name?: string } }).profiles?.full_name).filter(Boolean) as string[] || []
    const contextData = {
      students: studentNames,
      recentFeedback: feedbackData || [],
      recentGrades: gradeData || []
    }

    // Create system instruction for the chatbot
    const systemInstruction = `Bạn là trợ lý AI thông minh cho phụ huynh học sinh tại trường học. Nhiệm vụ của bạn là:

1. Trả lời các câu hỏi về tình hình học tập của con em họ
2. Cung cấp thông tin dựa trên dữ liệu phản hồi và điểm số thực tế
3. Đưa ra lời khuyên giáo dục tích cực và xây dựng
4. Luôn lịch sự, thân thiện và hỗ trợ

THÔNG TIN VỀ CON EM:
- Tên học sinh: ${studentNames.join(', ')}

DỮ LIỆU PHẢN HỒI GẦN ĐÂY:
${contextData.recentFeedback.map(f => 
  `- ${f.student_name} - ${f.subject_name}: ${f.rating}/5 sao, "${f.comment || f.ai_summary || 'Không có nhận xét'}" (${f.teacher_name}, tuần ${f.week_number})`
).join('\n')}

DỮ LIỆU ĐIỂM SỐ GẦN ĐÂY:
${contextData.recentGrades.map(g =>
  `- ${(g as { profiles?: { full_name?: string }; subjects?: { name_vietnamese?: string }; grade?: number; submission_date?: string }).profiles?.full_name} - ${(g as { subjects?: { name_vietnamese?: string } }).subjects?.name_vietnamese}: ${(g as { grade?: number }).grade} điểm (${new Date((g as { submission_date?: string }).submission_date || '').toLocaleDateString('vi-VN')})`
).join('\n')}

Hãy trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin. Nếu không có dữ liệu về câu hỏi cụ thể, hãy thông báo và đề xuất cách khác để phụ huynh có thể theo dõi.`

    // Prepare conversation history for AI
    const history = conversationHistory.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    // Create chat session
    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000
      },
      history: history
    })

    // Send message and get response
    const response = await chat.sendMessage({
      message: message
    })

    return NextResponse.json({
      success: true,
      response: response.text,
      contextUsed: {
        studentsCount: studentNames.length,
        feedbackCount: contextData.recentFeedback.length,
        gradesCount: contextData.recentGrades.length
      }
    })

  } catch (error) {
    console.error('Chatbot API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
}
