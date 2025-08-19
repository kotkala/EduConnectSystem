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
      .from('student_feedback')
      .select(`
        rating,
        feedback_text,
        created_at,
        teacher_id,
        student_id,
        timetable_event_id,
        subject_id
      `)
      .in('student_id', studentIds)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    // Get comprehensive data for context building
    const [subjectsResult, teachersResult, studentsResult, notificationsResult, academicYearResult, semesterResult] = await Promise.all([
      // Get subjects
      supabase.from('subjects').select('id, name_vietnamese, name_english, category'),
      // Get teacher profiles
      supabase.from('profiles').select('id, full_name').eq('role', 'teacher'),
      // Get student profiles
      supabase.from('profiles').select('id, full_name, student_id').in('id', studentIds),
      // Get recent notifications
      supabase.from('notifications').select(`
        id, title, content, created_at, target_roles, target_classes,
        sender:profiles!notifications_sender_id_fkey(full_name, role)
      `).eq('is_active', true).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false }).limit(10),
      // Get current academic year
      supabase.from('academic_years').select('id, name, start_date, end_date, is_current').eq('is_current', true).single(),
      // Get current semester
      supabase.from('semesters').select('id, name, semester_number, start_date, end_date, is_current').eq('is_current', true).single()
    ])

    // Get grade data for context
    const { data: gradeData } = await supabase
      .from('submission_grades')
      .select(`
        grade,
        submission_date,
        subject_id,
        student_id
      `)
      .in('student_id', studentIds)
      .gte('submission_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('submission_date', { ascending: false })
      .limit(30)

    // Get official grade submissions (semester reports)
    const { data: gradeSubmissions } = await supabase
      .from('student_grade_submissions')
      .select(`
        id,
        submission_name,
        status,
        created_at,
        student_id,
        academic_year:academic_years(name),
        semester:semesters(name),
        grades:individual_subject_grades(
          subject_id,
          midterm_grade,
          final_grade,
          average_grade,
          notes
        )
      `)
      .in('student_id', studentIds)
      .eq('status', 'sent_to_teacher')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get violations data for context
    const { data: violationsData } = await supabase
      .from('student_violations')
      .select(`
        id,
        severity,
        description,
        recorded_at,
        violation_date,
        student:profiles!student_id(full_name, student_id),
        violation_type:violation_types(
          name,
          violation_categories(name)
        ),
        recorded_by:profiles!recorded_by(full_name)
      `)
      .in('student_id', studentIds)
      .gte('recorded_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(20)

    // Build lookup maps for context
    const subjects = subjectsResult.data || []
    const teachers = teachersResult.data || []
    const students = studentsResult.data || []
    const notifications = notificationsResult.data || []
    const currentAcademicYear = academicYearResult.data
    const currentSemester = semesterResult.data

    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    const teacherMap = new Map(teachers.map(t => [t.id, t]))
    const studentMap = new Map(students.map(s => [s.id, s]))

    // Prepare context for AI
    const studentNames = relationships?.map(rel => (rel as { profiles?: { full_name?: string } }).profiles?.full_name).filter(Boolean) as string[] || []
    const contextData = {
      students: studentNames,
      recentFeedback: feedbackData || [],
      recentGrades: gradeData || [],
      gradeSubmissions: gradeSubmissions || [],
      recentViolations: violationsData || [],
      notifications: notifications || [],
      currentAcademicYear,
      currentSemester,
      subjectMap,
      teacherMap,
      studentMap
    }

    // Create system instruction for the chatbot
    const systemInstruction = `Bạn là trợ lý AI thông minh cho phụ huynh học sinh tại trường học. Nhiệm vụ của bạn là:

1. Trả lời các câu hỏi về tình hình học tập và hành vi của con em họ
2. Cung cấp thông tin dựa trên dữ liệu phản hồi, điểm số và bảng điểm chính thức
3. Phân tích xu hướng học tập qua các học kỳ và đưa ra nhận xét chi tiết
4. Cung cấp thông tin về giáo viên chủ nhiệm và giáo viên bộ môn
5. Trả lời về thông báo, lịch thi, sự kiện và hoạt động của trường
6. Cung cấp thông tin về năm học, học kỳ và lịch học
7. Hướng dẫn sử dụng các tính năng của cổng thông tin phụ huynh
8. Đưa ra lời khuyên giáo dục tích cực và xây dựng
9. Luôn lịch sự, thân thiện và hỗ trợ

THÔNG TIN VỀ CON EM:
- Tên học sinh: ${studentNames.join(', ')}

DỮ LIỆU PHẢN HỒI GẦN ĐÂY (30 ngày):
${contextData.recentFeedback.map((f: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const student = contextData.studentMap.get(f.student_id)
  const teacher = contextData.teacherMap.get(f.teacher_id)
  const subject = contextData.subjectMap.get(f.subject_id)

  const studentName = student?.full_name || 'Unknown Student'
  const subjectName = subject?.name_vietnamese || 'Unknown Subject'
  const teacherName = teacher?.full_name || 'Unknown Teacher'
  const rating = f.rating || 'N/A'
  const comment = f.feedback_text || 'Không có nhận xét'
  const date = new Date(f.created_at).toLocaleDateString('vi-VN')
  return `- ${studentName} - ${subjectName}: ${rating}/5 sao, "${comment}" (${teacherName}, ${date})`
}).join('\n')}

THÔNG BÁO GẦN ĐÂY (7 ngày):
${contextData.notifications.map((notif: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const title = notif.title || 'Thông báo'
  const content = notif.content || 'Không có nội dung'
  const sender = notif.sender?.full_name || 'Nhà trường'
  const date = new Date(notif.created_at).toLocaleDateString('vi-VN')
  return `- ${title}: ${content.substring(0, 100)}... (${sender}, ${date})`
}).join('\n')}

THÔNG TIN NĂM HỌC VÀ HỌC KỲ:
- Năm học hiện tại: ${contextData.currentAcademicYear?.name || 'Chưa xác định'} (${contextData.currentAcademicYear ? new Date(contextData.currentAcademicYear.start_date).toLocaleDateString('vi-VN') + ' - ' + new Date(contextData.currentAcademicYear.end_date).toLocaleDateString('vi-VN') : 'N/A'})
- Học kỳ hiện tại: ${contextData.currentSemester?.name || 'Chưa xác định'} (Học kỳ ${contextData.currentSemester?.semester_number || 'N/A'})

DỮ LIỆU ĐIỂM SỐ GẦN ĐÂY (30 ngày):
${contextData.recentGrades.map((g: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const student = contextData.studentMap.get(g.student_id)
  const subject = contextData.subjectMap.get(g.subject_id)

  const studentName = student?.full_name || 'Unknown Student'
  const subjectName = subject?.name_vietnamese || 'Unknown Subject'
  const grade = g.grade || 'N/A'
  const date = new Date(g.submission_date || '').toLocaleDateString('vi-VN')
  return `- ${studentName} - ${subjectName}: ${grade} điểm (${date})`
}).join('\n')}

BẢNG ĐIỂM CHÍNH THỨC (Học kỳ):
${contextData.gradeSubmissions.map((submission: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const student = contextData.studentMap.get(submission.student_id)
  const studentName = student?.full_name || 'Unknown Student'
  const academicYear = submission.academic_year?.name || 'N/A'
  const semester = submission.semester?.name || 'N/A'
  const submissionName = submission.submission_name || 'Bảng điểm'
  const date = new Date(submission.created_at).toLocaleDateString('vi-VN')

  const gradesSummary = submission.grades?.map((grade: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const subject = contextData.subjectMap.get(grade.subject_id)
    const subjectName = subject?.name_vietnamese || 'Unknown Subject'
    return `${subjectName}: TB=${grade.average_grade || 'N/A'} (GK=${grade.midterm_grade || 'N/A'}, CK=${grade.final_grade || 'N/A'})`
  }).join(', ') || 'Chưa có điểm'

  return `- ${studentName} - ${submissionName} (${semester} ${academicYear}, ${date}): ${gradesSummary}`
}).join('\n')}

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

    // Convert history format for Google GenAI (assistant -> model)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convertedHistory = history.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
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
      history: convertedHistory
    })

    // Helper functions to reduce cognitive complexity
    async function processFunctionCalls(
      functionCalls: Array<{ name?: string; args?: Record<string, unknown> }>,
      userId: string,
      functionResults: Array<{ name: string; result: unknown }>,
      controller: ReadableStreamDefaultController<Uint8Array>,
      encoder: TextEncoder,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chat: any
    ): Promise<void> {
      // Execute function calls
      for (const functionCall of functionCalls) {
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
    }

    function processTextChunk(
      chunk: { text?: string },
      controller: ReadableStreamDefaultController<Uint8Array>,
      encoder: TextEncoder
    ): void {
      const textChunk = {
        type: 'text',
        data: chunk.text
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(textChunk)}\n\n`))
    }

    function sendCompletionSignal(
      controller: ReadableStreamDefaultController<Uint8Array>,
      encoder: TextEncoder,
      studentNames: string[],
      contextData: { recentFeedback: unknown[]; recentGrades: unknown[]; recentViolations: unknown[] },
      functionResults: Array<{ name: string; result: unknown }>
    ): void {
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
    }

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

          // Process the stream using helper functions
          for await (const chunk of response) {
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              await processFunctionCalls(chunk.functionCalls, userId, functionResults, controller, encoder, chat)
            } else if (chunk.text) {
              processTextChunk(chunk, controller, encoder)
            }
          }

          // Send completion signal using helper function
          sendCompletionSignal(controller, encoder, studentNames, contextData, functionResults)
          
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
