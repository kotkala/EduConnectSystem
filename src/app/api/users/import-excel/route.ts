import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const VALID_ROLES = [
  'admin',
  'school_administrator',
  'homeroom_teacher',
  'subject_teacher',
  'parent',
  'student',
]

function parseRow(header: string[], row: any[]): Record<string, any> {
  // ExcelJS row.values[0] is null, so values[1] is first col
  const values = row.slice(1)
  const obj: Record<string, any> = {}
  for (let i = 0; i < header.length; i++) {
    let cellValue = values[i] ?? ''
    
    // Handle different cell types and clean the data
    if (cellValue !== null && cellValue !== undefined) {
      // Handle object values (common with ExcelJS)
      if (typeof cellValue === 'object') {
        if (cellValue.text) {
          cellValue = cellValue.text
        } else if (cellValue.value !== undefined) {
          cellValue = cellValue.value
        } else if (cellValue.result !== undefined) {
          cellValue = cellValue.result
        } else {
          cellValue = ''
        }
      }
      
      // Convert to string and trim whitespace
      cellValue = String(cellValue).trim()
      
      // Handle special Excel values
      if (cellValue === 'null' || cellValue === 'undefined' || cellValue === '#N/A' || cellValue === '[object Object]') {
        cellValue = ''
      }
    } else {
      cellValue = ''
    }
    
    obj[header[i]] = cellValue
  }
  return obj
}

// Parse student row with parent info
function parseStudentRow(rowData: Record<string, any>) {
  const studentData = {
    phone: String(rowData.student_phone || '').trim(),
    full_name: String(rowData.student_full_name || '').trim(),
    role: 'student',
    email: String(rowData.student_email || '').trim().toLowerCase(),
    password: String(rowData.student_password || '').trim(),
    gender: String(rowData.student_gender || '').trim(),
    date_of_birth: String(rowData.student_date_of_birth || '').trim(),
    avatar_url: String(rowData.student_avatar_url || '').trim(),
    street_address: String(rowData.student_street_address || '').trim(),
    district: String(rowData.student_district || '').trim(),
    city: String(rowData.student_city || '').trim(),
    province: String(rowData.student_province || '').trim(),
    postal_code: String(rowData.student_postal_code || '').trim(),
    country: String(rowData.student_country || 'Vietnam').trim(),
  }
  
  const parentData = {
    phone: String(rowData.parent_phone || '').trim(),
    full_name: String(rowData.parent_full_name || '').trim(),
    role: 'parent',
    email: String(rowData.parent_email || '').trim().toLowerCase(),
    password: String(rowData.parent_password || '').trim(),
    gender: String(rowData.parent_gender || '').trim(),
    date_of_birth: String(rowData.parent_date_of_birth || '').trim(),
    avatar_url: String(rowData.parent_avatar_url || '').trim(),
    street_address: String(rowData.parent_street_address || '').trim(),
    district: String(rowData.parent_district || '').trim(),
    city: String(rowData.parent_city || '').trim(),
    province: String(rowData.parent_province || '').trim(),
    postal_code: String(rowData.parent_postal_code || '').trim(),
    country: String(rowData.parent_country || 'Vietnam').trim(),
  }
  
  const relationship = {
    relationship_type: String(rowData.relationship_type || 'parent').trim(),
    is_primary_contact: rowData.is_primary_contact === 'true' || rowData.is_primary_contact === true,
  }
  
  return { studentData, parentData, relationship }
}

// Parse parent row with student linkage
function parseParentRow(rowData: Record<string, any>) {
  const parentData = {
    phone: String(rowData.parent_phone || '').trim(),
    full_name: String(rowData.parent_full_name || '').trim(),
    role: 'parent',
    email: String(rowData.parent_email || '').trim().toLowerCase(),
    password: String(rowData.parent_password || '').trim(),
    gender: String(rowData.parent_gender || '').trim(),
    date_of_birth: String(rowData.parent_date_of_birth || '').trim(),
    avatar_url: String(rowData.parent_avatar_url || '').trim(),
    street_address: String(rowData.parent_street_address || '').trim(),
    district: String(rowData.parent_district || '').trim(),
    city: String(rowData.parent_city || '').trim(),
    province: String(rowData.parent_province || '').trim(),
    postal_code: String(rowData.parent_postal_code || '').trim(),
    country: String(rowData.parent_country || 'Vietnam').trim(),
  }
  
  const studentLinkage = {
    student_email_or_phone: String(rowData.student_email_or_phone || '').trim().toLowerCase(),
    relationship_type: String(rowData.relationship_type || 'parent').trim(),
    is_primary_contact: rowData.is_primary_contact === 'true' || rowData.is_primary_contact === true,
  }
  
  return { parentData, studentLinkage }
}

// Validate user data
function validateUserData(userData: any, isParent = false): string[] {
  const errors: string[] = []
  
  // Clean and validate required fields
  const phone = String(userData.phone || '').trim()
  const full_name = String(userData.full_name || '').trim()
  const email = String(userData.email || '').trim().toLowerCase()
  
  if (!phone || !full_name || !email) {
    errors.push('Phone, full name, and email are required')
  }
  
  if (!VALID_ROLES.includes(userData.role)) {
    errors.push('Invalid role')
  }
  
  const street_address = String(userData.street_address || '').trim()
  const city = String(userData.city || '').trim()
  const province = String(userData.province || '').trim()
  
  if (!street_address || !city || !province) {
    errors.push('Address (street, city, province) is required')
  }
  
  // Enhanced email format validation
  if (email) {
    // Remove any potential Excel artifacts
    const cleanEmail = email.replace(/[\r\n\t]/g, '').trim()
    
    // Check if email is empty after cleaning
    if (!cleanEmail) {
      errors.push('Email cannot be empty')
    } else {
      // Check for Gmail domain requirement
      if (!cleanEmail.endsWith('@gmail.com')) {
        errors.push(`Email must be a Gmail address ending with @gmail.com. Current: "${cleanEmail}"`)
      } else {
        // More robust email regex for Gmail
        const gmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/
        
        if (!gmailRegex.test(cleanEmail)) {
          errors.push(`Invalid Gmail format: "${cleanEmail}"`)
        }
        
        // Check for common issues
        if (cleanEmail.includes('..')) {
          errors.push('Email cannot contain consecutive dots')
        }
        
        if (cleanEmail.startsWith('.') || cleanEmail.includes('@.')) {
          errors.push('Gmail format is invalid')
  }
  
        // Check for minimum length (minimum valid Gmail: a@gmail.com = 11 chars)
        if (cleanEmail.length < 11) {
          errors.push('Gmail address is too short (minimum: a@gmail.com)')
        }
        
        // Check for maximum length
        if (cleanEmail.length > 254) {
          errors.push('Email is too long (maximum 254 characters)')
        }
        
        // Check local part (before @gmail.com)
        const localPart = cleanEmail.replace('@gmail.com', '')
        if (localPart.length < 1) {
          errors.push('Gmail address must have at least 1 character before @gmail.com')
        }
        
        if (localPart.length > 64) {
          errors.push('Gmail local part is too long (maximum 64 characters before @gmail.com)')
        }
      }
    }
  }
  
  // Phone format validation (enhanced)
  if (phone) {
    const cleanPhone = phone.replace(/[^\d+]/g, '') // Remove all non-digit except +
    if (cleanPhone.length < 10) {
    errors.push('Phone number must be at least 10 digits')
    }
  }
  
  return errors
}

// Create user with address
async function createUserWithAddress(supabase: any, userData: any, adminUserId: string) {
  // Create admin client for user creation
  const adminSupabase = createAdminClient()
  
  // Ensure password is provided, use default if not
  const password = userData.password || 'EduConnect@2024'
  
  // Clean and validate email before creating user
  const cleanEmail = String(userData.email || '').trim().toLowerCase()
  const cleanPhone = String(userData.phone || '').trim()
  const cleanFullName = String(userData.full_name || '').trim()
  
  // Create user in Supabase Auth using admin client
  const { data: authData, error: authCreateError } = await adminSupabase.auth.admin.createUser({
    email: cleanEmail,
    password: password,
    phone: cleanPhone,
    user_metadata: {
      full_name: cleanFullName,
      role: userData.role,
    },
    email_confirm: true, // Auto-confirm email for imported users
  })
  
  if (authCreateError) throw new Error(`Auth error: ${authCreateError.message}`)
  
  const user_id = authData.user.id
  
  try {
    // Insert user profile
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .insert({
        id: user_id,
        phone: cleanPhone,
        full_name: cleanFullName,
        role: userData.role,
        gender: String(userData.gender || '').trim(),
        date_of_birth: String(userData.date_of_birth || '').trim() || null,
        avatar_url: String(userData.avatar_url || '').trim() || null,
        created_by: adminUserId,
      })
      .select()
      .single()
    
    if (userError) throw new Error(`User profile error: ${userError.message}`)
    
    // Insert address
    const { data: addressProfile, error: addressError } = await supabase
      .from('addresses')
      .insert({
        user_id,
        type: 'home',
        street_address: String(userData.street_address || '').trim(),
        district: String(userData.district || '').trim() || null,
        city: String(userData.city || '').trim(),
        province: String(userData.province || '').trim(),
        postal_code: String(userData.postal_code || '').trim() || null,
        country: String(userData.country || 'Vietnam').trim(),
        is_primary: true,
      })
      .select()
      .single()
    
    if (addressError) throw new Error(`Address error: ${addressError.message}`)
    
    return { user: userProfile, address: addressProfile, user_id }
  } catch (err) {
    // Cleanup: delete auth user if any step failed
    await adminSupabase.auth.admin.deleteUser(user_id)
    throw err
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)
    
    const supabase = await createClient()
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !adminUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    
    const results: any[] = []
    let totalProcessed = 0
    
    // Process each worksheet
    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name
      
      if (worksheet.rowCount <= 1) continue // Skip empty sheets
      
      // Parse header
      const headerRow = worksheet.getRow(1)
      const headerValues = Array.isArray(headerRow.values) ? headerRow.values : []
      const header: string[] = headerValues.slice(1) as string[]
      
      // Process each row
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber)
        const values = Array.isArray(row.values) ? row.values : []
        const rowData = parseRow(header, values)
        
        // Skip empty rows
        if (Object.values(rowData).every(val => !val)) continue
        
        totalProcessed++
        
        try {
          if (sheetName === 'Students') {
            // Handle student with parent
            const { studentData, parentData, relationship } = parseStudentRow(rowData)
            
            // Validate both student and parent data
            const studentErrors = validateUserData(studentData)
            const parentErrors = validateUserData(parentData, true)
            
            if (studentErrors.length > 0 || parentErrors.length > 0) {
              results.push({
                sheet: sheetName,
                row: rowNumber,
                data: rowData,
                success: false,
                errors: [...studentErrors.map(e => `Student: ${e}`), ...parentErrors.map(e => `Parent: ${e}`)]
              })
              continue
            }
            
            // Check for duplicate emails
            const [existingStudentEmail, existingParentEmail] = await Promise.all([
              supabase.from('users').select('id').eq('email', studentData.email).maybeSingle(),
              supabase.from('users').select('id').eq('email', parentData.email).maybeSingle()
            ])
            
            if (existingStudentEmail.data) {
              results.push({
                sheet: sheetName,
                row: rowNumber,
                data: rowData,
                success: false,
                errors: ['Student email already exists']
              })
              continue
            }
            
            if (existingParentEmail.data) {
              results.push({
                sheet: sheetName,
                row: rowNumber,
                data: rowData,
                success: false,
                errors: ['Parent email already exists']
              })
              continue
            }
            
            // Create parent first
            const { user: parentUser, user_id: parentUserId } = await createUserWithAddress(supabase, parentData, adminUser.id)
            
            // Create student
            const { user: studentUser, user_id: studentUserId } = await createUserWithAddress(supabase, studentData, adminUser.id)
            
            // Create parent-student relationship
            const { error: relationshipError } = await supabase
              .from('parent_student_relationships')
              .insert({
                parent_id: parentUserId,
                student_id: studentUserId,
                relationship_type: relationship.relationship_type,
                is_primary_contact: relationship.is_primary_contact,
              })
            
            if (relationshipError) {
              // Cleanup both users
              await Promise.all([
                supabase.auth.admin.deleteUser(parentUserId),
                supabase.auth.admin.deleteUser(studentUserId)
              ])
              throw new Error(`Relationship error: ${relationshipError.message}`)
            }
            
            results.push({
              sheet: sheetName,
              row: rowNumber,
              data: rowData,
              success: true,
              created: { student: studentUser, parent: parentUser, relationship: true }
            })
            
          } else if (sheetName === 'Parents') {
            // Handle parent with student linkage
            const { parentData, studentLinkage } = parseParentRow(rowData)
            
            const parentErrors = validateUserData(parentData, true)
            if (parentErrors.length > 0) {
              results.push({
                sheet: sheetName,
                row: rowNumber,
                data: rowData,
                success: false,
                errors: parentErrors
              })
              continue
            }
            
            // Check for duplicate email
            const { data: existingParentEmail } = await supabase.from('users').select('id').eq('email', parentData.email).maybeSingle()
            if (existingParentEmail) {
              results.push({
                sheet: sheetName,
                row: rowNumber,
                data: rowData,
                success: false,
                errors: ['Parent email already exists']
              })
              continue
            }
            
            // Create parent
            const { user: parentUser, user_id: parentUserId } = await createUserWithAddress(supabase, parentData, adminUser.id)
            
            // Link to student if provided
            let relationshipCreated = false
            if (studentLinkage.student_email_or_phone) {
              const { data: existingStudent } = await supabase
                .from('users')
                .select('id')
                .or(`email.eq.${studentLinkage.student_email_or_phone},phone.eq.${studentLinkage.student_email_or_phone}`)
                .eq('role', 'student')
                .maybeSingle()
              
              if (existingStudent) {
                const { error: relationshipError } = await supabase
                  .from('parent_student_relationships')
                  .insert({
                    parent_id: parentUserId,
                    student_id: existingStudent.id,
                    relationship_type: studentLinkage.relationship_type,
                    is_primary_contact: studentLinkage.is_primary_contact,
                  })
                
                if (!relationshipError) {
                  relationshipCreated = true
                }
              }
            }
            
            results.push({
              sheet: sheetName,
              row: rowNumber,
              data: rowData,
              success: true,
              created: { parent: parentUser, relationship: relationshipCreated }
            })
            
          } else {
            // Handle other roles (teachers, admins)
            const userData = {
              phone: String(rowData.phone || '').trim(),
              full_name: String(rowData.full_name || '').trim(),
              role: sheetName === 'Homeroom Teachers' ? 'homeroom_teacher' : 
                    sheetName === 'Subject Teachers' ? 'subject_teacher' : 
                    sheetName === 'School Administrators' ? 'school_administrator' : 'admin',
              email: String(rowData.email || '').trim().toLowerCase(),
              password: String(rowData.password || '').trim(),
              gender: String(rowData.gender || '').trim(),
              date_of_birth: String(rowData.date_of_birth || '').trim(),
              avatar_url: String(rowData.avatar_url || '').trim(),
              street_address: String(rowData.street_address || '').trim(),
              district: String(rowData.district || '').trim(),
              city: String(rowData.city || '').trim(),
              province: String(rowData.province || '').trim(),
              postal_code: String(rowData.postal_code || '').trim(),
              country: String(rowData.country || 'Vietnam').trim(),
            }
            
            const errors = validateUserData(userData)
            if (errors.length > 0) {
              results.push({
                sheet: sheetName,
                row: rowNumber,
                data: rowData,
                success: false,
                errors
              })
              continue
            }
            
            // Check for duplicate email
            const { data: existingEmail } = await supabase.from('users').select('id').eq('email', userData.email).maybeSingle()
            if (existingEmail) {
              results.push({
                sheet: sheetName,
                row: rowNumber,
                data: rowData,
                success: false,
                errors: ['Email already exists']
              })
              continue
            }
            
            // Create user
            const { user } = await createUserWithAddress(supabase, userData, adminUser.id)
            
            results.push({
              sheet: sheetName,
              row: rowNumber,
              data: rowData,
              success: true,
              created: { user }
            })
          }
          
        } catch (err: any) {
          results.push({
            sheet: sheetName,
            row: rowNumber,
            data: rowData,
            success: false,
            errors: [err.message]
          })
        }
      }
    }
    
    // Summary
    const successCount = results.filter(r => r.success).length
    const errorCount = results.length - successCount
    
    return NextResponse.json({
      success: errorCount === 0,
      summary: { 
        total: totalProcessed, 
        success: successCount, 
        error: errorCount,
        sheets_processed: workbook.worksheets.length
      },
      results,
      message: errorCount === 0 ? 'All users imported successfully' : 'Some rows failed to import',
    }, { status: errorCount === 0 ? 200 : (successCount > 0 ? 207 : 400) })
    
  } catch (error) {
    console.error('Import Excel error:', error)
    return NextResponse.json({ success: false, error: 'Failed to import users from Excel' }, { status: 500 })
  }
} 