import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Vietnamese THPT 2018 subjects (8 mandatory + 9 elective)
    const subjects = [
      // MANDATORY SUBJECTS (8 subjects)
      {
        code: 'LIT',
        name: 'Ngữ văn',
        description: 'Môn học bắt buộc - Ngữ văn Việt Nam',
        credits: 3,
        periods_per_week: 3,
        metadata: {
          category: 'mandatory',
          subject_type: 'core',
          periods_per_year: 105,
          curriculum: 'THPT_2018'
        }
      },
      {
        code: 'MATH',
        name: 'Toán',
        description: 'Môn học bắt buộc - Toán học',
        credits: 3,
        periods_per_week: 3,
        metadata: {
          category: 'mandatory',
          subject_type: 'core',
          periods_per_year: 105,
          curriculum: 'THPT_2018'
        }
      },
      {
        code: 'ENG',
        name: 'Tiếng Anh',
        description: 'Môn học bắt buộc - Ngoại ngữ',
        credits: 3,
        periods_per_week: 3,
        metadata: {
          category: 'mandatory',
          subject_type: 'core',
          periods_per_year: 105,
          curriculum: 'THPT_2018'
        }
      },
      {
        code: 'HIST',
        name: 'Lịch sử',
        description: 'Môn học bắt buộc - Lịch sử Việt Nam và thế giới',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'mandatory',
          subject_type: 'core',
          periods_per_year: 70,
          curriculum: 'THPT_2018'
        }
      },
      {
        code: 'NDSE',
        name: 'Giáo dục quốc phòng và an ninh',
        description: 'Môn học bắt buộc - GDQP&AN',
        credits: 1,
        periods_per_week: 1,
        metadata: {
          category: 'mandatory',
          subject_type: 'core',
          periods_per_year: 35,
          curriculum: 'THPT_2018'
        }
      },
      {
        code: 'EXPR',
        name: 'Hoạt động trải nghiệm - Hướng nghiệp',
        description: 'Môn học bắt buộc - Trải nghiệm sáng tạo',
        credits: 3,
        periods_per_week: 3,
        metadata: {
          category: 'mandatory',
          subject_type: 'experiential',
          periods_per_year: 105,
          curriculum: 'THPT_2018'
        }
      },
      {
        code: 'LOCAL',
        name: 'Giáo dục địa phương',
        description: 'Môn học bắt buộc - Nội dung giáo dục địa phương',
        credits: 1,
        periods_per_week: 1,
        metadata: {
          category: 'mandatory',
          subject_type: 'local',
          periods_per_year: 35,
          curriculum: 'THPT_2018'
        }
      },
      {
        code: 'PE',
        name: 'Giáo dục thể chất',
        description: 'Môn học bắt buộc - Thể dục thể thao',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'mandatory',
          subject_type: 'physical',
          periods_per_year: 70,
          curriculum: 'THPT_2018'
        }
      },
      
      // ELECTIVE SUBJECTS (9 subjects - students choose 4)
      {
        code: 'GEO',
        name: 'Địa lý',
        description: 'Môn học tự chọn - Khoa học xã hội',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'social_science',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'social_sciences'
        }
      },
      {
        code: 'ECON',
        name: 'Giáo dục kinh tế và pháp luật',
        description: 'Môn học tự chọn - Khoa học xã hội',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'social_science',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'social_sciences'
        }
      },
      {
        code: 'PHYS',
        name: 'Vật lý',
        description: 'Môn học tự chọn - Khoa học tự nhiên',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'natural_science',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'natural_sciences'
        }
      },
      {
        code: 'CHEM',
        name: 'Hóa học',
        description: 'Môn học tự chọn - Khoa học tự nhiên',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'natural_science',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'natural_sciences'
        }
      },
      {
        code: 'BIO',
        name: 'Sinh học',
        description: 'Môn học tự chọn - Khoa học tự nhiên',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'natural_science',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'natural_sciences'
        }
      },
      {
        code: 'TECH',
        name: 'Công nghệ',
        description: 'Môn học tự chọn - Công nghệ',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'technology',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'technology'
        }
      },
      {
        code: 'CS',
        name: 'Tin học',
        description: 'Môn học tự chọn - Công nghệ thông tin',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'technology',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'technology'
        }
      },
      {
        code: 'MUSIC',
        name: 'Âm nhạc',
        description: 'Môn học tự chọn - Nghệ thuật',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'arts',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'arts'
        }
      },
      {
        code: 'ART',
        name: 'Mỹ thuật',
        description: 'Môn học tự chọn - Nghệ thuật',
        credits: 2,
        periods_per_week: 2,
        metadata: {
          category: 'elective',
          subject_type: 'arts',
          periods_per_year: 70,
          curriculum: 'THPT_2018',
          subject_group: 'arts'
        }
      }
    ];

    // Check if subjects already exist
    const { data: existingSubjects, error: checkError } = await supabase
      .from('subjects')
      .select('code')
      .in('code', subjects.map(s => s.code));

    if (checkError) {
      return NextResponse.json(
        { error: 'Lỗi khi kiểm tra môn học hiện có' },
        { status: 500 }
      );
    }

    // Filter out existing subjects
    const existingCodes = new Set(existingSubjects?.map(s => s.code) || []);
    const newSubjects = subjects.filter(s => !existingCodes.has(s.code));

    if (newSubjects.length === 0) {
      return NextResponse.json({
        message: 'Tất cả môn học đã được khởi tạo',
        totalSubjects: subjects.length,
        existingSubjects: existingSubjects?.length || 0,
        newSubjects: 0
      });
    }

    // Insert new subjects
    const { data: insertedSubjects, error: insertError } = await supabase
      .from('subjects')
      .insert(newSubjects)
      .select();

    if (insertError) {
      console.error('Error inserting subjects:', insertError);
      return NextResponse.json(
        { error: 'Lỗi khi tạo môn học: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Khởi tạo môn học thành công',
      totalSubjects: subjects.length,
      existingSubjects: existingSubjects?.length || 0,
      newSubjects: newSubjects.length,
      insertedSubjects: insertedSubjects?.length || 0,
      subjects: {
        mandatory: subjects.filter(s => s.metadata.category === 'mandatory').length,
        elective: subjects.filter(s => s.metadata.category === 'elective').length
      }
    });

  } catch (error) {
    console.error('Error initializing subjects:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi khởi tạo môn học' },
      { status: 500 }
    );
  }
} 