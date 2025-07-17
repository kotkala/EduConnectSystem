import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const role = searchParams.get('role');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search');

  try {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Handle role filter - support both teacher roles
    if (role) {
      if (role === 'teacher') {
        // When requesting 'teacher', return both subject_teacher and homeroom_teacher
        query = query.in('role', ['subject_teacher', 'homeroom_teacher']);
      } else if (role.includes(',')) {
        // Handle comma-separated roles like "homeroom_teacher,subject_teacher"
        const roles = role.split(',').map(r => r.trim());
        query = query.in('role', roles);
      } else {
        query = query.eq('role', role);
      }
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    // ALWAYS return consistent format with data wrapper
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const { 
      phone, 
      full_name, 
      role, 
      email, 
      password,
      gender,
      date_of_birth,
      address,
      metadata = {},
      auto_generate_teachers = false
    } = body;

    if (auto_generate_teachers) {
      return await generateTeachers(supabase);
    }

    // Validate required fields
    if (!phone || !full_name || !role) {
      return NextResponse.json(
        { error: 'Phone, full name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'school_administrator', 'homeroom_teacher', 'subject_teacher', 'parent', 'student'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('phone')
      .eq('phone', phone)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      );
    }

    // Create auth user if email and password provided
    let authUserId = null;
    if (email && password) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        phone,
        user_metadata: {
          full_name,
          role,
          phone
        }
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      authUserId = authData.user.id;
    }

    // Create user record
    const userData = {
      ...(authUserId && { id: authUserId }),
      phone,
      full_name,
      role,
      gender,
      date_of_birth,
      address,
      metadata
    };

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      // If user creation fails and we created auth user, we should clean up
      if (authUserId) {
        await supabase.auth.admin.deleteUser(authUserId);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Generate 50 teachers with subject assignments
async function generateTeachers(supabase: any) {
  try {
    // Get all subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*');

    if (subjectsError || !subjects?.length) {
      return NextResponse.json(
        { error: 'No subjects found. Please initialize subjects first.' },
        { status: 400 }
      );
    }

    // Vietnamese teacher names pool
    const teacherNames = [
      // Literature teachers
      'Nguyễn Thị Hoa', 'Trần Văn Minh', 'Lê Thị Lan', 'Phạm Văn Đức', 'Hoàng Thị Mai',
      // Math teachers  
      'Vũ Thị Nga', 'Đặng Văn Hùng', 'Bùi Thị Linh', 'Ngô Văn Tuấn', 'Dương Thị Hồng',
      // English teachers
      'Phan Thị Thu', 'Lý Văn Nam', 'Tạ Thị Kim', 'Đinh Văn Long', 'Chu Thị Anh',
      // History teachers
      'Võ Thị Hiền', 'Cao Văn Quý', 'Đỗ Thị Huệ', 'Lưu Văn Tâm', 'Mạc Thị Phượng',
      // Geography teachers
      'Tôn Thị Xuân', 'Hồ Văn Đạt', 'Thi Thị Yến', 'Lục Văn Hải', 'Ông Thị Vân',
      // Physics teachers
      'Đinh Văn Khoa', 'Trương Thị Bích', 'Lâm Văn Thành', 'Đoàn Thị Nhung', 'Thái Văn Sơn',
      // Chemistry teachers
      'Hà Thị Loan', 'Phan Văn Tú', 'Lại Thị Oanh', 'Nghiêm Văn Hạnh', 'Từ Thị Thảo',
      // Biology teachers
      'Kiều Thị Ngọc', 'Huỳnh Văn Phúc', 'Ung Thị Dung', 'Giang Văn Hoàng', 'Lộc Thị Sen',
      // NDSE teachers
      'Thạch Văn Cường', 'Bảo Thị Nhàn', 'Ân Văn Vinh', 'Cung Thị Diễm', 'Âu Văn Bình',
      // PE teachers
      'Xa Thị Khôi', 'Ôn Văn Kiên', 'Ưng Thị Ngân', 'Ưu Văn Lực', 'Yên Thị Thanh',
      // Technology teachers
      'Ấu Văn Thắng', 'Ỷ Thị Như', 'Ỉ Văn Độ', 'Ỳ Thị Cẩm', 'Ỵ Văn Phong'
    ];

    const teachers = [];
    const subjectAssignments = [];

    // Calculate teachers per subject (distribute 50 teachers across subjects)
    const teachersPerSubject = Math.ceil(50 / subjects.length);
    let teacherIndex = 0;

    for (const subject of subjects) {
      for (let i = 0; i < teachersPerSubject && teacherIndex < 50; i++) {
        const name = teacherNames[teacherIndex] || `Giáo viên ${teacherIndex + 1}`;
        const phone = `09${(teacherIndex + 10000000).toString().substring(1)}`;
        const isHomeroom = teacherIndex < 12; // First 12 teachers can be homeroom
        
        const teacher = {
          phone,
          full_name: name,
          role: isHomeroom ? 'homeroom_teacher' : 'subject_teacher',
          gender: name.includes('Thị') ? 'female' : 'male',
          date_of_birth: `${1980 + (teacherIndex % 15)}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
          address: `${Math.floor(Math.random() * 999) + 1} Đường Giáo Dục, Quận ${Math.floor(Math.random() * 12) + 1}, TP.HCM`,
          metadata: {
            can_teach_subjects: [subject.id],
            specialization: subject.name,
            experience_years: Math.floor(Math.random() * 20) + 1,
            education_level: ['Cử nhân', 'Thạc sĩ', 'Tiến sĩ'][Math.floor(Math.random() * 3)]
          }
        };

        teachers.push(teacher);
        teacherIndex++;
      }
    }

    // Insert teachers in batches
    const batchSize = 10;
    const insertedTeachers = [];

    for (let i = 0; i < teachers.length; i += batchSize) {
      const batch = teachers.slice(i, i + batchSize);
      const { data: batchData, error: batchError } = await supabase
        .from('users')
        .insert(batch)
        .select();

      if (batchError) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, batchError);
        continue;
      }

      insertedTeachers.push(...batchData);
    }

    return NextResponse.json({
      message: `Successfully created ${insertedTeachers.length} teachers`,
      teachers: insertedTeachers,
      stats: {
        total_teachers: insertedTeachers.length,
        homeroom_teachers: insertedTeachers.filter(t => t.role === 'homeroom_teacher').length,
        subject_teachers: insertedTeachers.filter(t => t.role === 'subject_teacher').length,
        subjects_covered: subjects.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating teachers:', error);
    return NextResponse.json(
      { error: 'Failed to generate teachers' },
      { status: 500 }
    );
  }
} 