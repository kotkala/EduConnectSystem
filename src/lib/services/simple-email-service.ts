'use server'

// SIÊU ĐƠN GIẢN - Chỉ log email thay vì gửi thật (cho development)
// Trong production, có thể thay bằng service khác

export interface EmailData {
  to: string
  subject: string
  content: string
}

// Simple email function - chỉ log ra console
export async function sendSimpleEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Trong development - chỉ log
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 EMAIL WOULD BE SENT:')
      console.log('To:', data.to)
      console.log('Subject:', data.subject)
      console.log('Content:', data.content)
      console.log('---')
      return { success: true }
    }

    // Trong production - có thể dùng fetch để gọi API khác
    // Hoặc dùng service đơn giản khác
    
    return { success: true }
  } catch (error) {
    console.error('❌ Email error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}

// Teacher reminder - version đơn giản
export async function sendTeacherReminder(teacherEmail: string, teacherName: string, reportPeriod: string, classes: string[]) {
  const content = `
Kính chào ${teacherName},

Nhắc nhở nộp báo cáo học sinh cho kỳ ${reportPeriod}.

Các lớp chưa hoàn thành:
${classes.map(cls => `- ${cls}`).join('\n')}

Vui lòng hoàn thành báo cáo sớm nhất có thể.

Trân trọng,
Hệ thống EduConnect
  `

  return await sendSimpleEmail({
    to: teacherEmail,
    subject: `⏰ Nhắc nhở nộp báo cáo - ${reportPeriod}`,
    content: content
  })
}

// Parent notification - version đơn giản  
export async function sendParentNotification(parentEmail: string, parentName: string, studentName: string, reportPeriod: string) {
  const content = `
Kính chào ${parentName},

Báo cáo học tập của con em ${studentName} cho kỳ ${reportPeriod} đã sẵn sàng.

Vui lòng đăng nhập hệ thống để xem chi tiết.

Trân trọng,
Hệ thống EduConnect
  `

  return await sendSimpleEmail({
    to: parentEmail,
    subject: `📋 Báo cáo học tập - ${studentName}`,
    content: content
  })
}
