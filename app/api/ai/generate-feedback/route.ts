import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
})

interface SubjectGrade {
  subjectName: string
  midtermGrade?: number
  finalGrade?: number
  averageGrade?: number
}

interface StudentGradeData {
  studentName: string
  studentId: string
  studentCode: string
  subjects: SubjectGrade[]
}

interface FeedbackRequest {
  gradeData: StudentGradeData
  style?: 'friendly' | 'serious' | 'encouraging' | 'understanding'
  length?: 'short' | 'medium' | 'long'
}

export async function POST(request: NextRequest) {
  try {
    const { gradeData, style = 'friendly', length = 'medium' }: FeedbackRequest = await request.json()

    if (!gradeData?.subjects?.length) {
      return NextResponse.json(
        { error: 'Invalid grade data provided' },
        { status: 400 }
      )
    }

    // Note: Grade summary preparation removed as not needed for detailed analysis

    // Analyze grade patterns for more specific feedback
    const subjectsWithGrades = gradeData.subjects.filter(s => s.averageGrade !== undefined)
    const averageGrades = subjectsWithGrades.map(s => s.averageGrade!).sort((a, b) => b - a)
    const overallAverage = averageGrades.length > 0 ? (averageGrades.reduce((sum, grade) => sum + grade, 0) / averageGrades.length) : 0

    const excellentSubjects = subjectsWithGrades.filter(s => s.averageGrade! >= 8.0)
    const goodSubjects = subjectsWithGrades.filter(s => s.averageGrade! >= 6.5 && s.averageGrade! < 8.0)
    const weakSubjects = subjectsWithGrades.filter(s => s.averageGrade! < 6.5)

    const strongestSubject = subjectsWithGrades.length > 0 ? subjectsWithGrades.reduce((prev, current) => (prev.averageGrade! > current.averageGrade!) ? prev : current, subjectsWithGrades[0]) : null
    const weakestSubject = subjectsWithGrades.length > 0 ? subjectsWithGrades.reduce((prev, current) => (prev.averageGrade! < current.averageGrade!) ? prev : current, subjectsWithGrades[0]) : null

    // Style-specific tone instructions
    const styleInstructions = {
      friendly: 'Viết với giọng điệu gần gũi, thân thiện như một người bạn đồng hành. Sử dụng từ ngữ ấm áp, dễ gần.',
      serious: 'Viết với giọng điệu nghiêm túc, kỷ luật nhưng vẫn tôn trọng. Tập trung vào kỷ luật học tập và trách nhiệm.',
      encouraging: 'Viết với giọng điệu khích lệ, động viên tích cực. Tập trung vào tiềm năng và khả năng phát triển.',
      understanding: 'Viết với giọng điệu lắng nghe, thấu hiểu. Thể hiện sự đồng cảm và hiểu biết về hoàn cảnh học sinh.'
    }

    // Length-specific instructions
    const lengthInstructions = {
      short: 'Viết ngắn gọn trong 1-2 câu, đi thẳng vào vấn đề chính.',
      medium: 'Viết trung bình trong 3-5 câu, cân bằng giữa khen ngợi và đề xuất.',
      long: 'Viết chi tiết trong 6 câu trở lên, phân tích kỹ lưỡng từng khía cạnh.'
    }

    // Create parent-focused feedback prompt
    const prompt = `
Tôi là giáo viên chủ nhiệm của con bạn ${gradeData.studentName} (${gradeData.studentCode}). Tôi viết nhận xét này để chia sẻ với gia đình về tình hình học tập của con:

BẢNG ĐIỂM KỲ NÀY:
${gradeData.subjects.map(subject => {
  const midterm = subject.midtermGrade ? subject.midtermGrade.toFixed(1) : 'Chưa có'
  const final = subject.finalGrade ? subject.finalGrade.toFixed(1) : 'Chưa có'
  const average = subject.averageGrade ? subject.averageGrade.toFixed(1) : 'Chưa có'
  return `• ${subject.subjectName}: Giữa kỳ ${midterm} - Cuối kỳ ${final} - TB: ${average}`
}).join('\n')}

TỔNG QUAN:
- Điểm trung bình chung: ${overallAverage.toFixed(1)}
- Số môn xuất sắc (≥8.0): ${excellentSubjects.length}
- Số môn khá (6.5-7.9): ${goodSubjects.length}
- Số môn cần cố gắng (<6.5): ${weakSubjects.length}
- Môn học tốt nhất: ${strongestSubject ? `${strongestSubject.subjectName} (${strongestSubject.averageGrade!.toFixed(1)})` : 'Chưa xác định'}
- Môn cần chú ý: ${weakestSubject ? `${weakestSubject.subjectName} (${weakestSubject.averageGrade!.toFixed(1)})` : 'Chưa xác định'}

PHONG CÁCH VIẾT: ${styleInstructions[style]}
ĐỘ DÀI: ${lengthInstructions[length]}

Hãy viết nhận xét gửi tới phụ huynh theo phong cách và độ dài đã chỉ định:

**Điểm tích cực:** [Khen ngợi cụ thể những điểm mạnh của con]
**Cần quan tâm:** [Chỉ ra nhẹ nhàng những môn cần cải thiện]
**Đề xuất hỗ trợ:** [Gợi ý cách gia đình có thể giúp con học tốt hơn]

Viết bằng tiếng Việt, theo đúng phong cách và độ dài đã yêu cầu. Tránh từ ngữ tiêu cực, tập trung vào sự phát triển tích cực của con.
`

    // Determine max tokens based on length
    const maxTokens = {
      short: 100,
      medium: 200,
      long: 400
    }

    // Generate feedback using Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: maxTokens[length],
      }
    })

    const feedback = response.text || 'Không thể tạo nhận xét. Vui lòng thử lại.'

    return NextResponse.json({
      success: true,
      feedback: feedback.trim()
    })

  } catch (error) {
    console.error('Error generating AI feedback:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
