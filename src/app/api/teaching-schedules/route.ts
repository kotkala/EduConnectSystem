import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to convert day number to day_of_week enum
function mapDayToEnum(day: number): string {
  const dayMap: { [key: number]: string } = {
    1: 'monday',
    2: 'tuesday', 
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday'
  };
  return dayMap[day] || 'monday';
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const academicTermId = searchParams.get('academic_term_id');
  const classId = searchParams.get('class_id');
  const teacherId = searchParams.get('teacher_id');
  const subjectId = searchParams.get('subject_id');
  const dayOfWeek = searchParams.get('day_of_week');
  const weekNumber = searchParams.get('week_number');

  try {
    let query = supabase
      .from('teaching_schedules')
      .select(`
        *,
        academic_term:academic_terms!academic_term_id(name, start_date, end_date),
        class:classes!class_id(name, grade_level:grade_levels!grade_level_id(name)),
        teacher:users!teacher_id(full_name),
        subject:subjects!subject_id(name, code),
        time_slot:time_slots!time_slot_id(name, start_time, end_time, order_index)
      `)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })
      .order('time_slot_id', { ascending: true });

    if (academicTermId) {
      query = query.eq('academic_term_id', academicTermId);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (weekNumber) {
      query = query.eq('week_number', parseInt(weekNumber));
    }
    if (dayOfWeek) {
      // Convert to enum string if it's a number
      const dayEnum = isNaN(parseInt(dayOfWeek)) ? dayOfWeek : mapDayToEnum(parseInt(dayOfWeek));
      query = query.eq('day_of_week', dayEnum);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch teaching schedules' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const academicTermId = searchParams.get('academic_term_id');

  try {
    if (!academicTermId) {
      return NextResponse.json(
        { error: 'Academic term ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('teaching_schedules')
      .delete()
      .eq('academic_term_id', academicTermId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Teaching schedules deleted successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete teaching schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const {
      academic_term_id,
      class_id,
      teacher_id,
      subject_id,
      time_slot_id,
      day_of_week,
      week_number = 1,
      room_number,
      notes,
      auto_generate = false
    } = body;

    if (auto_generate) {
      // Auto-generate schedule for the entire academic term
      return await generateAutoSchedule(supabase, academic_term_id);
    }

    // Manual schedule creation
    if (!academic_term_id || !class_id || !teacher_id || !subject_id || !time_slot_id || day_of_week === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflicts = await checkScheduleConflicts(supabase, {
      academic_term_id,
      class_id,
      teacher_id,
      time_slot_id,
      day_of_week,
      week_number
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Schedule conflicts detected', conflicts },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('teaching_schedules')
      .insert({
        academic_term_id,
        class_id,
        teacher_id,
        subject_id,
        time_slot_id,
        day_of_week,
        week_number,
        room_number,
        notes
      })
      .select(`
        *,
        academic_term:academic_terms!academic_term_id(name, start_date, end_date),
        class:classes!class_id(name, grade_level:grade_levels!grade_level_id(name)),
        teacher:users!teacher_id(full_name),
        subject:subjects!subject_id(name, code),
        time_slot:time_slots!time_slot_id(name, start_time, end_time, order_index)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create teaching schedule' },
      { status: 500 }
    );
  }
}

// Auto-generate schedule function
async function generateAutoSchedule(supabase: any, academicTermId: string) {
  try {
    console.log('Starting auto-generation for academic term:', academicTermId);

    // 1. Get curriculum distribution for this term 
    // First, try to get class-specific curriculum
    let { data: curriculumData, error: curriculumError } = await supabase
      .from('curriculum_distribution')
      .select(`
        *,
        class:classes!class_id(id, name, is_combined, grade_level:grade_levels!grade_level_id(name)),
        subject:subjects!subject_id(id, name, code)
      `)
      .eq('academic_term_id', academicTermId)
      .not('class_id', 'is', null); // Only get curriculum for actual classes

    // If no class-specific curriculum found, create it from school/grade level curriculum
    if (!curriculumData || curriculumData.length === 0) {
      console.log('No class-specific curriculum found, creating from school/grade curriculum...');
      curriculumData = await createClassSpecificCurriculum(supabase, academicTermId);
    }

    if (curriculumError) {
      console.error('Error fetching curriculum distribution:', curriculumError);
      return NextResponse.json({ error: curriculumError.message }, { status: 500 });
    }

    console.log('Curriculum data found:', curriculumData?.length || 0, 'assignments');

    // 2. Get teacher assignments
    const { data: teacherAssignments, error: teacherError } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        teacher:users!teacher_id(id, full_name),
        class:classes!class_id(id, name),
        subject:subjects!subject_id(id, name, code)
      `)
      .eq('academic_term_id', academicTermId)
      .eq('is_active', true);

    if (teacherError) {
      console.error('Error fetching teacher assignments:', teacherError);
      return NextResponse.json({ error: teacherError.message }, { status: 500 });
    }

    console.log('Teacher assignments found:', teacherAssignments?.length || 0, 'assignments');

    // Check if we have the necessary data for generation
    if (!curriculumData || curriculumData.length === 0) {
      return NextResponse.json({ 
        error: 'Không tìm thấy phân phối chương trình. Vui lòng thiết lập phân phối chương trình trước khi tạo thời khóa biểu tự động.' 
      }, { status: 400 });
    }

    if (!teacherAssignments || teacherAssignments.length === 0) {
      return NextResponse.json({ 
        error: 'Không tìm thấy phân công giáo viên. Vui lòng phân công giáo viên trước khi tạo thời khóa biểu tự động.' 
      }, { status: 400 });
    }

    // 3. Get time slots
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('*')
      .order('order_index');

    if (timeSlotsError) {
      console.error('Error fetching time slots:', timeSlotsError);
      return NextResponse.json({ error: timeSlotsError.message }, { status: 500 });
    }

    if (!timeSlots || timeSlots.length === 0) {
      return NextResponse.json({ 
        error: 'Không tìm thấy thời gian học. Vui lòng thiết lập thời gian học trước.' 
      }, { status: 400 });
    }

    console.log('Time slots found:', timeSlots.length, 'slots');

    // 4. Get schedule constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('schedule_constraints')
      .select('*')
      .eq('is_active', true);

    if (constraintsError) {
      console.error('Error fetching constraints:', constraintsError);
      return NextResponse.json({ error: constraintsError.message }, { status: 500 });
    }

    console.log('Constraints found:', constraints?.length || 0, 'constraints');

    // 5. Clear existing schedules for this term
    console.log('Clearing existing schedules for term:', academicTermId);
    await supabase
      .from('teaching_schedules')
      .delete()
      .eq('academic_term_id', academicTermId);

    // 6. Generate schedule using intelligent algorithm
    console.log('Generating schedules...');
    const generatedSchedules = await generateIntelligentSchedule({
      curriculumData,
      teacherAssignments,
      timeSlots,
      constraints,
      academicTermId
    });

    console.log('Generated schedules:', generatedSchedules.length, 'lessons');

    if (generatedSchedules.length === 0) {
      return NextResponse.json({ 
        error: 'Không thể tạo thời khóa biểu. Vui lòng kiểm tra lại phân công giáo viên và phân phối chương trình.' 
      }, { status: 400 });
    }

    // 7. Insert generated schedules
    const { data: insertedSchedules, error: insertError } = await supabase
      .from('teaching_schedules')
      .insert(generatedSchedules)
      .select(`
        *,
        academic_term:academic_terms!academic_term_id(name, start_date, end_date),
        class:classes!class_id(name, grade_level:grade_levels!grade_level_id(name)),
        teacher:users!teacher_id(full_name),
        subject:subjects!subject_id(name, code),
        time_slot:time_slots!time_slot_id(name, start_time, end_time, order_index)
      `);

    if (insertError) {
      console.error('Error inserting schedules:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log('Successfully inserted:', insertedSchedules.length, 'schedules');

    return NextResponse.json({
      message: 'Tạo thời khóa biểu thành công',
      schedules: insertedSchedules,
      stats: {
        totalLessons: insertedSchedules.length,
        classesScheduled: [...new Set(insertedSchedules.map((s: any) => s.class_id))].length,
        teachersAssigned: [...new Set(insertedSchedules.map((s: any) => s.teacher_id))].length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Auto-generation error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi tạo thời khóa biểu tự động' },
      { status: 500 }
    );
  }
}

// Intelligent schedule generation algorithm
async function generateIntelligentSchedule({
  curriculumData,
  teacherAssignments,
  timeSlots,
  constraints,
  academicTermId
}: any) {
  const schedules: any[] = [];
  const weekDays = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
  
  // Create a schedule matrix for conflict tracking
  const scheduleMatrix: any = {};
  
  // Vietnamese educational system requirements
  const vietnameseRequirements = {
    flagCeremony: { day: 1, timeSlot: timeSlots[0]?.id }, // Monday, first period
    classActivities: { day: 6, timeSlot: timeSlots[timeSlots.length - 1]?.id }, // Saturday, last period
    maxPeriodsPerDay: 10,
    breakPeriods: timeSlots.filter((slot: any) => slot.is_break).map((slot: any) => slot.id),
    preferredSubjectDistribution: {
      morning: ['MATH', 'LIT', 'ENG', 'PHYS', 'CHEM', 'BIO'], // Core subjects in morning
      afternoon: ['PE', 'MUSIC', 'ART', 'TECH', 'HIST', 'GEO'] // Practical subjects in afternoon
    }
  };
  
  console.log('Vietnamese educational requirements:', vietnameseRequirements);
  
  // Group curriculum by class (only for actual classes, not null/school-wide)
  const classCurriculum = curriculumData.reduce((acc: any, curr: any) => {
    // Only process curriculum for actual classes (not school-wide or grade-wide)
    if (curr.class_id && curr.class) {
      if (!acc[curr.class_id]) {
        acc[curr.class_id] = [];
      }
      acc[curr.class_id].push(curr);
    }
    return acc;
  }, {});

  console.log('Processing', Object.keys(classCurriculum).length, 'classes');

  // First, schedule special activities for all classes
  for (const classId in classCurriculum) {
    // Skip special activities for now - they cause null UUID errors
    // We'll add them back later with proper handling
    
    // Mark special slots as occupied so they don't get scheduled
    if (vietnameseRequirements.flagCeremony.timeSlot) {
      markSlotOccupied(scheduleMatrix, classId, 'FLAG_CEREMONY', vietnameseRequirements.flagCeremony.day, vietnameseRequirements.flagCeremony.timeSlot);
    }
    
    if (vietnameseRequirements.classActivities.timeSlot) {
      markSlotOccupied(scheduleMatrix, classId, 'CLASS_ACTIVITIES', vietnameseRequirements.classActivities.day, vietnameseRequirements.classActivities.timeSlot);
    }
  }

  // STEP 1: Process base classes (lớp tách) first
  console.log('=== STEP 1: Processing base classes (lớp tách) ===');
  for (const classId in classCurriculum) {
    const classSubjects = classCurriculum[classId];
    const classInfo = classSubjects[0]?.class;
    
    // Only process base classes in this step
    if (classInfo?.is_combined) continue;
    
    console.log(`Processing base class: ${classInfo?.name || 'Unknown'} (${classId})`);
    
    // Sort subjects by priority: core subjects first, then by weekly_periods
    classSubjects.sort((a: any, b: any) => {
      const aCoreScore = vietnameseRequirements.preferredSubjectDistribution.morning.includes(a.subject?.code) ? 2 : 1;
      const bCoreScore = vietnameseRequirements.preferredSubjectDistribution.morning.includes(b.subject?.code) ? 2 : 1;
      
      if (aCoreScore !== bCoreScore) return bCoreScore - aCoreScore;
      return b.weekly_periods - a.weekly_periods;
    });
    
    // Schedule mandatory subjects
    for (const curriculum of classSubjects) {
      if (curriculum.type === 'elective') continue; // Skip electives for base classes
      
      const weeklyPeriods = curriculum.weekly_periods;
      const subjectId = curriculum.subject_id;
      const subjectCode = curriculum.subject?.code;
      
      // Find teacher for this subject and class
      const assignment = teacherAssignments.find((ta: any) => 
        ta.class_id === classId && ta.subject_id === subjectId
      );
      
      if (!assignment) {
        console.log(`No teacher assignment found for base class ${classId}, subject ${subjectId}`);
        continue;
      }
      
      const teacherId = assignment.teacher_id;
      let periodsScheduled = 0;
      
      // Schedule all periods for this mandatory subject
      for (let period = 0; period < weeklyPeriods; period++) {
        const scheduledSlot = findBestSlotForSubject(
          scheduleMatrix, 
          classId, 
          teacherId, 
          subjectId, 
          subjectCode, 
          timeSlots, 
          weekDays, 
          constraints,
          vietnameseRequirements,
          false // isBaseClass
        );
        
        if (scheduledSlot && teacherId && subjectId) {
          schedules.push({
            academic_term_id: academicTermId,
            class_id: classId,
            teacher_id: teacherId,
            subject_id: subjectId,
            time_slot_id: scheduledSlot.timeSlotId,
            day_of_week: mapDayToEnum(scheduledSlot.day),
            room_number: `P${Math.floor(Math.random() * 20) + 1}`,
            notes: `${curriculum.subject?.name} - Lớp tách`,
            is_active: true
          });
          
          markSlotOccupied(scheduleMatrix, classId, teacherId, scheduledSlot.day, scheduledSlot.timeSlotId);
          periodsScheduled++;
        }
      }
      
      console.log(`Scheduled ${periodsScheduled}/${weeklyPeriods} periods for base class ${classId}, subject ${subjectCode}`);
    }
    
    // Reserve slots for elective subjects (to be filled by combined classes)
    addElectiveSlots(schedules, scheduleMatrix, classId, academicTermId, timeSlots, weekDays);
  }

  // STEP 2: Process combined classes (lớp ghép) 
  console.log('=== STEP 2: Processing combined classes (lớp ghép) ===');
  for (const classId in classCurriculum) {
    const classSubjects = classCurriculum[classId];
    const classInfo = classSubjects[0]?.class;
    
    // Only process combined classes in this step
    if (!classInfo?.is_combined) continue;
    
    console.log(`Processing combined class: ${classInfo?.name || 'Unknown'} (${classId})`);
    
    // For combined classes, schedule all their specialized subjects
    for (const curriculum of classSubjects) {
      const weeklyPeriods = curriculum.weekly_periods;
      const subjectId = curriculum.subject_id;
      const subjectCode = curriculum.subject?.code;
      
      // Find teacher for this subject and class
      const assignment = teacherAssignments.find((ta: any) => 
        ta.class_id === classId && ta.subject_id === subjectId
      );
      
      if (!assignment) {
        console.log(`No teacher assignment found for combined class ${classId}, subject ${subjectId}`);
        continue;
      }
      
      const teacherId = assignment.teacher_id;
      let periodsScheduled = 0;
      
      // Schedule all periods for this subject
      for (let period = 0; period < weeklyPeriods; period++) {
        const scheduledSlot = findBestSlotForSubject(
          scheduleMatrix, 
          classId, 
          teacherId, 
          subjectId, 
          subjectCode, 
          timeSlots, 
          weekDays, 
          constraints,
          vietnameseRequirements,
          true // isCombinedClass
        );
        
        if (scheduledSlot && teacherId && subjectId) {
          schedules.push({
            academic_term_id: academicTermId,
            class_id: classId,
            teacher_id: teacherId,
            subject_id: subjectId,
            time_slot_id: scheduledSlot.timeSlotId,
            day_of_week: mapDayToEnum(scheduledSlot.day),
            room_number: `P${Math.floor(Math.random() * 20) + 1}`,
            notes: `${curriculum.subject?.name} - Lớp ghép`,
            is_active: true
          });
          
          markSlotOccupied(scheduleMatrix, classId, teacherId, scheduledSlot.day, scheduledSlot.timeSlotId);
          periodsScheduled++;
        }
      }
      
      console.log(`Scheduled ${periodsScheduled}/${weeklyPeriods} periods for combined class ${classId}, subject ${subjectCode}`);
    }
  }

  console.log(`Generated ${schedules.length} schedule entries`);
  return schedules;
}

// Helper function to find the best time slot for a subject
function findBestSlotForSubject(
  scheduleMatrix: any,
  classId: string,
  teacherId: string,
  subjectId: string,
  subjectCode: string,
  timeSlots: any[],
  weekDays: number[],
  constraints: any[],
  vietnameseRequirements: any,
  isCombinedClass: boolean = false
) {
  const isCoreMorningSubject = vietnameseRequirements.preferredSubjectDistribution.morning.includes(subjectCode);
  const isAfternoonSubject = vietnameseRequirements.preferredSubjectDistribution.afternoon.includes(subjectCode);
  
  // Define preferred time slots based on subject type
  const morningSlots = timeSlots.filter((slot: any) => slot.order_index <= 5 && !slot.is_break);
  const afternoonSlots = timeSlots.filter((slot: any) => slot.order_index > 5 && !slot.is_break);
  
  let preferredSlots = timeSlots.filter((slot: any) => !slot.is_break);
  
  if (isCoreMorningSubject) {
    preferredSlots = [...morningSlots, ...afternoonSlots];
  } else if (isAfternoonSubject) {
    preferredSlots = [...afternoonSlots, ...morningSlots];
  }
  
  // Try to find available slot
  for (const day of weekDays) {
    for (const slot of preferredSlots) {
      if (isSlotAvailable(scheduleMatrix, classId, teacherId, day, slot.id, constraints)) {
        return {
          day: day,
          timeSlotId: slot.id
        };
      }
    }
  }
  
  return null;
}

// Helper function to check if a slot is available
function isSlotAvailable(
  scheduleMatrix: any,
  classId: string,
  teacherId: string,
  day: number,
  timeSlotId: string,
  constraints: any[]
) {
  const key = `${day}-${timeSlotId}`;
  
  // Check if class already has something scheduled
  if (scheduleMatrix[classId] && scheduleMatrix[classId][key]) {
    return false;
  }
  
  // Check if teacher is already scheduled
  if (scheduleMatrix[teacherId] && scheduleMatrix[teacherId][key]) {
    return false;
  }
  
  // Check constraints
  for (const constraint of constraints) {
    if (constraint.constraint_type === 'teacher_unavailable' && 
        constraint.teacher_id === teacherId &&
        constraint.day_of_week === mapDayToEnum(day) &&
        constraint.time_slot_id === timeSlotId) {
      return false;
    }
    
    if (constraint.constraint_type === 'class_unavailable' && 
        constraint.class_id === classId &&
        constraint.day_of_week === mapDayToEnum(day) &&
        constraint.time_slot_id === timeSlotId) {
      return false;
    }
  }
  
  return true;
}

// Helper function to mark a slot as occupied
function markSlotOccupied(
  scheduleMatrix: any,
  classId: string,
  teacherId: string,
  day: number,
  timeSlotId: string
) {
  const key = `${day}-${timeSlotId}`;
  
  if (!scheduleMatrix[classId]) {
    scheduleMatrix[classId] = {};
  }
  scheduleMatrix[classId][key] = true;
  
  if (teacherId && teacherId !== 'FLAG_CEREMONY' && teacherId !== 'CLASS_ACTIVITIES') {
    if (!scheduleMatrix[teacherId]) {
      scheduleMatrix[teacherId] = {};
    }
    scheduleMatrix[teacherId][key] = true;
  }
}

// Helper function to add elective slots for base classes
function addElectiveSlots(
  schedules: any[],
  scheduleMatrix: any,
  classId: string,
  academicTermId: string,
  timeSlots: any[],
  weekDays: number[]
) {
  const electiveSlots = [
    { day: 2, timeSlots: [3, 4] }, // Tuesday periods 3-4
    { day: 3, timeSlots: [5, 6] }, // Wednesday periods 5-6
    { day: 4, timeSlots: [7, 8] }, // Thursday periods 7-8
    { day: 5, timeSlots: [2, 3] }, // Friday periods 2-3
    { day: 6, timeSlots: [4, 5] }  // Saturday periods 4-5
  ];
  
  for (const electiveSlot of electiveSlots) {
    for (const slotIndex of electiveSlot.timeSlots) {
      const timeSlot = timeSlots.find((ts: any) => ts.order_index === slotIndex);
      if (timeSlot && !timeSlot.is_break) {
        const key = `${electiveSlot.day}-${timeSlot.id}`;
        
        // Check if slot is available
        if (!scheduleMatrix[classId] || !scheduleMatrix[classId][key]) {
          // Skip elective slots for now - they cause null UUID errors
          // Just mark them as occupied
          markSlotOccupied(scheduleMatrix, classId, 'ELECTIVE_SLOT', electiveSlot.day, timeSlot.id);
        }
      }
    }
  }
}

// Create class-specific curriculum from school/grade level curriculum
async function createClassSpecificCurriculum(supabase: any, academicTermId: string) {
  try {
    console.log('Creating class-specific curriculum for term:', academicTermId);

    // Get all classes for this academic term
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select(`
        id, name, is_combined, grade_level_id,
        grade_level:grade_levels!grade_level_id(name)
      `)
      .eq('academic_year_id', (await supabase
        .from('academic_terms')
        .select('academic_year_id')
        .eq('id', academicTermId)
        .single()
      ).data.academic_year_id);

    if (classError || !classes) {
      console.error('Error fetching classes:', classError);
      return [];
    }

    console.log(`Found ${classes.length} classes to create curriculum for`);

    // Get school-wide and grade-level curriculum
    const { data: baseCurriculum, error: curriculumError } = await supabase
      .from('subject_assignments')
      .select(`
        *,
        subject:subjects!subject_id(id, name, code)
      `)
      .eq('academic_term_id', academicTermId)
      .is('class_id', null); // School-wide or grade-level curriculum

    if (curriculumError) {
      console.error('Error fetching base curriculum:', curriculumError);
      return [];
    }

    console.log(`Found ${baseCurriculum?.length || 0} base curriculum items`);

    // Create class-specific curriculum for each class
    const classSpecificCurriculum = [];
    
    for (const classItem of classes) {
      // Find applicable curriculum for this class
      const applicableCurriculum = baseCurriculum?.filter((curriculum: any) => {
        // School-wide curriculum (applies to all classes)
        if (!curriculum.grade_level_id) return true;
        
        // Grade-level curriculum (applies to classes in that grade)
        if (curriculum.grade_level_id === classItem.grade_level_id) return true;
        
        return false;
      }) || [];

      console.log(`Creating curriculum for class ${classItem.name}: ${applicableCurriculum.length} subjects`);

      // Create class-specific assignments
      for (const curriculum of applicableCurriculum) {
        const classAssignment = {
          academic_term_id: academicTermId,
          subject_id: curriculum.subject_id,
          class_id: classItem.id,
          grade_level_id: null, // Clear grade_level_id for class-specific
          type: curriculum.type,
          weekly_periods: curriculum.weekly_periods,
          // Add joined data for compatibility
          subject: curriculum.subject,
          class: {
            id: classItem.id,
            name: classItem.name,
            is_combined: classItem.is_combined,
            grade_level: classItem.grade_level
          }
        };

        classSpecificCurriculum.push(classAssignment);
      }
    }

    console.log(`Created ${classSpecificCurriculum.length} class-specific curriculum items`);

    // Insert class-specific curriculum into database
    if (classSpecificCurriculum.length > 0) {
      const insertData = classSpecificCurriculum.map(item => ({
        academic_term_id: item.academic_term_id,
        subject_id: item.subject_id,
        class_id: item.class_id,
        grade_level_id: item.grade_level_id,
        type: item.type,
        weekly_periods: item.weekly_periods
      }));

      const { error: insertError } = await supabase
        .from('subject_assignments')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting class-specific curriculum:', insertError);
        // Continue with existing data even if insert fails
      } else {
        console.log('Successfully inserted class-specific curriculum');
      }
    }

    return classSpecificCurriculum;

  } catch (error) {
    console.error('Error creating class-specific curriculum:', error);
    return [];
  }
}

// Check for schedule conflicts
async function checkScheduleConflicts(supabase: any, scheduleData: any) {
  const conflicts = [];
  
  // Check teacher conflict
  const { data: teacherConflict } = await supabase
    .from('teaching_schedules')
    .select('*')
    .eq('academic_term_id', scheduleData.academic_term_id)
    .eq('teacher_id', scheduleData.teacher_id)
    .eq('time_slot_id', scheduleData.time_slot_id)
    .eq('day_of_week', typeof scheduleData.day_of_week === 'number' ? mapDayToEnum(scheduleData.day_of_week) : scheduleData.day_of_week)
    .eq('week_number', scheduleData.week_number || 1);
  
  if (teacherConflict && teacherConflict.length > 0) {
    conflicts.push('Teacher already has a class at this time');
  }
  
  // Check class conflict
  const { data: classConflict } = await supabase
    .from('teaching_schedules')
    .select('*')
    .eq('academic_term_id', scheduleData.academic_term_id)
    .eq('class_id', scheduleData.class_id)
    .eq('time_slot_id', scheduleData.time_slot_id)
    .eq('day_of_week', typeof scheduleData.day_of_week === 'number' ? mapDayToEnum(scheduleData.day_of_week) : scheduleData.day_of_week)
    .eq('week_number', scheduleData.week_number || 1);
  
  if (classConflict && classConflict.length > 0) {
    conflicts.push('Class already has a lesson at this time');
  }
  
  return conflicts;
} 