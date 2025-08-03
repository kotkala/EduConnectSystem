import { NextRequest } from 'next/server'
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai'
import { createClient } from '@/utils/supabase/server'
import { checkParentPermissions } from '@/lib/utils/permission-utils'
import { functionDeclarations, handleFunctionCall } from '../functions'

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = await createClient()
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = user.id

    // Check parent permissions
    try {
      await checkParentPermissions()
    } catch (error) {
      console.error('Permission check failed:', error)
      return new Response(
        JSON.stringify({ error: 'Access denied. Parent role required.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get parent-student relationships
    const { data: relationships } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        profiles!parent_student_relationships_student_id_fkey(full_name)
      `)
      .eq('parent_id', userId)

    if (!relationships || relationships.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No student relationships found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const studentIds = relationships.map(rel => rel.student_id)

    // Get feedback data for context
    const { data: feedbackData } = await supabase
      .from('teacher_feedback')
      .select(`
        rating,
        comment,
        ai_summary,
        week_number,
        student_name,
        subject_name,
        teacher_name
      `)
      .in('student_id', studentIds)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

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
      .gte('submission_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
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
      .gte('recorded_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
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

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send message and get streaming response
          const response = await chat.sendMessageStream({
            message: message
          })

          // Handle function calls if present
          const functionResults: Array<{ name: string; result: unknown }> = []
          
          // Process the stream
          for await (const chunk of response) {
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              // Execute function calls
              for (const functionCall of chunk.functionCalls) {
                if (functionCall.name && functionCall.args) {
                  const result = await handleFunctionCall(functionCall.name, functionCall.args, userId)
                  functionResults.push({
                    name: functionCall.name,
                    result: result
                  })
                }
              }
              
              // Send function results as a chunk
              if (functionResults.length > 0) {
                const functionChunk = {
                  type: 'function_results',
                  data: functionResults
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(functionChunk)}\n\n`))
                
                // Get final response with function results
                const finalResponse = await chat.sendMessageStream({
                  message: `Based on the function results: ${JSON.stringify(functionResults.map(fr => fr.result))}`
                })
                
                for await (const finalChunk of finalResponse) {
                  if (finalChunk.text) {
                    const textChunk = {
                      type: 'text',
                      data: finalChunk.text
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(textChunk)}\n\n`))
                  }
                }
              }
            } else if (chunk.text) {
              // Send text chunk
              const textChunk = {
                type: 'text',
                data: chunk.text
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(textChunk)}\n\n`))
            }
          }

          // Send completion signal
          const completionChunk = {
            type: 'complete',
            data: {
              contextUsed: {
                studentsCount: studentNames.length,
                feedbackCount: contextData.recentFeedback.length,
                gradesCount: contextData.recentGrades.length,
                violationsCount: contextData.recentViolations.length
              },
              functionCalls: functionResults.length
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completionChunk)}\n\n`))
          
        } catch (error) {
          console.error('Streaming error:', error)
          const errorChunk = {
            type: 'error',
            data: { message: 'An error occurred while processing your request' }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chatbot streaming error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
