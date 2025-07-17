import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Sample violation rules for each category
const SAMPLE_VIOLATIONS = [
  // 15 phút truy bài đầu giờ
  {
    code: 'VP001',
    name: 'Không chuẩn bị bài trước khi vào lớp',
    description: 'Học sinh không chuẩn bị bài hoặc thiếu tài liệu khi được giáo viên truy bài đầu giờ',
    category: '15 phút truy bài đầu giờ',
    severity: 'minor',
    default_action: 'Nhắc nhở và yêu cầu chuẩn bị bài cho tiết sau'
  },
  {
    code: 'VP002', 
    name: 'Trả bài sai hoặc không trả lời được',
    description: 'Học sinh không thể trả lời câu hỏi hoặc trả lời sai trong 15 phút truy bài',
    category: '15 phút truy bài đầu giờ',
    severity: 'minor',
    default_action: 'Ghi nhận và hướng dẫn ôn tập'
  },

  // Nếp sống văn minh
  {
    code: 'VP003',
    name: 'Nói tục, chửi thề',
    description: 'Học sinh sử dụng ngôn từ thô tục, chửi thề trong trường',
    category: 'Nếp sống văn minh',
    severity: 'moderate',
    default_action: 'Cảnh cáo và giáo dục'
  },
  {
    code: 'VP004',
    name: 'Không chào hỏi thầy cô',
    description: 'Học sinh không chào hỏi giáo viên khi gặp',
    category: 'Nếp sống văn minh',
    severity: 'minor',
    default_action: 'Nhắc nhở về phép lịch sự'
  },

  // Kiểm tra sĩ số
  {
    code: 'VP005',
    name: 'Vắng mặt không phép',
    description: 'Học sinh vắng mặt không có lý do chính đáng hoặc không xin phép',
    category: 'Kiểm tra sĩ số',
    severity: 'moderate',
    default_action: 'Liên hệ phụ huynh và yêu cầu giải trình'
  },
  {
    code: 'VP006',
    name: 'Đi muộn',
    description: 'Học sinh đến lớp muộn so với giờ quy định',
    category: 'Kiểm tra sĩ số',
    severity: 'minor',
    default_action: 'Ghi nhận và nhắc nhở'
  },

  // Văn bản sổ sách
  {
    code: 'VP007',
    name: 'Không mang sổ liên lạc',
    description: 'Học sinh không mang sổ liên lạc hoặc các văn bản cần thiết',
    category: 'Văn bản sổ sách',
    severity: 'minor',
    default_action: 'Nhắc nhở và yêu cầu mang đầy đủ ngày hôm sau'
  },
  {
    code: 'VP008',
    name: 'Làm giả chữ ký phụ huynh',
    description: 'Học sinh làm giả chữ ký phụ huynh trong sổ liên lạc hoặc văn bản',
    category: 'Văn bản sổ sách',
    severity: 'major',
    default_action: 'Cảnh cáo nghiêm trọng và họp phụ huynh'
  },

  // Vệ sinh môi trường
  {
    code: 'VP009',
    name: 'Vứt rác bừa bãi',
    description: 'Học sinh vứt rác không đúng nơi quy định',
    category: 'Vệ sinh môi trường',
    severity: 'minor',
    default_action: 'Nhắc nhở và phạt dọn vệ sinh'
  },
  {
    code: 'VP010',
    name: 'Không tham gia trực nhật',
    description: 'Học sinh không tham gia hoặc làm không tốt công tác trực nhật',
    category: 'Vệ sinh môi trường',
    severity: 'moderate',
    default_action: 'Bù trực nhật vào ngày khác'
  },

  // Ký túc xá
  {
    code: 'VP011',
    name: 'Vi phạm giờ giấc nghỉ ngơi',
    description: 'Học sinh không tuân thủ giờ giấc nghỉ ngơi trong ký túc xá',
    category: 'Ký túc xá',
    severity: 'moderate',
    default_action: 'Cảnh cáo và nhắc nhở về nội quy'
  },
  {
    code: 'VP012',
    name: 'Mang đồ vật cấm vào ký túc xá',
    description: 'Học sinh mang các đồ vật không được phép vào ký túc xá',
    category: 'Ký túc xá',
    severity: 'major',
    default_action: 'Thu giữ đồ vật và cảnh cáo'
  }
]

export async function POST() {
  try {
    const supabase = await createClient()

    // Check if violation rules already exist
    const { data: existingRules, error: checkError } = await supabase
      .from('violation_rules')
      .select('id')
      .limit(1)

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingRules && existingRules.length > 0) {
      return NextResponse.json({ 
        message: 'Violation rules already exist',
        count: existingRules.length
      })
    }

    // Insert sample violation rules
    const { data, error } = await supabase
      .from('violation_rules')
      .insert(SAMPLE_VIOLATIONS.map(rule => ({
        ...rule,
        is_active: true
      })))
      .select()

    if (error) {
      console.error('Error creating violation rules:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Sample violation rules created successfully',
      count: data.length,
      data 
    }, { status: 201 })

  } catch (error) {
    console.error('Error in violation rules initialization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 