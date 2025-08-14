'use server'

import nodemailer from 'nodemailer'

// Create SMTP transporter (much simpler than Resend)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Email templates following Context7 patterns
export interface TeacherReminderEmailData {
  teacherEmail: string
  teacherName: string
  reportPeriodName: string
  endDate: string
  incompleteClasses: Array<{
    className: string
    totalStudents: number
    completedReports: number
  }>
}

export interface ParentReportEmailData {
  parentEmail: string
  parentName: string
  studentName: string
  reportPeriodName: string
  startDate: string
  endDate: string
  reportUrl?: string
}

export interface ParentReminderEmailData {
  parentEmail: string
  parentName: string
  studentName: string
  reportPeriodName: string
  endDate: string
  reportUrl?: string
}

// Teacher reminder email template (HTML) - Enhanced with professional design
function createTeacherReminderTemplate(data: TeacherReminderEmailData): string {
  const incompleteClassesList = data.incompleteClasses
    .map(cls => `
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb; background-color: #f9fafb;">${cls.className}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; background-color: #f0f9ff;">${cls.completedReports}/${cls.totalStudents}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; background-color: #fef2f2; color: #dc2626; font-weight: bold;">${cls.totalStudents - cls.completedReports}</td>
      </tr>
    `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thông báo nhắc nhở nộp báo cáo học sinh</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
          <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb;">E</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">EduConnect Portal</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Hệ thống quản lý giáo dục</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 20px;">
              Thông báo nhắc nhở quan trọng
            </h2>
            <p style="margin: 0; color: #78350f; font-size: 16px;">Cần hoàn thành báo cáo học sinh trước thời hạn</p>
          </div>

          <p style="font-size: 16px; margin-bottom: 8px;">Kính chào <strong style="color: #1f2937;">${data.teacherName}</strong>,</p>

          <p style="font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
            Nhà trường trân trọng thông báo và nhắc nhở Thầy/Cô về việc hoàn thành báo cáo đánh giá học sinh cho
            <strong style="color: #2563eb;">${data.reportPeriodName}</strong>. Đây là công việc quan trọng giúp phụ huynh
            nắm bắt tình hình học tập và rèn luyện của các em.
          </p>

          <div style="background-color: #fee2e2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 16px; color: #991b1b;">
              <strong>Thời hạn nộp báo cáo:</strong> ${new Date(data.endDate).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 20px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Tình hình hoàn thành báo cáo theo lớp
          </h3>

          <div style="overflow-x: auto; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                  <th style="padding: 16px; color: #ffffff; text-align: left; font-weight: 600; font-size: 14px;">Lớp học</th>
                  <th style="padding: 16px; color: #ffffff; text-align: center; font-weight: 600; font-size: 14px;">Đã hoàn thành</th>
                  <th style="padding: 16px; color: #ffffff; text-align: center; font-weight: 600; font-size: 14px;">Còn lại</th>
                </tr>
              </thead>
              <tbody>
                ${incompleteClassesList}
              </tbody>
            </table>
          </div>

          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 16px; color: #0c4a6e; line-height: 1.6;">
              <strong>Lưu ý:</strong> Để đảm bảo chất lượng giáo dục và sự phối hợp giữa nhà trường và gia đình,
              Thầy/Cô vui lòng hoàn thành báo cáo đánh giá cho tất cả học sinh trong các lớp được phân công trước thời hạn quy định.
            </p>
          </div>

          <!-- Portal Access Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://edu-connect-system.vercel.app/dashboard/teacher/reports"
               style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                      color: #ffffff;
                      padding: 16px 32px;
                      text-decoration: none;
                      border-radius: 8px;
                      display: inline-block;
                      font-weight: 600;
                      font-size: 16px;
                      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                      transition: all 0.3s ease;">
              Truy cập hệ thống ngay
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Trân trọng cảm ơn,<br>
            <strong style="color: #1e293b;">Ban Giám hiệu & Hệ thống EduConnect</strong>
          </p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Email này được gửi tự động từ hệ thống EduConnect Portal<br>
              <a href="https://edu-connect-system.vercel.app" style="color: #2563eb; text-decoration: none;">edu-connect-system.vercel.app</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Parent report notification email template (HTML) - Enhanced with professional design
function createParentReportTemplate(data: ParentReportEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Báo cáo học tập của con em - ${data.studentName}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 40px; text-align: center;">
          <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <span style="font-size: 32px; font-weight: bold; color: #059669;">E</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">EduConnect Portal</h1>
          <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">Báo cáo học tập đã sẵn sàng</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <h2 style="color: #047857; margin: 0 0 10px 0; font-size: 20px;">
              Báo cáo học tập mới
            </h2>
            <p style="margin: 0; color: #065f46; font-size: 16px;">Thông tin chi tiết về quá trình học tập của con em</p>
          </div>

          <p style="font-size: 16px; margin-bottom: 8px;">Kính chào Quý phụ huynh <strong style="color: #1f2937;">${data.parentName}</strong>,</p>

          <p style="font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
            Nhà trường trân trọng thông báo rằng báo cáo đánh giá học tập của con em
            <strong style="color: #059669;">${data.studentName}</strong> cho
            <strong style="color: #2563eb;">${data.reportPeriodName}</strong> đã được hoàn thành và sẵn sàng để Quý phụ huynh xem xét.
          </p>

          <!-- Report Period Info Card -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 18px;">
              Thông tin kỳ báo cáo
            </h3>
            <div style="display: grid; gap: 10px;">
              <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Kỳ báo cáo:</strong> <span style="color: #2563eb;">${data.reportPeriodName}</span></p>
              <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Từ ngày:</strong> ${new Date(data.startDate).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Đến ngày:</strong> ${new Date(data.endDate).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
          </div>

          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 16px; color: #92400e; line-height: 1.6;">
              <strong>Nội dung báo cáo bao gồm:</strong><br>
              • Đánh giá về điểm mạnh và điểm cần cải thiện<br>
              • Tình hình học tập các môn học<br>
              • Đánh giá về ý thức kỷ luật và thái độ học tập<br>
              • Khuyến nghị từ giáo viên chủ nhiệm
            </p>
          </div>

          <!-- Portal Access Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://edu-connect-system.vercel.app/dashboard/parent/reports"
               style="background: linear-gradient(135deg, #059669 0%, #047857 100%);
                      color: #ffffff;
                      padding: 18px 36px;
                      text-decoration: none;
                      border-radius: 10px;
                      display: inline-block;
                      font-weight: 600;
                      font-size: 18px;
                      box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
                      transition: all 0.3s ease;">
              Xem báo cáo chi tiết
            </a>
          </div>

          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 15px; color: #0c4a6e; line-height: 1.6;">
              <strong>Hướng dẫn:</strong> Sau khi xem báo cáo, Quý phụ huynh có thể để lại phản hồi và trao đổi với giáo viên
              chủ nhiệm để cùng hỗ trợ con em phát triển tốt nhất. Mọi thắc mắc xin liên hệ trực tiếp với nhà trường.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Trân trọng cảm ơn sự quan tâm của Quý phụ huynh,<br>
            <strong style="color: #1e293b;">Ban Giám hiệu & Giáo viên chủ nhiệm</strong>
          </p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              📧 Email này được gửi tự động từ hệ thống EduConnect Portal<br>
              🌐 <a href="https://edu-connect-system.vercel.app" style="color: #059669; text-decoration: none;">edu-connect-system.vercel.app</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Parent reminder email template (HTML) - Enhanced with professional design
function createParentReminderTemplate(data: ParentReminderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nhắc nhở xem báo cáo học tập - ${data.studentName}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 40px; text-align: center;">
          <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <span style="font-size: 32px; font-weight: bold; color: #f59e0b;">E</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">EduConnect Portal</h1>
          <p style="color: #fef3c7; margin: 8px 0 0 0; font-size: 16px;">Nhắc nhở quan trọng từ nhà trường</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 20px;">
              Nhắc nhở xem báo cáo học tập
            </h2>
            <p style="margin: 0; color: #78350f; font-size: 16px;">Báo cáo của con em đã sẵn sàng và đang chờ Quý phụ huynh xem xét</p>
          </div>

          <p style="font-size: 16px; margin-bottom: 8px;">Kính chào Quý phụ huynh <strong style="color: #1f2937;">${data.parentName}</strong>,</p>

          <p style="font-size: 16px; line-height: 1.7; margin-bottom: 25px;">
            Nhà trường xin gửi lời nhắc nhở thân thiện về việc xem báo cáo học tập của con em
            <strong style="color: #f59e0b;">${data.studentName}</strong> cho
            <strong style="color: #2563eb;">${data.reportPeriodName}</strong>.
            Báo cáo này đã được giáo viên chủ nhiệm hoàn thành và đang chờ sự quan tâm của Quý phụ huynh.
          </p>

          <!-- Report Status Card -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #fcd34d; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">
              Trạng thái báo cáo
            </h3>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b;">
              <p style="margin: 0; font-size: 15px; color: #0f172a;">
                <strong>Báo cáo đã sẵn sàng từ:</strong>
                <span style="color: #dc2626; font-weight: bold;">
                  ${new Date(data.endDate).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 15px; color: #7c2d12;">
                <strong>Thời gian chờ:</strong> ${Math.ceil((Date.now() - new Date(data.endDate).getTime()) / (1000 * 60 * 60 * 24))} ngày
              </p>
            </div>
          </div>

          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 16px; color: #0c4a6e; line-height: 1.6;">
              <strong>Tầm quan trọng của việc xem báo cáo:</strong><br>
              • Nắm bắt tình hình học tập và phát triển của con em<br>
              • Phối hợp với nhà trường trong việc giáo dục<br>
              • Kịp thời điều chỉnh phương pháp hỗ trợ con em<br>
              • Tăng cường sự kết nối giữa gia đình và trường học
            </p>
          </div>

          <!-- Portal Access Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://edu-connect-system.vercel.app/dashboard/parent/reports"
               style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                      color: #ffffff;
                      padding: 18px 36px;
                      text-decoration: none;
                      border-radius: 10px;
                      display: inline-block;
                      font-weight: 600;
                      font-size: 18px;
                      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
                      transition: all 0.3s ease;">
              Xem báo cáo ngay bây giờ
            </a>
          </div>

          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 15px; color: #065f46; line-height: 1.6;">
              <strong>Phản hồi từ phụ huynh:</strong> Sau khi xem báo cáo, Quý phụ huynh có thể để lại ý kiến phản hồi
              và trao đổi trực tiếp với giáo viên chủ nhiệm thông qua hệ thống. Điều này giúp tạo nên sự phối hợp tốt nhất
              trong việc giáo dục và phát triển con em.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Cảm ơn Quý phụ huynh đã luôn quan tâm và đồng hành cùng con em,<br>
            <strong style="color: #1e293b;">Ban Giám hiệu & Giáo viên chủ nhiệm</strong>
          </p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              📧 Email này được gửi tự động từ hệ thống EduConnect Portal<br>
              🌐 <a href="https://edu-connect-system.vercel.app" style="color: #f59e0b; text-decoration: none;">edu-connect-system.vercel.app</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Send teacher reminder email (simplified with nodemailer)
export async function sendTeacherReminderEmail(data: TeacherReminderEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured')
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'EduConnect Portal <noreply@gmail.com>',
      to: data.teacherEmail,
      subject: `[EduConnect] Thông báo nhắc nhở hoàn thành báo cáo học sinh - ${data.reportPeriodName}`,
      html: createTeacherReminderTemplate(data),
      text: `Thông báo từ EduConnect Portal: Nhắc nhở hoàn thành báo cáo học sinh cho ${data.reportPeriodName}. Thời hạn: ${new Date(data.endDate).toLocaleDateString('vi-VN')}.`
    })

    console.log('✅ Teacher reminder email sent successfully to:', data.teacherEmail)
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send teacher reminder email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// Send parent report notification email (simplified)
export async function sendParentReportEmail(data: ParentReportEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured')
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'EduConnect Portal <noreply@gmail.com>',
      to: data.parentEmail,
      subject: `[EduConnect] Báo cáo học tập của con em ${data.studentName} - ${data.reportPeriodName}`,
      html: createParentReportTemplate(data),
      text: `Thông báo từ EduConnect Portal: Báo cáo học tập của con em ${data.studentName} cho ${data.reportPeriodName} đã sẵn sàng. Vui lòng truy cập hệ thống để xem chi tiết.`
    })

    console.log('✅ Parent report email sent successfully to:', data.parentEmail)
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send parent report email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// Send parent reminder email (simplified)
export async function sendParentReminderEmail(data: ParentReminderEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured')
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'EduConnect Portal <noreply@gmail.com>',
      to: data.parentEmail,
      subject: `[EduConnect] Nhắc nhở xem báo cáo học tập của con em ${data.studentName}`,
      html: createParentReminderTemplate(data),
      text: `Thông báo từ EduConnect Portal: Nhắc nhở xem báo cáo học tập của con em ${data.studentName} cho ${data.reportPeriodName}. Vui lòng truy cập hệ thống để xem chi tiết.`
    })

    console.log('✅ Parent reminder email sent successfully to:', data.parentEmail)
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send parent reminder email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// Test email function to verify SMTP configuration
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured')
    }

    // Verify SMTP connection
    await transporter.verify()
    console.log('✅ SMTP connection verified successfully')

    // Send test email
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'EduConnect <noreply@gmail.com>',
      to: process.env.SMTP_USER, // Send to self for testing
      subject: '🧪 Test Email - EduConnect System',
      html: `
        <h2>✅ Email Test Successful</h2>
        <p>This is a test email from EduConnect system.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
        <p><strong>From:</strong> ${process.env.EMAIL_FROM}</p>
      `,
      text: `Email test successful at ${new Date().toLocaleString('vi-VN')}`
    })

    console.log('✅ Test email sent successfully:', result.messageId)
    return { success: true }
  } catch (error) {
    console.error('❌ Email test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email test failed'
    }
  }
}
