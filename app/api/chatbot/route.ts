import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai'
import { createClient } from '@/utils/supabase/server'
import { checkParentPermissions } from '@/lib/utils/permission-utils'
import { functionDeclarations, handleFunctionCall } from './functions'

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

    // Get violations data for context
    const { data: violationsData } = await supabase
      .from('student_violations')
      .select(`
        id,
        severity,
        description,
        recorded_at,
        violation_date,
        student:profiles!student_violations_student_id_fkey(full_name, student_id),
        violation_type:violation_types(
          name,
          violation_categories(name)
        ),
        recorded_by:profiles!student_violations_recorded_by_fkey(full_name)
      `)
      .in('student_id', studentIds)
      .gte('recorded_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()) // Last 60 days
      .order('recorded_at', { ascending: false })
      .limit(20)

    // Prepare context for AI
    const studentNames = relationships?.map(rel => (rel as { profiles?: { full_name?: string } }).profiles?.full_name).filter(Boolean) as string[] || []
    const contextData = {
      students: studentNames,
      recentFeedback: feedbackData || [],
      recentGrades: gradeData || [],
      recentViolations: violationsData || []
    }

    // Create system instruction for the chatbot
    const systemInstruction = `Bạn là trợ lý AI thông minh cho phụ huynh học sinh tại trường học. Nhiệm vụ của bạn là:

1. Trả lời các câu hỏi về tình hình học tập và hành vi của con em họ
2. Cung cấp thông tin dựa trên dữ liệu phản hồi, điểm số và vi phạm thực tế
3. Phân tích xu hướng học tập và đưa ra nhận xét, đánh giá tổng quan
4. Đưa ra lời khuyên giáo dục tích cực và xây dựng
5. Luôn lịch sự, thân thiện và hỗ trợ

THÔNG TIN VỀ CON EM:
- Tên học sinh: ${studentNames.join(', ')}

DỮ LIỆU PHẢN HỒI GẦN ĐÂY (30 ngày):
${contextData.recentFeedback.map(f =>
  `- ${f.student_name} - ${f.subject_name}: ${f.rating}/5 sao, "${f.comment || f.ai_summary || 'Không có nhận xét'}" (${f.teacher_name}, tuần ${f.week_number})`
).join('\n')}

DỮ LIỆU ĐIỂM SỐ GẦN ĐÂY (30 ngày):
${contextData.recentGrades.map(g =>
  `- ${(g as { profiles?: { full_name?: string }; subjects?: { name_vietnamese?: string }; grade?: number; submission_date?: string }).profiles?.full_name} - ${(g as { subjects?: { name_vietnamese?: string } }).subjects?.name_vietnamese}: ${(g as { grade?: number }).grade} điểm (${new Date((g as { submission_date?: string }).submission_date || '').toLocaleDateString('vi-VN')})`
).join('\n')}

DỮ LIỆU VI PHẠM GẦN ĐÂY (60 ngày):
${contextData.recentViolations.map(v => {
  const violation = v as {
    student?: { full_name?: string; student_id?: string };
    violation_type?: { name?: string; violation_categories?: { name?: string } };
    severity?: string;
    description?: string;
    recorded_at?: string;
    recorded_by?: { full_name?: string };
  };
  const severityLabels: Record<string, string> = {
    minor: 'Nhẹ',
    moderate: 'Trung bình',
    serious: 'Nghiêm trọng',
    severe: 'Rất nghiêm trọng'
  };
  const description = violation.description ? `"${violation.description}"` : '';
  return `- ${violation.student?.full_name} (${violation.student?.student_id}): ${violation.violation_type?.violation_categories?.name} - ${violation.violation_type?.name} [${severityLabels[violation.severity || ''] || violation.severity}] ${description} (${new Date(violation.recorded_at || '').toLocaleDateString('vi-VN')}, ghi nhận bởi ${violation.recorded_by?.full_name})`;
}).join('\n')}

HƯỚNG DẪN PHÂN TÍCH:
- Khi được hỏi về tình hình học tập, hãy phân tích cả điểm số, phản hồi và vi phạm
- Đưa ra nhận xét tổng quan về xu hướng tiến bộ hoặc cần cải thiện
- Nếu có vi phạm, hãy phân tích mức độ nghiêm trọng và đưa ra lời khuyên
- Luôn kết thúc bằng gợi ý cụ thể để phụ huynh hỗ trợ con em

Hãy trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin. Nếu không có dữ liệu về câu hỏi cụ thể, hãy thông báo và đề xuất cách khác để phụ huynh có thể theo dõi.`

    // Prepare conversation history for AI
    const history = conversationHistory.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    // Create chat session with function calling
    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000,
        tools: [{ functionDeclarations }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO
          }
        }
      },
      history: history
    })

    // Send message and get response
    const response = await chat.sendMessage({
      message: message
    })

    // Handle function calls if present
    let finalResponse = response.text || ''
    const functionResults: Array<{ name: string; result: unknown }> = []

    if (response.functionCalls && response.functionCalls.length > 0) {
      // Execute function calls
      for (const functionCall of response.functionCalls) {
        if (functionCall.name && functionCall.args) {
          const result = await handleFunctionCall(functionCall.name, functionCall.args, userId)
          functionResults.push({
            name: functionCall.name,
            result: result
          })
        }
      }

      // Send function results back to the model for final response
      if (functionResults.length > 0) {
        const finalModelResponse = await chat.sendMessage({
          message: `Based on the function results: ${JSON.stringify(functionResults.map(fr => fr.result))}`
        })

        finalResponse = finalModelResponse.text || finalResponse
      }
    }

    return NextResponse.json({
      success: true,
      response: finalResponse,
      functionCalls: response.functionCalls?.length || 0,
      contextUsed: {
        studentsCount: studentNames.length,
        feedbackCount: contextData.recentFeedback.length,
        gradesCount: contextData.recentGrades.length,
        violationsCount: contextData.recentViolations.length
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
