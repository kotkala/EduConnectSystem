import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
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

export async function POST(request: NextRequest) {
  try {
    const { gradeData }: { gradeData: StudentGradeData } = await request.json()

    if (!gradeData || !gradeData.subjects || gradeData.subjects.length === 0) {
      return NextResponse.json(
        { error: 'Invalid grade data provided' },
        { status: 400 }
      )
    }

    // Note: Grade summary preparation removed as not needed for detailed analysis

    // Create detailed analysis prompt
    const prompt = `
Bạn là một giáo viên có kinh nghiệm, hãy phân tích bảng điểm của học sinh ${gradeData.studentName} (Mã HS: ${gradeData.studentCode}) và đưa ra nhận xét chi tiết.

Bảng điểm các môn học:
${gradeData.subjects.map(subject => {
  const midterm = subject.midtermGrade ? subject.midtermGrade.toFixed(1) : 'Chưa có'
  const final = subject.finalGrade ? subject.finalGrade.toFixed(1) : 'Chưa có'
  const average = subject.averageGrade ? subject.averageGrade.toFixed(1) : 'Chưa có'
  return `- ${subject.subjectName}: Giữa kỳ: ${midterm}, Cuối kỳ: ${final}, Trung bình: ${average}`
}).join('\n')}

Hãy đưa ra nhận xét theo cấu trúc sau:

**ĐIỂM MẠNH:**
- Liệt kê các môn học có điểm số tốt (từ 8.0 trở lên)
- Nhận xét về khả năng học tập ở những môn này

**CẦN CẢI THIỆN:**
- Liệt kê các môn học có điểm số chưa tốt (dưới 6.5)
- Đưa ra gợi ý cụ thể để cải thiện

**KHUYẾN NGHỊ:**
- Đưa ra lời khuyên tổng quát về phương pháp học tập
- Gợi ý cách phát huy điểm mạnh và khắc phục điểm yếu

Hãy viết bằng tiếng Việt, ngôn ngữ thân thiện, tích cực và khuyến khích học sinh.
`

    // Generate feedback using Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
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
