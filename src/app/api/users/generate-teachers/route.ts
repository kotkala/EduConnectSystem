import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient(); // For creating auth users
  
  try {
    // Verify admin access
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }
    // Get all subjects first
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
      'Ấu Văn Thắng', 'Ỷ Thị Như', 'Ỉ Văn Độ', 'Ỳ Thị Cẩm', 'Ỵ Văn Phong',
      // Additional teachers for more subjects
      'Mai Thị Hương', 'Lê Văn Hưng', 'Đỗ Thị Ly', 'Bùi Văn Khang', 'Trần Thị Tuyết',
      'Phạm Văn Toàn', 'Nguyễn Thị Oanh', 'Hoàng Văn Dũng', 'Vũ Thị Thúy', 'Lý Văn Hải',
      'Tạ Thị Ngân', 'Đinh Văn Quang', 'Chu Thị Hạnh', 'Phan Văn Thế', 'Cao Thị Bình',
      'Đặng Văn Lâm', 'Lưu Thị Phúc', 'Mạc Văn Đại', 'Tôn Thị Quỳnh', 'Hồ Văn Thuận'
    ];

    const teachers = [];
    const subjectMapping: any = {};

    // Map subjects to teacher specializations
    subjects.forEach((subject: any, index: number) => {
      subjectMapping[subject.id] = {
        subject,
        teacherCount: Math.ceil(50 / subjects.length) // Distribute evenly
      };
    });

    let teacherIndex = 0;
    const errors: string[] = []; // Initialize errors array early

    // Create teachers for each subject
    for (const subjectId in subjectMapping) {
      const { subject, teacherCount } = subjectMapping[subjectId];
      
      for (let i = 0; i < teacherCount && teacherIndex < 50; i++) {
        const name = teacherNames[teacherIndex] || `Giáo viên ${teacherIndex + 1}`;
        const phone = `09${(teacherIndex + 10000000).toString().substring(1)}`;
        
        // First 15 teachers can be homeroom teachers
        const isHomeroom = teacherIndex < 15; 
        
        // Generate email for auth user
        const email = `teacher${teacherIndex + 1}@educonnect.school`;
        const password = 'EduConnect2024!'; // Default password for all teachers
        
        // Create user in auth.users first using admin client
        const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: name,
            role: isHomeroom ? 'homeroom_teacher' : 'subject_teacher',
            created_method: 'auto_generated'
          }
        });

        if (authError) {
          console.error(`Error creating auth user for ${name}:`, authError);
          errors.push(`Failed to create auth user for ${name}: ${authError.message}`);
          continue; // Skip this teacher
        }

        if (!authUser?.user?.id) {
          console.error(`No user ID returned for ${name}`);
          errors.push(`No user ID returned for ${name}`);
          continue;
        }

        const teacher = {
          id: authUser.user.id, // Use auth user ID
          phone,
          full_name: name,
          role: isHomeroom ? 'homeroom_teacher' : 'subject_teacher',
          status: 'active',
          gender: name.includes('Thị') ? 'female' : 'male',
          date_of_birth: `${1975 + (teacherIndex % 20)}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
          address: `${Math.floor(Math.random() * 999) + 1} Đường Giáo Dục, Quận ${Math.floor(Math.random() * 12) + 1}, TP.HCM`,
          metadata: {
            can_teach_subjects: [subjectId],
            primary_subject: subject.name,
            specialization: subject.name,
            experience_years: Math.floor(Math.random() * 25) + 1,
            education_level: ['Cử nhân', 'Thạc sĩ', 'Tiến sĩ'][Math.floor(Math.random() * 3)],
            teaching_certificate: true,
            email: email,
            created_method: 'auto_generated'
          }
        };

        teachers.push(teacher);
        teacherIndex++;
      }
    }

    // Initialize result arrays
    const insertedTeachers: any[] = [];

    // Insert teachers in batches to avoid overwhelming the database
    const batchSize = 10;

    for (let i = 0; i < teachers.length; i += batchSize) {
      const batch = teachers.slice(i, i + batchSize);
      
      try {
        const { data: batchData, error: batchError } = await supabase
          .from('users')
          .insert(batch)
          .select();

        if (batchError) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, batchError);
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message}`);
          continue;
        }

        if (batchData) {
          insertedTeachers.push(...batchData);
        }
      } catch (error: any) {
        console.error(`Exception in batch ${Math.floor(i / batchSize) + 1}:`, error);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }
    }

    // Calculate statistics
    const stats = {
      total_teachers: insertedTeachers.length,
      homeroom_teachers: insertedTeachers.filter(t => t.role === 'homeroom_teacher').length,
      subject_teachers: insertedTeachers.filter(t => t.role === 'subject_teacher').length,
      subjects_covered: subjects.length,
      failed_insertions: errors.length,
      subject_distribution: {} as any
    };

    // Calculate subject distribution
    subjects.forEach((subject: any) => {
      const teachersForSubject = insertedTeachers.filter((t: any) => 
        t.metadata?.can_teach_subjects?.includes(subject.id)
      );
      (stats.subject_distribution as any)[subject.name] = teachersForSubject.length;
    });

    return NextResponse.json({
      message: `Successfully created ${insertedTeachers.length} teachers`,
      teachers: insertedTeachers,
      stats,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error generating teachers:', error);
    return NextResponse.json(
      { error: `Failed to generate teachers: ${error.message}` },
      { status: 500 }
    );
  }
} 