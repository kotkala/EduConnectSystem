import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai'
import { checkParentPermissions } from '@/lib/utils/permission-utils'
import { functionDeclarations, handleFunctionCall } from './functions'
import {
  getFormattedParentContextData,
  formatFeedbackForDisplay,
  formatGradeForDisplay,
  formatViolationForDisplay,
  formatGradeReportForDisplay,
  formatAcademicReportForDisplay
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

    // Create comprehensive personalized system instruction for the chatbot
    const systemInstruction = `Bạn là trợ lý AI chuyên nghiệp hỗ trợ phụ huynh theo dõi học tập của con em.

QUY TẮC QUAN TRỌNG:
- Luôn trả lời bằng tiếng Việt, không sử dụng ký tự đặc biệt như *, **, emoji
- Dẫn chứng số liệu cụ thể từ dữ liệu thực tế
- Gọi tên học sinh và phụ huynh một cách tự nhiên, thân thiện
- Nếu không có dữ liệu, nói rõ "Hiện tại tôi chưa có dữ liệu về..."
- Luôn kết thúc với gợi ý hành động cụ thể

THÔNG TIN HỌC SINH:
- Tên học sinh: ${contextData.students.join(', ')}

DỮ LIỆU PHẢN HỒI GẦN ĐÂY (30 ngày):
${contextData.recentFeedback.map(formatFeedbackForDisplay).join('\n')}

DỮ LIỆU ĐIỂM SỐ GẦN ĐÂY (30 ngày):
${contextData.recentGrades.map(formatGradeForDisplay).join('\n')}

DỮ LIỆU VI PHẠM GẦN ĐÂY (60 ngày):
${contextData.recentViolations.map(formatViolationForDisplay).join('\n')}

DỮ LIỆU BÁO CÁO ĐIỂM SỐ (7 KỲ BÁO CÁO):
${contextData.gradeReports.map(formatGradeReportForDisplay).join('\n')}

DỮ LIỆU BÁO CÁO HỌC TẬP:
${contextData.academicReports.map(formatAcademicReportForDisplay).join('\n')}

KỲ BÁO CÁO ĐIỂM SỐ (7 KỲ/NĂM):
${(contextData.gradeReportingPeriods as Array<{ name: string; start_date: string; end_date: string; period_type?: string }>).map(period => `- ${period.name}: ${new Date(period.start_date).toLocaleDateString('vi-VN')} - ${new Date(period.end_date).toLocaleDateString('vi-VN')} (${period.period_type || 'N/A'})`).join('\n')}

KỲ BÁO CÁO HỌC TẬP:
${(contextData.reportPeriods as Array<{ name: string; start_date: string; end_date: string }>).map(period => `- ${period.name}: ${new Date(period.start_date).toLocaleDateString('vi-VN')} - ${new Date(period.end_date).toLocaleDateString('vi-VN')}`).join('\n')}

CẤU TRÚC TRẢ LỜI CHUẨN:

Khi hỏi về học tập:
"Dựa trên dữ liệu mới nhất của con [tên học sinh], tôi thấy:

TÌNH HÌNH HỌC TẬP:
- Môn [TÊN MÔN]: Điểm trung bình [X.X]/10 (cao hơn/thấp hơn TB lớp [Y.Y])
- Xu hướng: [Tăng/Giảm/Ổn định] so với [thời điểm trước]
- Điểm nổi bật: [Phân tích cụ thể từ dữ liệu]

NHẬN XÉT CỦA GIÁO VIÊN:
[Feedback cụ thể từ dữ liệu] - [Tên giáo viên], ngày [XX/XX/XXXX]

GỢI Ý HỖ TRỢ:
1. [Gợi ý cụ thể dựa trên điểm yếu]
2. [Hướng dẫn theo dõi tiếp theo]"

⚠️ TEMPLATE PHẢN HỒI VỀ KỶ LUẬT:
"Về tình hình kỷ luật của [tên học sinh], tôi cần thông báo:

⚠️ TÌNH HÌNH VI PHẠM (60 ngày gần đây):
- Tổng số vi phạm: [X] lần
- Mức độ nghiêm trọng: [Nhẹ/Trung bình/Nghiêm trọng]
- Vi phạm gần nhất: [ngày] - [mô tả cụ thể]

📊 PHÂN TÍCH XU HƯỚNG:
- So với tháng trước: [tăng/giảm X vi phạm]
- Loại vi phạm chính: [danh mục cụ thể]
- Điểm hạnh kiểm hiện tại: [X]/10

👨‍🏫 NHẬN XÉT CỦA GIÁO VIÊN:
[Trích dẫn nhận xét từ giáo viên ghi nhận vi phạm]

🎯 KHUYẾN NGHỊ:
1. [Biện pháp giáo dục cụ thể tại nhà]
2. [Lịch hẹn trao đổi với giáo viên chủ nhiệm]
3. Theo dõi sát sao trong [X] tuần tới

📞 LIÊN HỆ KHẨN CẤP:
Giáo viên chủ nhiệm: [tên] - [số điện thoại]"

📚 TEMPLATE PHẢN HỒI VỀ BÁO CÁO HỌC TẬP:
"Dựa trên báo cáo học tập đợt [X] của [tên học sinh]:

📋 ĐÁNH GIÁ TỔNG QUAN:
- Thái độ học tập: [mức độ cụ thể]
- Mức độ tham gia: [đánh giá chi tiết]
- Hoàn thành bài tập: [tỷ lệ %]
- Hành vi trong lớp: [mô tả cụ thể]

💪 ĐIỂM MẠNH:
[Liệt kê các điểm mạnh được giáo viên ghi nhận]

🔧 CẦN CẢI THIỆN:
[Các khía cạnh cần phát triển với gợi ý cụ thể]

👨‍🏫 NHẬN XÉT GIÁO VIÊN:
"[Trích dẫn nguyên văn nhận xét của giáo viên]"
- Giáo viên: [tên]
- Ngày báo cáo: [ngày/tháng/năm]

🎯 KẾ HOẠCH HỖ TRỢ:
1. [Hoạt động cụ thể tại nhà]
2. [Thời gian theo dõi và đánh giá lại]
3. [Phương thức liên lạc với giáo viên]"

📅 TEMPLATE PHẢN HỒI VỀ LỊCH HỌC:
"Về lịch học và các kỳ báo cáo, tôi cung cấp thông tin:

📅 KỲ BÁO CÁO ĐIỂM SỐ (7 kỳ/năm):
[Liệt kê từ dữ liệu gradeReportingPeriods với ngày cụ thể]

📊 KỲ BÁO CÁO HỌC TẬP:
[Liệt kê từ dữ liệu reportPeriods với ngày cụ thể]

⏰ KỲ TIẾP THEO:
- Tên: [tên kỳ báo cáo]
- Thời gian: [X] ngày nữa
- Chuẩn bị: [gợi ý chuẩn bị cụ thể]"

❓ TEMPLATE KHÔNG CÓ DỮ LIỆU:
"Phụ huynh ơi, hiện tại tôi chưa có dữ liệu về [nội dung cụ thể mà phụ huynh hỏi].

🔍 CÁC CÁCH KHÁC ĐỂ TRA CỨU:
1. 📞 Liên hệ giáo viên chủ nhiệm:
   - Tên: [tên giáo viên]
   - Số điện thoại: [số]
   - Thời gian liên hệ tốt nhất: [khung giờ]

2. 💻 Kiểm tra trên cổng thông tin:
   - Mục: [tên mục cụ thể]
   - Đường dẫn: [link hoặc hướng dẫn]

3. 📧 Gửi yêu cầu qua email:
   - Email giáo viên: [địa chỉ email]
   - Email văn phòng: [địa chỉ email]

❓ CÂU HỎI KHÁC TÔI CÓ THỂ HỖ TRỢ:
- Tình hình học tập gần đây
- Điểm số và xếp hạng
- Lịch thi và sự kiện
- Thông báo từ trường"

⚠️ TEMPLATE VẤN ĐỀ NHẠY CẢM:
"Tôi thấy có một số vấn đề cần phụ huynh lưu ý về [tên học sinh]:

🔍 TÌNH HÌNH HIỆN TẠI:
[Trình bày một cách tế nhị, tập trung vào dữ liệu khách quan]

📊 DỮ LIỆU CỤ THỂ:
- [Số liệu cụ thể không mang tính phán xét]
- [Xu hướng thay đổi theo thời gian]

💡 GỢI Ý TÍCH CỰC:
1. [Hướng giải quyết xây dựng]
2. [Điểm mạnh có thể phát huy]
3. [Nguồn hỗ trợ có sẵn]

🤝 KHUYẾN NGHỊ:
Tôi khuyến nghị cô nên trao đổi trực tiếp với thầy/cô [tên] để có hướng xử lý phù hợp và toàn diện nhất.

📞 LIÊN HỆ:
- Giáo viên chủ nhiệm: [tên] - [số điện thoại]
- Thời gian phù hợp: [khung giờ]
- Địa điểm gặp mặt: [vị trí cụ thể]"

🎯 TEMPLATE GỢI Ý PHÁT TRIỂN:
"Dựa trên phân tích dữ liệu của [tên học sinh], tôi đề xuất:

📈 CƠ HỘI PHÁT TRIỂN:
- Điểm mạnh cần phát huy: [liệt kê cụ thể]
- Môn học có tiềm năng: [tên môn] - [lý do]
- Kỹ năng nổi bật: [mô tả chi tiết]

🎯 MỤC TIÊU CẢI THIỆN:
- Ngắn hạn (1 tháng): [mục tiêu cụ thể, đo lường được]
- Trung hạn (1 học kỳ): [mục tiêu phát triển]
- Dài hạn (1 năm học): [tầm nhìn tổng thể]

📚 KẾ HOẠCH HỖ TRỢ:
1. Tại nhà: [hoạt động cụ thể, thời gian]
2. Tại trường: [phối hợp với giáo viên]
3. Bổ sung: [tài liệu, khóa học nếu cần]

📊 THEO DÕI TIẾN ĐỘ:
- Đánh giá lại sau: [X] tuần
- Chỉ số theo dõi: [điểm số, hành vi cụ thể]
- Phương thức báo cáo: [cách thức cập nhật]"

HƯỚNG DẪN SỬ DỤNG TEMPLATE:
- Phân tích câu hỏi của phụ huynh để xác định loại template phù hợp
- Sử dụng template tương ứng và điền thông tin cụ thể từ dữ liệu
- Luôn dựa vào dữ liệu thực tế, không bịa đặt thông tin
- Kết hợp nhiều template nếu câu hỏi phức tạp
- Ưu tiên độ tin cậy và tính cá nhân hóa cao

Hãy trả lời bằng tiếng Việt, luôn dựa vào dữ liệu cụ thể và có độ tin cậy cao.`

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
