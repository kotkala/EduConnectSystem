import { createClient } from '@/utils/supabase/server'

interface ReportNotificationEmailData {
  parentEmail: string
  parentName: string
  studentName: string
  reportPeriodName: string
  startDate: string
  endDate: string
  resendReason?: string
}

/**
 * Send email notification to parent about new report
 */
export async function sendReportNotificationEmail(data: ReportNotificationEmailData) {
  try {
    const supabase = await createClient()

    // Format dates for display
    const startDate = new Date(data.startDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const endDate = new Date(data.endDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    // Create email subject and content
    const subject = data.resendReason 
      ? `[Cập nhật] Báo cáo học tập ${data.reportPeriodName} - ${data.studentName}`
      : `Báo cáo học tập ${data.reportPeriodName} - ${data.studentName}`

    const emailContent = `
Kính gửi ${data.parentName},

${data.resendReason 
  ? `Giáo viên đã cập nhật và gửi lại báo cáo học tập của con em. Lý do gửi lại: ${data.resendReason}`
  : 'Chúng tôi xin thông báo báo cáo học tập của con em đã sẵn sàng.'
}

📚 **Thông tin báo cáo:**
- Học sinh: ${data.studentName}
- Kỳ báo cáo: ${data.reportPeriodName}
- Thời gian: ${startDate} - ${endDate}

Quý phụ huynh vui lòng đăng nhập vào hệ thống để xem chi tiết báo cáo học tập và tình hình rèn luyện của con em.

🔗 **Truy cập hệ thống:** [Đăng nhập tại đây](${process.env.NEXT_PUBLIC_APP_URL}/auth/login)

Nếu có bất kỳ thắc mắc nào, quý phụ huynh vui lòng liên hệ với giáo viên chủ nhiệm hoặc nhà trường.

Trân trọng,
Ban Giám hiệu
    `.trim()

    // Store email in database for tracking (if table exists)
    try {
      const { error: emailError } = await supabase
        .from('email_notifications')
        .insert({
          recipient_email: data.parentEmail,
          recipient_name: data.parentName,
          subject: subject,
          content: emailContent,
          type: 'report_notification',
          status: 'sent',
          sent_at: new Date().toISOString()
        })

      if (emailError) {
        console.error('Error storing email notification:', emailError)
        // Don't fail the operation if email storage fails
      }
    } catch (tableError) {
      console.log('Email notifications table not found, skipping storage:', tableError)
      // Continue without storing - this is not critical
    }

    // In a real application, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Nodemailer with SMTP
    
    // For now, we'll just log the email (in production, replace with actual email sending)
    console.log('Email notification sent:', {
      to: data.parentEmail,
      subject: subject,
      content: emailContent
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending email notification:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email notification' 
    }
  }
}

/**
 * Send resend notification email with reason
 */
export async function sendResendNotificationEmail(
  data: Omit<ReportNotificationEmailData, 'resendReason'> & { resendReason: string }
) {
  return sendReportNotificationEmail(data)
}
