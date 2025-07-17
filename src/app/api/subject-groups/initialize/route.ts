import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Predefined subject groups for Vietnamese THPT 2018
const PREDEFINED_SUBJECT_GROUPS = [
  {
    name: 'KHTN1',
    type: 'natural_sciences',
    description: 'Khoa học tự nhiên 1 - Lý, Hóa, Sinh, Tin học',
    subject_codes: ['PHYS', 'CHEM', 'BIO', 'CS'],
    specialization_subjects: ['MATH', 'PHYS', 'CHEM'],
    target_university_groups: ['A', 'A1', 'D1'],
    metadata: {
      focus: 'engineering_medical',
      difficulty: 'high',
      career_paths: ['Kỹ thuật', 'Y dược', 'Khoa học tự nhiên', 'Công nghệ thông tin']
    }
  },
  {
    name: 'KHTN2',
    type: 'natural_sciences',
    description: 'Khoa học tự nhiên 2 - Lý, Hóa, Sinh, Công nghệ',
    subject_codes: ['PHYS', 'CHEM', 'BIO', 'TECH'],
    specialization_subjects: ['MATH', 'PHYS', 'CHEM'],
    target_university_groups: ['A', 'A1', 'B'],
    metadata: {
      focus: 'technology_applied',
      difficulty: 'medium',
      career_paths: ['Công nghệ', 'Kỹ thuật ứng dụng', 'Nông nghiệp', 'Môi trường']
    }
  },
  {
    name: 'KHXH1',
    type: 'social_sciences',
    description: 'Khoa học xã hội 1 - Sử, Địa, GDKT-PL, Công nghệ',
    subject_codes: ['GEO', 'ECON', 'PHYS', 'TECH'],
    specialization_subjects: ['LIT', 'HIST', 'GEO'],
    target_university_groups: ['C', 'D1', 'D2'],
    metadata: {
      focus: 'social_studies',
      difficulty: 'medium',
      career_paths: ['Kinh tế', 'Luật', 'Quản trị', 'Du lịch', 'Địa lý']
    }
  },
  {
    name: 'KHXH2',
    type: 'social_sciences',
    description: 'Khoa học xã hội 2 - Sử, Địa, GDKT-PL, Tin học',
    subject_codes: ['GEO', 'ECON', 'PHYS', 'CS'],
    specialization_subjects: ['LIT', 'HIST', 'GEO'],
    target_university_groups: ['C', 'D1', 'D2'],
    metadata: {
      focus: 'digital_social',
      difficulty: 'medium',
      career_paths: ['Kinh tế số', 'Luật công nghệ', 'Truyền thông', 'Quản trị số']
    }
  },
  {
    name: 'KHXH3',
    type: 'social_sciences',
    description: 'Khoa học xã hội 3 - Sử, Địa, Âm nhạc, Tin học',
    subject_codes: ['GEO', 'ECON', 'MUSIC', 'CS'],
    specialization_subjects: ['LIT', 'HIST', 'GEO'],
    target_university_groups: ['C', 'D1', 'H'],
    metadata: {
      focus: 'arts_humanities',
      difficulty: 'medium',
      career_paths: ['Nghệ thuật', 'Văn hóa', 'Truyền thông', 'Giáo dục']
    }
  }
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Subject groups are predefined and ready to use');
    
    // Verify that all required subjects exist
    const { data: existingSubjects } = await supabase
      .from('subjects')
      .select('code');
    
    const existingCodes = existingSubjects?.map(s => s.code) || [];
    const allRequiredCodes = new Set();
    
    PREDEFINED_SUBJECT_GROUPS.forEach(group => {
      group.subject_codes.forEach(code => allRequiredCodes.add(code));
      group.specialization_subjects.forEach(code => allRequiredCodes.add(code));
    });
    
    const missingSubjects = Array.from(allRequiredCodes).filter(code => 
      !existingCodes.includes(code)
    );
    
    if (missingSubjects.length > 0) {
      return NextResponse.json({
        error: 'Missing required subjects for subject groups',
        missing_subjects: missingSubjects,
        message: 'Please initialize subjects first'
      }, { status: 400 });
    }

    return NextResponse.json({
      message: `All ${PREDEFINED_SUBJECT_GROUPS.length} subject groups are ready`,
      totalGroups: PREDEFINED_SUBJECT_GROUPS.length,
      groups: {
        natural_sciences: PREDEFINED_SUBJECT_GROUPS.filter(g => g.type === 'natural_sciences').length,
        social_sciences: PREDEFINED_SUBJECT_GROUPS.filter(g => g.type === 'social_sciences').length
      },
      data: PREDEFINED_SUBJECT_GROUPS
    });

  } catch (error) {
    console.error('Error initializing subject groups:', error);
    return NextResponse.json(
      { error: 'Error initializing subject groups' },
      { status: 500 }
    );
  }
} 