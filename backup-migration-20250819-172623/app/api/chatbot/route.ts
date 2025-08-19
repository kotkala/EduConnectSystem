import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai'
import { checkParentPermissions } from '@/lib/utils/permission-utils'
import { functionDeclarations, handleFunctionCall } from './functions'
import {
  getFormattedParentContextData,
  formatFeedbackForDisplay,
  formatGradeForDisplay,
  formatViolationForDisplay
} from '@/lib/utils/supabase-query-utils'

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

    // Get parent's children data for context using shared utilities
    const contextData = await getFormattedParentContextData(userId)

    // Create system instruction for the chatbot
    const systemInstruction = `Bạn là trợ lý AI thông minh cho phụ huynh học sinh tại trường học. Nhiệm vụ của bạn là:

1. Trả lời các câu hỏi về tình hình học tập và hành vi của con em họ
2. Cung cấp thông tin dựa trên dữ liệu phản hồi, điểm số và vi phạm thực tế
3. Phân tích xu hướng học tập và đưa ra nhận xét, đánh giá tổng quan
4. Đưa ra lời khuyên giáo dục tích cực và xây dựng
5. Luôn lịch sự, thân thiện và hỗ trợ

THÔNG TIN VỀ CON EM:
- Tên học sinh: ${contextData.students.join(', ')}

DỮ LIỆU PHẢN HỒI GẦN ĐÂY (30 ngày):
${contextData.recentFeedback.map(formatFeedbackForDisplay).join('\n')}

DỮ LIỆU ĐIỂM SỐ GẦN ĐÂY (30 ngày):
${contextData.recentGrades.map(formatGradeForDisplay).join('\n')}

DỮ LIỆU VI PHẠM GẦN ĐÂY (60 ngày):
${contextData.recentViolations.map(formatViolationForDisplay).join('\n')}

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
        studentsCount: contextData.students.length,
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
