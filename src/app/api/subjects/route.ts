import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SUBJECT_TYPES, SUBJECT_CATEGORIES, PREDEFINED_SUBJECTS } from '@/lib/constants/subject-types'

// Use predefined subjects from constants
const SUBJECTS_TO_INITIALIZE = [
  // ============================================
  // MÔN HỌC BẮT BUỘC (MANDATORY SUBJECTS)
  // ============================================
  {
    name: 'Ngữ văn',
    code: 'LIT',
    description: 'Môn học bắt buộc về ngôn ngữ và văn học Việt Nam',
    credits: 3,
    metadata: {
      category: SUBJECT_CATEGORIES.LANGUAGE_ARTS,
      type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 105,
      name_en: 'Literature'
    }
  },
  {
    name: 'Toán',
    code: 'MATH',
    description: 'Môn học bắt buộc về toán học',
    credits: 3,
    metadata: {
      category: SUBJECT_CATEGORIES.MATHEMATICS,
      type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 105,
      name_en: 'Mathematics'
    }
  },
  {
    name: 'Tiếng Anh',
    code: 'ENG',
    description: 'Ngoại ngữ 1 - Tiếng Anh',
    credits: 3,
    metadata: {
      category: SUBJECT_CATEGORIES.LANGUAGE_ARTS,
      type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 105,
      name_en: 'English'
    }
  },
  {
    name: 'Lịch sử',
    code: 'HIST',
    description: 'Môn học bắt buộc về lịch sử',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.SOCIAL_SCIENCES,
      type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 70,
      name_en: 'History'
    }
  },
  {
    name: 'Giáo dục quốc phòng và an ninh',
    code: 'NDSE',
    description: 'Môn học bắt buộc về giáo dục quốc phòng và an ninh',
    credits: 1,
    metadata: {
      category: SUBJECT_CATEGORIES.CIVIC_EDUCATION,
      type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 35,
      name_en: 'National Defense and Security Education'
    }
  },
  {
    name: 'Hoạt động trải nghiệm - hướng nghiệp',
    code: 'EXPR',
    description: 'Hoạt động trải nghiệm - hướng nghiệp',
    credits: 3,
    metadata: {
      category: SUBJECT_CATEGORIES.EXPERIENTIAL_ACTIVITIES,
      type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 105,
      name_en: 'Experiential Activities - Career Orientation'
    }
  },
  {
    name: 'Giáo dục địa phương',
    code: 'LOCAL',
    description: 'Giáo dục địa phương',
    credits: 1,
    metadata: {
      category: SUBJECT_CATEGORIES.CIVIC_EDUCATION,
      type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 35,
      name_en: 'Local Education'
    }
  },
  {
    name: 'Giáo dục thể chất',
    code: 'PE',
    description: 'Giáo dục thể chất',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.PHYSICAL_EDUCATION,
      type: SUBJECT_TYPES.MANDATORY,
      periods_per_year: 70,
      name_en: 'Physical Education'
    }
  },

  // ============================================
  // MÔN HỌC TỰ CHỌN (ELECTIVE SUBJECTS)
  // ============================================
  {
    name: 'Địa lý',
    code: 'GEO',
    description: 'Môn học tự chọn về địa lý',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.SOCIAL_SCIENCES,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Geography'
    }
  },
  {
    name: 'Giáo dục kinh tế và pháp luật',
    code: 'ECON',
    description: 'Môn học tự chọn về kinh tế và pháp luật',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.SOCIAL_SCIENCES,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Economics and Law Education'
    }
  },
  {
    name: 'Vật lý',
    code: 'PHYS',
    description: 'Môn học tự chọn về vật lý',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.NATURAL_SCIENCES,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Physics'
    }
  },
  {
    name: 'Hóa học',
    code: 'CHEM',
    description: 'Môn học tự chọn về hóa học',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.NATURAL_SCIENCES,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Chemistry'
    }
  },
  {
    name: 'Sinh học',
    code: 'BIO',
    description: 'Môn học tự chọn về sinh học',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.NATURAL_SCIENCES,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Biology'
    }
  },
  {
    name: 'Công nghệ',
    code: 'TECH',
    description: 'Môn học tự chọn về công nghệ',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.TECHNOLOGY,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Technology'
    }
  },
  {
    name: 'Tin học',
    code: 'CS',
    description: 'Môn học tự chọn về tin học',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.TECHNOLOGY,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Computer Science'
    }
  },
  {
    name: 'Âm nhạc',
    code: 'MUSIC',
    description: 'Môn học tự chọn về âm nhạc',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.ARTS,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Music'
    }
  },
  {
    name: 'Mỹ thuật',
    code: 'ART',
    description: 'Môn học tự chọn về mỹ thuật',
    credits: 2,
    metadata: {
      category: SUBJECT_CATEGORIES.ARTS,
      type: SUBJECT_TYPES.ELECTIVE,
      periods_per_year: 70,
      name_en: 'Fine Arts'
    }
  }
]

// GET - List all subjects with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Query parameters
    const type = searchParams.get('type') // mandatory, elective
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query - only use existing columns
    let query = supabase
      .from('subjects')
      .select('*', { count: 'exact' })
      .order('name')

    // Apply filters using metadata for category
    if (type) {
      query = query.contains('metadata', { type })
    }
    if (category) {
      query = query.contains('metadata', { category })
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: subjects, error, count } = await query

    if (error) {
      console.error('Error fetching subjects:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subjects' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: subjects,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Subjects API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new subject or initialize predefined subjects
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Check if this is an initialization request
    if (body.action === 'initialize') {
      console.log('Initializing predefined subjects...')
      
      // Check existing subjects
      const { data: existingSubjects } = await supabase
        .from('subjects')
        .select('code')
      
      const existingCodes = existingSubjects?.map(s => s.code) || []
      const newSubjects = PREDEFINED_SUBJECTS.filter(s => !existingCodes.includes(s.code))
      
      if (newSubjects.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All predefined subjects already exist',
          data: []
        })
      }

      const { data: insertedSubjects, error: insertError } = await supabase
        .from('subjects')
        .insert(newSubjects.map(subject => ({
          name: subject.name,
          code: subject.code,
          description: subject.description,
          credits: subject.credits,
          metadata: subject.metadata,
          created_by: user.id
        })))
        .select()

      if (insertError) {
        console.error('Error initializing subjects:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to initialize subjects', details: insertError },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Initialized ${newSubjects.length} subjects`,
        data: insertedSubjects
      })
    }

    // Regular subject creation
    const {
      name,
      code,
      description,
      credits,
      metadata = {}
    } = body

    // Validation
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check for duplicate code
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', code)
      .single()

    if (existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject code already exists' },
        { status: 400 }
      )
    }

    // Create subject
    const { data: newSubject, error: createError } = await supabase
      .from('subjects')
      .insert({
        name,
        code,
        description,
        credits: credits || 1,
        metadata,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating subject:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to create subject' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newSubject
    })

  } catch (error) {
    console.error('Create subject error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 