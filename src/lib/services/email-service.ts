import { createClient } from '@/lib/supabase/server'
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
      ? `[Cáº­p nháº­t] BÃ¡o cÃ¡o há»c táº­p ${data.reportPeriodName} - ${data.studentName}`
      : `BÃ¡o cÃ¡o há»c táº­p ${data.reportPeriodName} - ${data.studentName}`

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
        <h2>ðŸŽ“ Há»‡ thá»‘ng Quáº£n lÃ½ GiÃ¡o dá»¥c EduConnect</h2>
    </div>

    <div class="content">
        <p>KÃ­nh gá»­i <strong>${data.parentName}</strong>,</p>

        <p>${data.resendReason
          ? `GiÃ¡o viÃªn Ä‘Ã£ cáº­p nháº­t vÃ  gá»­i láº¡i bÃ¡o cÃ¡o há»c táº­p cá»§a con em. <strong>LÃ½ do gá»­i láº¡i:</strong> ${data.resendReason}`
          : 'ChÃºng tÃ´i xin thÃ´ng bÃ¡o bÃ¡o cÃ¡o há»c táº­p cá»§a con em Ä‘Ã£ sáºµn sÃ ng.'
        }</p>

        <div class="info-box">
            <h3>ðŸ“š ThÃ´ng tin bÃ¡o cÃ¡o:</h3>
            <ul>
                <li><strong>Há»c sinh:</strong> ${data.studentName}</li>
                <li><strong>Ká»³ bÃ¡o cÃ¡o:</strong> ${data.reportPeriodName}</li>
                <li><strong>Thá»i gian:</strong> ${startDate} - ${endDate}</li>
            </ul>
        </div>

        <p>QuÃ½ phá»¥ huynh vui lÃ²ng Ä‘Äƒng nháº­p vÃ o há»‡ thá»‘ng Ä‘á»ƒ xem chi tiáº¿t bÃ¡o cÃ¡o há»c táº­p vÃ  tÃ¬nh hÃ¬nh rÃ¨n luyá»‡n cá»§a con em.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" class="button">ðŸ”— ÄÄƒng nháº­p há»‡ thá»‘ng</a>

        <p>Náº¿u cÃ³ báº¥t ká»³ tháº¯c máº¯c nÃ o, quÃ½ phá»¥ huynh vui lÃ²ng liÃªn há»‡ vá»›i giÃ¡o viÃªn chá»§ nhiá»‡m hoáº·c nhÃ  trÆ°á»ng.</p>
    </div>

    <div class="footer">
        <p>TrÃ¢n trá»ng,<br><strong>Ban GiÃ¡m hiá»‡u</strong></p>
        <p><em>Email nÃ y Ä‘Æ°á»£c gá»­i tá»± Ä‘á»™ng tá»« há»‡ thá»‘ng EduConnect. Vui lÃ²ng khÃ´ng tráº£ lá»i email nÃ y.</em></p>
    </div>
</body>
</html>
    `.trim()

    // Plain text version for better deliverability
    const textContent = `
KÃ­nh gá»­i ${data.parentName},

${data.resendReason
  ? `GiÃ¡o viÃªn Ä‘Ã£ cáº­p nháº­t vÃ  gá»­i láº¡i bÃ¡o cÃ¡o há»c táº­p cá»§a con em. LÃ½ do gá»­i láº¡i: ${data.resendReason}`
  : 'ChÃºng tÃ´i xin thÃ´ng bÃ¡o bÃ¡o cÃ¡o há»c táº­p cá»§a con em Ä‘Ã£ sáºµn sÃ ng.'
}

THÃ”NG TIN BÃO CÃO:
- Há»c sinh: ${data.studentName}
- Ká»³ bÃ¡o cÃ¡o: ${data.reportPeriodName}
- Thá»i gian: ${startDate} - ${endDate}

QuÃ½ phá»¥ huynh vui lÃ²ng Ä‘Äƒng nháº­p vÃ o há»‡ thá»‘ng Ä‘á»ƒ xem chi tiáº¿t bÃ¡o cÃ¡o há»c táº­p vÃ  tÃ¬nh hÃ¬nh rÃ¨n luyá»‡n cá»§a con em.

Truy cáº­p há»‡ thá»‘ng: ${process.env.NEXT_PUBLIC_APP_URL}/auth/login

Náº¿u cÃ³ báº¥t ká»³ tháº¯c máº¯c nÃ o, quÃ½ phá»¥ huynh vui lÃ²ng liÃªn há»‡ vá»›i giÃ¡o viÃªn chá»§ nhiá»‡m hoáº·c nhÃ  trÆ°á»ng.

TrÃ¢n trá»ng,
Ban GiÃ¡m hiá»‡u

---
Email nÃ y Ä‘Æ°á»£c gá»­i tá»± Ä‘á»™ng tá»« há»‡ thá»‘ng EduConnect. Vui lÃ²ng khÃ´ng tráº£ lá»i email nÃ y.
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

        console.log('âœ… Email sent successfully via SMTP:', emailResult.messageId)
      } catch (smtpError) {
        console.error('âŒ Failed to send email via SMTP:', smtpError)
        // Don't fail the entire operation if email fails
      }
    } else {
      console.log('ðŸ“§ SMTP not configured, skipping email send')
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

    const subject = `Nháº¯c nhá»Ÿ: HoÃ n thÃ nh bÃ¡o cÃ¡o há»c táº­p ${data.reportPeriodName}`

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
        <h2>âš ï¸ Nháº¯c nhá»Ÿ hoÃ n thÃ nh bÃ¡o cÃ¡o há»c táº­p</h2>
    </div>

    <div class="content">
        <p>KÃ­nh gá»­i <strong>${data.teacherName}</strong>,</p>

        <div class="warning-box">
            <p><strong>ThÃ´ng bÃ¡o quan trá»ng:</strong> Há»‡ thá»‘ng phÃ¡t hiá»‡n má»™t sá»‘ lá»›p cá»§a tháº§y/cÃ´ chÆ°a hoÃ n thÃ nh bÃ¡o cÃ¡o há»c táº­p cho ká»³ <strong>${data.reportPeriodName}</strong>.</p>
        </div>

        <div class="class-list">
            <h3>ðŸ“‹ CÃ¡c lá»›p chÆ°a hoÃ n thÃ nh:</h3>
            <ul>
                ${data.incompleteClasses.map(className => `<li><strong>${className}</strong></li>`).join('')}
            </ul>
        </div>

        <p><strong>Thá»i háº¡n hoÃ n thÃ nh:</strong> ${data.deadline}</p>

        <p>Äá»ƒ Ä‘áº£m báº£o cháº¥t lÆ°á»£ng giÃ¡o dá»¥c vÃ  thÃ´ng tin ká»‹p thá»i cho phá»¥ huynh, tháº§y/cÃ´ vui lÃ²ng hoÃ n thÃ nh bÃ¡o cÃ¡o cho cÃ¡c lá»›p trÃªn trÆ°á»›c thá»i háº¡n.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher/reports" class="button">ðŸ“ HoÃ n thÃ nh bÃ¡o cÃ¡o ngay</a>

        <p>Náº¿u cÃ³ báº¥t ká»³ khÃ³ khÄƒn nÃ o trong viá»‡c hoÃ n thÃ nh bÃ¡o cÃ¡o, tháº§y/cÃ´ vui lÃ²ng liÃªn há»‡ vá»›i ban giÃ¡m hiá»‡u Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£.</p>
    </div>

    <div class="footer">
        <p>TrÃ¢n trá»ng,<br><strong>Ban GiÃ¡m hiá»‡u</strong></p>
        <p><em>Email nÃ y Ä‘Æ°á»£c gá»­i tá»± Ä‘á»™ng tá»« há»‡ thá»‘ng EduConnect.</em></p>
    </div>
</body>
</html>
    `.trim()

    // Plain text version
    const textContent = `
KÃ­nh gá»­i ${data.teacherName},

THÃ”NG BÃO QUAN TRá»ŒNG: Há»‡ thá»‘ng phÃ¡t hiá»‡n má»™t sá»‘ lá»›p cá»§a tháº§y/cÃ´ chÆ°a hoÃ n thÃ nh bÃ¡o cÃ¡o há»c táº­p cho ká»³ ${data.reportPeriodName}.

CÃC Lá»šP CHÆ¯A HOÃ€N THÃ€NH:
${data.incompleteClasses.map(className => `- ${className}`).join('\n')}

Thá»i háº¡n hoÃ n thÃ nh: ${data.deadline}

Äá»ƒ Ä‘áº£m báº£o cháº¥t lÆ°á»£ng giÃ¡o dá»¥c vÃ  thÃ´ng tin ká»‹p thá»i cho phá»¥ huynh, tháº§y/cÃ´ vui lÃ²ng hoÃ n thÃ nh bÃ¡o cÃ¡o cho cÃ¡c lá»›p trÃªn trÆ°á»›c thá»i háº¡n.

Truy cáº­p há»‡ thá»‘ng: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher/reports

Náº¿u cÃ³ báº¥t ká»³ khÃ³ khÄƒn nÃ o trong viá»‡c hoÃ n thÃ nh bÃ¡o cÃ¡o, tháº§y/cÃ´ vui lÃ²ng liÃªn há»‡ vá»›i ban giÃ¡m hiá»‡u Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£.

TrÃ¢n trá»ng,
Ban GiÃ¡m hiá»‡u

---
Email nÃ y Ä‘Æ°á»£c gá»­i tá»± Ä‘á»™ng tá»« há»‡ thá»‘ng EduConnect.
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

        console.log('âœ… Teacher reminder email sent successfully via SMTP:', emailResult.messageId)
      } catch (smtpError) {
        console.error('âŒ Failed to send teacher reminder email via SMTP:', smtpError)
        throw smtpError
      }
    } else {
      console.log('ðŸ“§ SMTP not configured, skipping teacher reminder email')
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
