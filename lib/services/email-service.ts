import { createClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'

// Initialize SMTP transporter (Gmail)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface ReportNotificationEmailData {
  parentEmail: string
  parentName: string
  studentName: string
  reportPeriodName: string
  startDate: string
  endDate: string
  resendReason?: string
}

interface TeacherReminderEmailData {
  teacherEmail: string
  teacherName: string
  reportPeriodName: string
  incompleteClasses: string[]
  deadline: string
}

interface GradeNotificationEmailData {
  parentEmail: string
  parentName: string
  studentName: string
  className: string
  periodName: string
  teacherName: string
}

interface TeacherGradeNotificationEmailData {
  teacherEmail: string
  teacherName: string
  className: string
  periodName: string
  studentCount: number
  submissionCount: number
  isResubmission: boolean
}

/**
 * Send email notification to parent about new report using Resend
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

    // HTML content for better deliverability
    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .info-box { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🎓 Hệ thống Quản lý Giáo dục EduConnect</h2>
    </div>

    <div class="content">
        <p>Kính gửi <strong>${data.parentName}</strong>,</p>

        <p>${data.resendReason
          ? `Giáo viên đã cập nhật và gửi lại báo cáo học tập của con em. <strong>Lý do gửi lại:</strong> ${data.resendReason}`
          : 'Chúng tôi xin thông báo báo cáo học tập của con em đã sẵn sàng.'
        }</p>

        <div class="info-box">
            <h3>📚 Thông tin báo cáo:</h3>
            <ul>
                <li><strong>Học sinh:</strong> ${data.studentName}</li>
                <li><strong>Kỳ báo cáo:</strong> ${data.reportPeriodName}</li>
                <li><strong>Thời gian:</strong> ${startDate} - ${endDate}</li>
            </ul>
        </div>

        <p>Quý phụ huynh vui lòng đăng nhập vào hệ thống để xem chi tiết báo cáo học tập và tình hình rèn luyện của con em.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" class="button">🔗 Đăng nhập hệ thống</a>

        <p>Nếu có bất kỳ thắc mắc nào, quý phụ huynh vui lòng liên hệ với giáo viên chủ nhiệm hoặc nhà trường.</p>
    </div>

    <div class="footer">
        <p>Trân trọng,<br><strong>Ban Giám hiệu</strong></p>
        <p><em>Email này được gửi tự động từ hệ thống EduConnect. Vui lòng không trả lời email này.</em></p>
    </div>
</body>
</html>
    `.trim()

    // Plain text version for better deliverability
    const textContent = `
Kính gửi ${data.parentName},

${data.resendReason
  ? `Giáo viên đã cập nhật và gửi lại báo cáo học tập của con em. Lý do gửi lại: ${data.resendReason}`
  : 'Chúng tôi xin thông báo báo cáo học tập của con em đã sẵn sàng.'
}

THÔNG TIN BÁO CÁO:
- Học sinh: ${data.studentName}
- Kỳ báo cáo: ${data.reportPeriodName}
- Thời gian: ${startDate} - ${endDate}

Quý phụ huynh vui lòng đăng nhập vào hệ thống để xem chi tiết báo cáo học tập và tình hình rèn luyện của con em.

Truy cập hệ thống: ${process.env.NEXT_PUBLIC_APP_URL}/auth/login

Nếu có bất kỳ thắc mắc nào, quý phụ huynh vui lòng liên hệ với giáo viên chủ nhiệm hoặc nhà trường.

Trân trọng,
Ban Giám hiệu

---
Email này được gửi tự động từ hệ thống EduConnect. Vui lòng không trả lời email này.
    `.trim()

    // Send email using SMTP (Gmail)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const emailResult = await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'EduConnect <noreply@gmail.com>',
          to: data.parentEmail,
          subject: subject,
          html: htmlContent,
          text: textContent,
        })

        console.log('✅ Email sent successfully via SMTP:', emailResult.messageId)
      } catch (smtpError) {
        console.error('❌ Failed to send email via SMTP:', smtpError)
        // Don't fail the entire operation if email fails
      }
    } else {
      console.log('📧 SMTP not configured, skipping email send')
    }

    // Store email in database for tracking (if table exists)
    try {
      const { error: emailError } = await supabase
        .from('email_notifications')
        .insert({
          recipient_email: data.parentEmail,
          recipient_name: data.parentName,
          subject: subject,
          content: textContent, // Store plain text version
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
 * Send reminder email to teacher about incomplete reports
 */
export async function sendTeacherReminderEmail(data: TeacherReminderEmailData) {
  try {
    const supabase = await createClient()

    const subject = `Nhắc nhở: Hoàn thành báo cáo học tập ${data.reportPeriodName}`

    // HTML content for teacher reminder
    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .warning-box { background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .class-list { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h2>⚠️ Nhắc nhở hoàn thành báo cáo học tập</h2>
    </div>

    <div class="content">
        <p>Kính gửi <strong>${data.teacherName}</strong>,</p>

        <div class="warning-box">
            <p><strong>Thông báo quan trọng:</strong> Hệ thống phát hiện một số lớp của thầy/cô chưa hoàn thành báo cáo học tập cho kỳ <strong>${data.reportPeriodName}</strong>.</p>
        </div>

        <div class="class-list">
            <h3>📋 Các lớp chưa hoàn thành:</h3>
            <ul>
                ${data.incompleteClasses.map(className => `<li><strong>${className}</strong></li>`).join('')}
            </ul>
        </div>

        <p><strong>Thời hạn hoàn thành:</strong> ${data.deadline}</p>

        <p>Để đảm bảo chất lượng giáo dục và thông tin kịp thời cho phụ huynh, thầy/cô vui lòng hoàn thành báo cáo cho các lớp trên trước thời hạn.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher/reports" class="button">📝 Hoàn thành báo cáo ngay</a>

        <p>Nếu có bất kỳ khó khăn nào trong việc hoàn thành báo cáo, thầy/cô vui lòng liên hệ với ban giám hiệu để được hỗ trợ.</p>
    </div>

    <div class="footer">
        <p>Trân trọng,<br><strong>Ban Giám hiệu</strong></p>
        <p><em>Email này được gửi tự động từ hệ thống EduConnect.</em></p>
    </div>
</body>
</html>
    `.trim()

    // Plain text version
    const textContent = `
Kính gửi ${data.teacherName},

THÔNG BÁO QUAN TRỌNG: Hệ thống phát hiện một số lớp của thầy/cô chưa hoàn thành báo cáo học tập cho kỳ ${data.reportPeriodName}.

CÁC LỚP CHƯA HOÀN THÀNH:
${data.incompleteClasses.map(className => `- ${className}`).join('\n')}

Thời hạn hoàn thành: ${data.deadline}

Để đảm bảo chất lượng giáo dục và thông tin kịp thời cho phụ huynh, thầy/cô vui lòng hoàn thành báo cáo cho các lớp trên trước thời hạn.

Truy cập hệ thống: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher/reports

Nếu có bất kỳ khó khăn nào trong việc hoàn thành báo cáo, thầy/cô vui lòng liên hệ với ban giám hiệu để được hỗ trợ.

Trân trọng,
Ban Giám hiệu

---
Email này được gửi tự động từ hệ thống EduConnect.
    `.trim()

    // Send email using SMTP (Gmail)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const emailResult = await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'EduConnect <noreply@gmail.com>',
          to: data.teacherEmail,
          subject: subject,
          html: htmlContent,
          text: textContent,
          priority: 'high'
        })

        console.log('✅ Teacher reminder email sent successfully via SMTP:', emailResult.messageId)
      } catch (smtpError) {
        console.error('❌ Failed to send teacher reminder email via SMTP:', smtpError)
        throw smtpError
      }
    } else {
      console.log('📧 SMTP not configured, skipping teacher reminder email')
    }

    // Store email in database for tracking
    try {
      const { error: emailError } = await supabase
        .from('email_notifications')
        .insert({
          recipient_email: data.teacherEmail,
          recipient_name: data.teacherName,
          subject: subject,
          content: textContent,
          type: 'teacher_reminder',
          status: 'sent',
          sent_at: new Date().toISOString()
        })

      if (emailError) {
        console.error('Error storing teacher reminder email:', emailError)
      }
    } catch (tableError) {
      console.log('Email notifications table not found, skipping storage:', tableError)
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending teacher reminder email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send teacher reminder email'
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

// Send grade notification email to parents
export async function sendGradeNotificationEmail(data: GradeNotificationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = `[EduConnect] Thông báo điểm số mới của con em ${data.studentName} - ${data.periodName}`

    // HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background: #64748b; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Thông báo điểm số mới</h1>
            <p>Hệ thống quản lý giáo dục EduConnect</p>
        </div>

        <div class="content">
            <p>Kính gửi <strong>${data.parentName}</strong>,</p>

            <div class="highlight">
                <h3>📋 Thông tin điểm số</h3>
                <p><strong>Học sinh:</strong> ${data.studentName}</p>
                <p><strong>Lớp:</strong> ${data.className}</p>
                <p><strong>Kỳ báo cáo:</strong> ${data.periodName}</p>
                <p><strong>Giáo viên:</strong> ${data.teacherName}</p>
            </div>

            <p>Điểm số mới của con em đã được cập nhật trong hệ thống. Quý phụ huynh vui lòng đăng nhập để xem chi tiết điểm số và nhận xét của giáo viên.</p>

            <a href="https://edu-connect-system.vercel.app/auth/login" class="button">🔗 Đăng nhập xem điểm</a>

            <p>Nếu có bất kỳ thắc mắc nào về điểm số, quý phụ huynh vui lòng liên hệ trực tiếp với giáo viên hoặc nhà trường.</p>
        </div>

        <div class="footer">
            <p>Trân trọng,<br><strong>Giáo viên ${data.teacherName}</strong></p>
            <p><em>Email này được gửi tự động từ hệ thống EduConnect. Vui lòng không trả lời email này.</em></p>
        </div>
    </div>
</body>
</html>
    `.trim()

    // Plain text version
    const textContent = `
Kính gửi ${data.parentName},

Thông báo điểm số mới của con em ${data.studentName}

Thông tin chi tiết:
- Học sinh: ${data.studentName}
- Lớp: ${data.className}
- Kỳ báo cáo: ${data.periodName}
- Giáo viên: ${data.teacherName}

Điểm số mới của con em đã được cập nhật trong hệ thống. Quý phụ huynh vui lòng đăng nhập vào hệ thống để xem chi tiết.

Đăng nhập tại: https://edu-connect-system.vercel.app/auth/login

Nếu có thắc mắc, vui lòng liên hệ với giáo viên hoặc nhà trường.

Trân trọng,
Giáo viên ${data.teacherName}

---
Email này được gửi tự động từ hệ thống EduConnect. Vui lòng không trả lời email này.
    `.trim()

    // Send email using SMTP (Gmail)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const emailResult = await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'EduConnect <noreply@gmail.com>',
          to: data.parentEmail,
          subject: subject,
          html: htmlContent,
          text: textContent,
        })

        console.log('✅ Grade notification email sent successfully via SMTP:', emailResult.messageId)
      } catch (smtpError) {
        console.error('❌ Failed to send grade notification email via SMTP:', smtpError)
        // Don't fail the entire operation if email fails
      }
    } else {
      console.log('📧 SMTP not configured, skipping grade notification email')
    }

    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send grade notification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send grade notification email'
    }
  }
}

// Send grade notification email to homeroom teacher
export async function sendTeacherGradeNotificationEmail(data: TeacherGradeNotificationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const submissionText = data.isResubmission ? `lần ${data.submissionCount}` : 'lần 1'
    const subject = `[EduConnect] Bảng điểm mới từ Ban Giám Hiệu - ${data.className} (${submissionText})`

    // HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background: #64748b; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .highlight { background: #d1fae5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #059669; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Thông báo bảng điểm mới</h1>
            <p>Hệ thống quản lý giáo dục EduConnect</p>
        </div>

        <div class="content">
            <p>Kính gửi <strong>${data.teacherName}</strong>,</p>

            <div class="highlight">
                <h3>📋 Thông tin bảng điểm</h3>
                <p><strong>Lớp chủ nhiệm:</strong> ${data.className}</p>
                <p><strong>Kỳ báo cáo:</strong> ${data.periodName}</p>
                <p><strong>Số học sinh:</strong> ${data.studentCount} học sinh</p>
                <p><strong>Lần gửi:</strong> ${submissionText}</p>
            </div>

            ${data.isResubmission ? `
            <div class="warning">
                <h3>⚠️ Gửi lại bảng điểm</h3>
                <p>Đây là lần gửi thứ ${data.submissionCount} cho kỳ báo cáo này. Vui lòng kiểm tra và xử lý bảng điểm mới.</p>
            </div>
            ` : ''}

            <p>Ban Giám Hiệu đã gửi bảng điểm cho lớp ${data.className} của bạn. Vui lòng đăng nhập vào hệ thống để xem chi tiết và thực hiện các thao tác cần thiết.</p>

            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher/grade-reports" class="button">
                    Xem bảng điểm ngay
                </a>
            </div>

            <p><strong>Lưu ý:</strong></p>
            <ul>
                <li>Vui lòng kiểm tra và xác nhận nhận bảng điểm trong hệ thống</li>
                <li>Nếu có thắc mắc, vui lòng liên hệ với Ban Giám Hiệu</li>
                <li>Bảng điểm này cần được xử lý trong thời gian sớm nhất</li>
            </ul>
        </div>

        <div class="footer">
            <p>Trân trọng,<br>
            <strong>Hệ thống EduConnect</strong></p>
            <p style="font-size: 12px; margin-top: 10px;">
                Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.
            </p>
        </div>
    </div>
</body>
</html>`

    // Send email using SMTP (Gmail)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const emailResult = await transporter.sendMail({
          from: `"EduConnect System" <${process.env.SMTP_USER}>`,
          to: data.teacherEmail,
          subject: subject,
          html: htmlContent,
        })

        console.log('✅ Teacher grade notification email sent successfully via SMTP:', emailResult.messageId)
        return { success: true }
      } catch (smtpError) {
        console.error('❌ Failed to send teacher grade notification email via SMTP:', smtpError)
        throw smtpError
      }
    } else {
      console.log('📧 SMTP not configured, skipping teacher grade notification email')
      return { success: false, error: 'SMTP not configured' }
    }
  } catch (error) {
    console.error('Error sending teacher grade notification email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
