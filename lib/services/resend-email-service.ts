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

// Teacher reminder email template (HTML)
function createTeacherReminderTemplate(data: TeacherReminderEmailData): string {
  const incompleteClassesList = data.incompleteClasses
    .map(cls => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${cls.className}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${cls.completedReports}/${cls.totalStudents}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${cls.totalStudents - cls.completedReports}</td>
      </tr>
    `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nhắc nhở nộp báo cáo học sinh</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Nhắc nhở nộp báo cáo học sinh</h2>
        
        <p>Kính chào <strong>${data.teacherName}</strong>,</p>
        
        <p>Chúng tôi xin nhắc nhở về việc nộp báo cáo học sinh cho <strong>${data.reportPeriodName}</strong>.</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⏰ Thời hạn:</strong> ${new Date(data.endDate).toLocaleDateString('vi-VN')}</p>
        </div>
        
        <h3>Các lớp chưa hoàn thành báo cáo:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Lớp</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Đã nộp</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Còn lại</th>
            </tr>
          </thead>
          <tbody>
            ${incompleteClassesList}
          </tbody>
        </table>
        
        <p>Vui lòng hoàn thành báo cáo cho tất cả học sinh trước thời hạn.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Trân trọng,<br>
            <strong>Hệ thống quản lý giáo dục EduConnect</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Parent report notification email template (HTML)
function createParentReportTemplate(data: ParentReportEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Báo cáo học tập của ${data.studentName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">📋 Báo cáo học tập mới</h2>
        
        <p>Kính chào <strong>${data.parentName}</strong>,</p>
        
        <p>Báo cáo học tập của con em bạn <strong>${data.studentName}</strong> cho <strong>${data.reportPeriodName}</strong> đã sẵn sàng.</p>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #059669;">📅 Thông tin kỳ báo cáo</h3>
          <p style="margin: 5px 0;"><strong>Kỳ báo cáo:</strong> ${data.reportPeriodName}</p>
          <p style="margin: 5px 0;"><strong>Từ ngày:</strong> ${new Date(data.startDate).toLocaleDateString('vi-VN')}</p>
          <p style="margin: 5px 0;"><strong>Đến ngày:</strong> ${new Date(data.endDate).toLocaleDateString('vi-VN')}</p>
        </div>
        
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết báo cáo học tập của con em.</p>
        
        ${data.reportUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.reportUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            📖 Xem báo cáo
          </a>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Trân trọng,<br>
            <strong>Hệ thống quản lý giáo dục EduConnect</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Parent reminder email template (HTML)
function createParentReminderTemplate(data: ParentReminderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nhắc nhở xem báo cáo học tập</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">⏰ Nhắc nhở xem báo cáo học tập</h2>
        
        <p>Kính chào <strong>${data.parentName}</strong>,</p>
        
        <p>Chúng tôi xin nhắc nhở về báo cáo học tập của con em bạn <strong>${data.studentName}</strong> cho <strong>${data.reportPeriodName}</strong>.</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📋 Báo cáo đã sẵn sàng từ:</strong> ${new Date(data.endDate).toLocaleDateString('vi-VN')}</p>
          <p style="margin: 10px 0 0 0;">Vui lòng đăng nhập hệ thống để xem chi tiết.</p>
        </div>
        
        ${data.reportUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.reportUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            📖 Xem báo cáo ngay
          </a>
        </div>
        ` : ''}
        
        <p>Việc theo dõi báo cáo học tập giúp phụ huynh nắm bắt tình hình học tập và rèn luyện của con em.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Trân trọng,<br>
            <strong>Hệ thống quản lý giáo dục EduConnect</strong>
          </p>
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
      from: process.env.EMAIL_FROM || 'EduConnect <noreply@gmail.com>',
      to: data.teacherEmail,
      subject: `⏰ Nhắc nhở nộp báo cáo học sinh - ${data.reportPeriodName}`,
      html: createTeacherReminderTemplate(data),
      text: `Nhắc nhở nộp báo cáo học sinh cho ${data.reportPeriodName}. Thời hạn: ${new Date(data.endDate).toLocaleDateString('vi-VN')}.`
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
      from: process.env.EMAIL_FROM || 'EduConnect <noreply@gmail.com>',
      to: data.parentEmail,
      subject: `📋 Báo cáo học tập mới - ${data.studentName} (${data.reportPeriodName})`,
      html: createParentReportTemplate(data),
      text: `Báo cáo học tập của ${data.studentName} cho ${data.reportPeriodName} đã sẵn sàng. Vui lòng đăng nhập hệ thống để xem chi tiết.`
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
      from: process.env.EMAIL_FROM || 'EduConnect <noreply@gmail.com>',
      to: data.parentEmail,
      subject: `⏰ Nhắc nhở xem báo cáo học tập - ${data.studentName}`,
      html: createParentReminderTemplate(data),
      text: `Nhắc nhở xem báo cáo học tập của ${data.studentName} cho ${data.reportPeriodName}. Vui lòng đăng nhập hệ thống để xem chi tiết.`
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
