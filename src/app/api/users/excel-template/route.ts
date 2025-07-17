import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'

const ROLE_TEMPLATES = {
  student: {
    name: 'Student Template',
    sheets: [
      {
        name: 'Students',
        columns: [
          // Student basic info
          'student_phone', 'student_full_name', 'student_gender', 'student_date_of_birth', 
          'student_avatar_url', 'student_email', 'student_password',
          // Student address
          'student_street_address', 'student_district', 'student_city', 
          'student_province', 'student_postal_code', 'student_country',
          // Parent info (required for student)
          'parent_phone', 'parent_full_name', 'parent_gender', 'parent_date_of_birth',
          'parent_avatar_url', 'parent_email', 'parent_password',
          // Parent address
          'parent_street_address', 'parent_district', 'parent_city',
          'parent_province', 'parent_postal_code', 'parent_country',
          // Relationship
          'relationship_type', 'is_primary_contact'
        ],
        sampleData: [
          [
            '0123456789', 'Nguyễn Văn A', 'male', '2010-01-01', 
            '', 'student.nguyen@gmail.com', 'password123',
            '123 Đường ABC', 'Quận 1', 'TP.HCM', 
            'TP.HCM', '70000', 'Vietnam',
            '0987654321', 'Nguyễn Văn B', 'male', '1980-01-01',
            '', 'parent.nguyen@gmail.com', 'password123',
            '123 Đường ABC', 'Quận 1', 'TP.HCM',
            'TP.HCM', '70000', 'Vietnam',
            'parent', 'true'
          ]
        ]
      }
    ]
  },
  parent: {
    name: 'Parent Template',
    sheets: [
      {
        name: 'Parents',
        columns: [
          // Parent basic info
          'parent_phone', 'parent_full_name', 'parent_gender', 'parent_date_of_birth',
          'parent_avatar_url', 'parent_email', 'parent_password',
          // Parent address
          'parent_street_address', 'parent_district', 'parent_city',
          'parent_province', 'parent_postal_code', 'parent_country',
          // Student linkage (optional - có thể link sau)
          'student_email_or_phone', 'relationship_type', 'is_primary_contact'
        ],
        sampleData: [
          [
            '0987654321', 'Nguyễn Văn B', 'male', '1980-01-01',
            '', 'parent@gmail.com', 'password123',
            '123 Đường ABC', 'Quận 1', 'TP.HCM',
            'TP.HCM', '70000', 'Vietnam',
            'student@gmail.com', 'parent', 'true'
          ]
        ]
      }
    ]
  },
  homeroom_teacher: {
    name: 'Homeroom Teacher Template',
    sheets: [
      {
        name: 'Homeroom Teachers',
        columns: [
          'phone', 'full_name', 'gender', 'date_of_birth', 'avatar_url', 'email', 'password',
          'street_address', 'district', 'city', 'province', 'postal_code', 'country',
          'subject_specialization', 'teaching_experience_years'
        ],
        sampleData: [
          [
            '0123456789', 'Nguyễn Thị C', 'female', '1985-01-01', 
            '', 'teacher@gmail.com', 'password123',
            '456 Đường XYZ', 'Quận 2', 'TP.HCM', 
            'TP.HCM', '70000', 'Vietnam',
            'Toán học', '10'
          ]
        ]
      }
    ]
  },
  subject_teacher: {
    name: 'Subject Teacher Template',
    sheets: [
      {
        name: 'Subject Teachers',
        columns: [
          'phone', 'full_name', 'gender', 'date_of_birth', 'avatar_url', 'email', 'password',
          'street_address', 'district', 'city', 'province', 'postal_code', 'country',
          'subject_specialization', 'teaching_experience_years', 'qualification'
        ],
        sampleData: [
          [
            '0123456789', 'Trần Văn D', 'male', '1982-01-01', 
            '', 'subject.teacher@example.com', 'password123',
            '789 Đường DEF', 'Quận 3', 'TP.HCM', 
            'TP.HCM', '70000', 'Vietnam',
            'Vật lý', '8', 'Thạc sĩ Vật lý'
          ]
        ]
      }
    ]
  },
  school_administrator: {
    name: 'School Administrator Template',
    sheets: [
      {
        name: 'School Administrators',
        columns: [
          'phone', 'full_name', 'gender', 'date_of_birth', 'avatar_url', 'email', 'password',
          'street_address', 'district', 'city', 'province', 'postal_code', 'country',
          'position', 'department', 'management_experience_years'
        ],
        sampleData: [
          [
            '0123456789', 'Lê Thị E', 'female', '1975-01-01', 
            '', 'admin@gmail.com', 'password123',
            '321 Đường GHI', 'Quận 4', 'TP.HCM', 
            'TP.HCM', '70000', 'Vietnam',
            'Phó Hiệu trưởng', 'Phòng Đào tạo', '15'
          ]
        ]
      }
    ]
  },
  all: {
    name: 'All Roles Template',
    sheets: [
      {
        name: 'Students',
        columns: [
          'student_phone', 'student_full_name', 'student_gender', 'student_date_of_birth', 
          'student_avatar_url', 'student_email', 'student_password',
          'student_street_address', 'student_district', 'student_city', 
          'student_province', 'student_postal_code', 'student_country',
          'parent_phone', 'parent_full_name', 'parent_gender', 'parent_date_of_birth',
          'parent_avatar_url', 'parent_email', 'parent_password',
          'parent_street_address', 'parent_district', 'parent_city',
          'parent_province', 'parent_postal_code', 'parent_country',
          'relationship_type', 'is_primary_contact'
        ],
        sampleData: []
      },
      {
        name: 'Parents',
        columns: [
          'parent_phone', 'parent_full_name', 'parent_gender', 'parent_date_of_birth',
          'parent_avatar_url', 'parent_email', 'parent_password',
          'parent_street_address', 'parent_district', 'parent_city',
          'parent_province', 'parent_postal_code', 'parent_country',
          'student_email_or_phone', 'relationship_type', 'is_primary_contact'
        ],
        sampleData: []
      },
      {
        name: 'Homeroom Teachers',
        columns: [
          'phone', 'full_name', 'gender', 'date_of_birth', 'avatar_url', 'email', 'password',
          'street_address', 'district', 'city', 'province', 'postal_code', 'country',
          'subject_specialization', 'teaching_experience_years'
        ],
        sampleData: []
      },
      {
        name: 'Subject Teachers',
        columns: [
          'phone', 'full_name', 'gender', 'date_of_birth', 'avatar_url', 'email', 'password',
          'street_address', 'district', 'city', 'province', 'postal_code', 'country',
          'subject_specialization', 'teaching_experience_years', 'qualification'
        ],
        sampleData: []
      },
      {
        name: 'School Administrators',
        columns: [
          'phone', 'full_name', 'gender', 'date_of_birth', 'avatar_url', 'email', 'password',
          'street_address', 'district', 'city', 'province', 'postal_code', 'country',
          'position', 'department', 'management_experience_years'
        ],
        sampleData: []
      }
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'all'
    const template = ROLE_TEMPLATES[role as keyof typeof ROLE_TEMPLATES] || ROLE_TEMPLATES.all

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'EduConnect System'
    workbook.lastModifiedBy = 'EduConnect System'
    workbook.created = new Date()
    workbook.modified = new Date()

    // Create sheets for the template
    template.sheets.forEach((sheetConfig, index) => {
      const sheet = workbook.addWorksheet(sheetConfig.name)
      
      // Add header row with styling
      const headerRow = sheet.addRow(sheetConfig.columns)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
      
      // Set column widths
      sheetConfig.columns.forEach((_, colIndex) => {
        sheet.getColumn(colIndex + 1).width = 20
      })
      
      // Add sample data if available
      if (sheetConfig.sampleData && sheetConfig.sampleData.length > 0) {
        sheetConfig.sampleData.forEach(rowData => {
          const dataRow = sheet.addRow(rowData)
          dataRow.font = { color: { argb: '666666' } }
          dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } }
        })
      }
      
      // Add data validation and comments for important fields
      if (sheetConfig.name === 'Students') {
        // Add comment for student email (column F = student_email)
        const emailCell = sheet.getCell('F1')
        emailCell.note = 'Email học sinh phải là Gmail (@gmail.com). VD: student@gmail.com. Không được chứa khoảng trắng hoặc ký tự đặc biệt không hợp lệ.'
        
        // Add comment for parent email (column Q = parent_email)  
        const parentEmailCell = sheet.getCell('Q1')
        parentEmailCell.note = 'Email phụ huynh phải là Gmail (@gmail.com). VD: parent@gmail.com. Sẽ dùng để đăng nhập hệ thống.'
        
        // Add comment for phone numbers
        const studentPhoneCell = sheet.getCell('A1')
        studentPhoneCell.note = 'Số điện thoại học sinh (tối thiểu 10 số). VD: 0123456789'
        
        const parentPhoneCell = sheet.getCell('L1')
        parentPhoneCell.note = 'Số điện thoại phụ huynh (tối thiểu 10 số). VD: 0987654321'
        
        // Add comment for required fields
        const studentNameCell = sheet.getCell('B1')
        studentNameCell.note = 'Tên đầy đủ của học sinh (bắt buộc)'
        
        const parentNameCell = sheet.getCell('M1')
        parentNameCell.note = 'Tên đầy đủ của phụ huynh (bắt buộc)'
      }
      
      // Add validation for other role templates
      if (sheetConfig.name === 'Parents') {
        const emailCell = sheet.getCell('C1') // parent_email position
        emailCell.note = 'Email phải là Gmail (@gmail.com). VD: parent@gmail.com'
      }
      
      if (sheetConfig.name === 'Homeroom Teachers' || sheetConfig.name === 'Subject Teachers' || sheetConfig.name === 'School Administrators') {
        const emailCell = sheet.getCell('C1') // email position for teachers/admins
        emailCell.note = 'Email phải là Gmail (@gmail.com). VD: teacher@gmail.com'
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="educonnect_${role}_template.xlsx"`
      }
    })
  } catch (error) {
    console.error('Excel template error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate Excel template' }, { status: 500 })
  }
} 