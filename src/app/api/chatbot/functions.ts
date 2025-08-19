/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { FunctionDeclaration, Type } from '@google/genai'

// Function declarations for chatbot
export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'getDetailedGrades',
    description: 'Get detailed grade information for a specific student and subject',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to get grades for'
        },
        subjectName: {
          type: Type.STRING,
          description: 'Subject name (optional) - if not provided, returns all subjects'
        },
        timeframe: {
          type: Type.STRING,
          description: 'Time period: "week", "month", "semester", or "year"'
        }
      },
      required: ['studentName']
    }
  },
  {
    name: 'getViolationHistory',
    description: 'Get violation history for a specific student',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to get violation history for'
        },
        severity: {
          type: Type.STRING,
          description: 'Filter by severity: "minor", "moderate", "serious", "severe" (optional)'
        },
        timeframe: {
          type: Type.STRING,
          description: 'Time period: "week", "month", "semester", or "year"'
        }
      },
      required: ['studentName']
    }
  },
  {
    name: 'getAcademicAnalysis',
    description: 'Get comprehensive academic performance analysis for a student',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to analyze'
        },
        analysisType: {
          type: Type.STRING,
          description: 'Type of analysis: "overall", "subject_specific", "trend_analysis", "comparison"'
        }
      },
      required: ['studentName', 'analysisType']
    }
  },
  {
    name: 'getProgressTrends',
    description: 'Get progress trends and improvement patterns for a student',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to analyze trends for'
        },
        metric: {
          type: Type.STRING,
          description: 'Metric to analyze: "grades", "behavior", "attendance", "overall"'
        },
        period: {
          type: Type.STRING,
          description: 'Analysis period: "monthly", "quarterly", "semester"'
        }
      },
      required: ['studentName', 'metric']
    }
  },
  {
    name: 'getTeacherFeedback',
    description: 'Get detailed teacher feedback and recommendations for a student',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to get feedback for'
        },
        subjectName: {
          type: Type.STRING,
          description: 'Specific subject (optional) - if not provided, returns all subjects'
        },
        feedbackType: {
          type: Type.STRING,
          description: 'Type of feedback: "recent", "summary", "recommendations"'
        }
      },
      required: ['studentName']
    }
  },
  {
    name: 'getStudentGrades',
    description: 'Get comprehensive grade reports and analysis for a student including semester grades, midterm and final grades',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to get grades for'
        },
        semester: {
          type: Type.STRING,
          description: 'Specific semester (optional) - if not provided, returns current semester'
        },
        analysisType: {
          type: Type.STRING,
          description: 'Type of analysis: "summary", "detailed", "trends", "comparison"'
        }
      },
      required: ['studentName']
    }
  },
  {
    name: 'getTeacherInformation',
    description: 'Get information about teachers including homeroom teacher and subject teachers for a student',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to get teacher information for'
        },
        teacherType: {
          type: Type.STRING,
          description: 'Type of teacher info: "homeroom", "subject_teachers", "all"'
        }
      },
      required: ['studentName']
    }
  },
  {
    name: 'getWebsiteUsageGuide',
    description: 'Get comprehensive guide on how to use the parent portal website features',
    parameters: {
      type: Type.OBJECT,
      properties: {
        feature: {
          type: Type.STRING,
          description: 'Specific feature to get help with (optional): "grades", "feedback", "notifications", "meetings", "violations", "leave_application", "chatbot"'
        },
        stepByStep: {
          type: Type.BOOLEAN,
          description: 'Whether to provide detailed step-by-step instructions'
        }
      },
      required: []
    }
  },
  {
    name: 'getNotifications',
    description: 'Get notifications from the school system including exam schedules, events, announcements, and meeting schedules',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to get notifications for (optional)'
        },
        notificationType: {
          type: Type.STRING,
          description: 'Type of notifications: "all", "exams", "events", "meetings", "announcements", "recent"'
        },
        timeframe: {
          type: Type.STRING,
          description: 'Time period: "week", "month", "semester", "upcoming"'
        }
      },
      required: []
    }
  },
  {
    name: 'getAcademicInfo',
    description: 'Get academic year and semester information including current academic period and schedule details',
    parameters: {
      type: Type.OBJECT,
      properties: {
        infoType: {
          type: Type.STRING,
          description: 'Type of academic info: "current", "all_years", "semesters", "schedule"'
        },
        academicYear: {
          type: Type.STRING,
          description: 'Specific academic year (optional)'
        }
      },
      required: []
    }
  },
  {
    name: 'getSystemData',
    description: 'Get comprehensive system data including timetables, classes, subjects, and all educational information',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: 'Name of the student to get data for'
        },
        dataType: {
          type: Type.STRING,
          description: 'Type of data: "timetable", "class_info", "subjects", "all_data", "schedule"'
        },
        includeDetails: {
          type: Type.BOOLEAN,
          description: 'Whether to include detailed information'
        }
      },
      required: ['studentName']
    }
  }
]

// Types for function responses
interface FunctionResponse {
  error?: string
  [key: string]: unknown
}

// Function handlers
export async function handleFunctionCall(functionName: string, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const supabase = await createClient()
  
  try {
    switch (functionName) {
      case 'getDetailedGrades':
        return await getDetailedGrades(supabase, args, parentId)
      case 'getViolationHistory':
        return await getViolationHistory(supabase, args, parentId)
      case 'getAcademicAnalysis':
        return await getAcademicAnalysis(supabase, args, parentId)
      case 'getProgressTrends':
        return await getProgressTrends(supabase, args, parentId)
      case 'getTeacherFeedback':
        return await getTeacherFeedback(supabase, args, parentId)
      case 'getStudentGrades':
        return await getStudentGrades(supabase, args, parentId)
      case 'getTeacherInformation':
        return await getTeacherInformation(supabase, args, parentId)
      case 'getWebsiteUsageGuide':
        return await getWebsiteUsageGuide(supabase, args)
      case 'getNotifications':
        return await getNotifications(supabase, args, parentId)
      case 'getAcademicInfo':
        return await getAcademicInfo(supabase, args)
      case 'getSystemData':
        return await getSystemData(supabase, args, parentId)
      default:
        throw new Error(`Unknown function: ${functionName}`)
    }
  } catch (error) {
    console.error(`Error in function ${functionName}:`, error)
    return {
      error: `Failed to execute ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Implementation functions
async function getDetailedGrades(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, subjectName, timeframe = 'month' } = args
  
  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )
  
  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }
  
  // Calculate date range based on timeframe
  const now = new Date()
  let startDate: Date
  
  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'semester':
      startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  let query = supabase
    .from('submission_grades')
    .select(`
      grade,
      submission_date,
      subjects(name_vietnamese, name_english),
      profiles!submission_grades_student_id_fkey(full_name)
    `)
    .eq('student_id', student.student_id)
    .gte('submission_date', startDate.toISOString())
    .order('submission_date', { ascending: false })
  
  if (subjectName && typeof subjectName === 'string') {
    query = query.or(`subjects.name_vietnamese.ilike.%${subjectName}%,subjects.name_english.ilike.%${subjectName}%`)
  }
  
  const { data: grades, error } = await query
  
  if (error) {
    return { error: `Failed to fetch grades: ${error.message}` }
  }
  
  return {
    studentName: (student as any).profiles?.full_name || studentName,
    timeframe,
    subjectFilter: subjectName || 'all subjects',
    grades: grades || [],
    summary: {
      totalGrades: grades?.length || 0,
      averageGrade: grades?.length ? (grades.reduce((sum: number, g: { grade: number }) => sum + g.grade, 0) / grades.length).toFixed(2) : 'N/A',
      highestGrade: grades?.length ? Math.max(...grades.map((g: { grade: number }) => g.grade)) : 'N/A',
      lowestGrade: grades?.length ? Math.min(...grades.map((g: { grade: number }) => g.grade)) : 'N/A'
    }
  }
}

async function getViolationHistory(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, severity, timeframe = 'month' } = args
  
  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!student_id(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )
  
  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }
  
  // Calculate date range
  const now = new Date()
  let startDate: Date
  
  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'semester':
      startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  let query = supabase
    .from('student_violations')
    .select(`
      id,
      severity,
      description,
      recorded_at,
      violation_date,
      violation_type:violation_types(
        name,
        violation_categories(name)
      ),
      recorded_by:profiles!student_violations_recorded_by_fkey(full_name)
    `)
    .eq('student_id', student.student_id)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: false })
  
  if (severity) {
    query = query.eq('severity', severity)
  }
  
  const { data: violations, error } = await query
  
  if (error) {
    return { error: `Failed to fetch violations: ${error.message}` }
  }
  
  return {
    studentName: (student as any).profiles?.full_name || studentName,
    timeframe,
    severityFilter: severity || 'all severities',
    violations: violations || [],
    summary: {
      totalViolations: violations?.length || 0,
      severityBreakdown: violations?.reduce((acc: Record<string, number>, v: { severity: string }) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1
        return acc
      }, {}) || {}
    }
  }
}

// Helper functions for getProgressTrends to reduce cognitive complexity
function calculateTimeRanges(period: string, now: Date): { start: Date; end: Date; label: string }[] {
  const timeRanges: { start: Date; end: Date; label: string }[] = []

  if (period === 'monthly') {
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      timeRanges.push({
        start,
        end,
        label: start.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
      })
    }
  } else if (period === 'quarterly') {
    // Last 4 quarters
    for (let i = 3; i >= 0; i--) {
      const quarterStart = Math.floor((now.getMonth() - i * 3) / 3) * 3
      const start = new Date(now.getFullYear(), quarterStart, 1)
      const end = new Date(now.getFullYear(), quarterStart + 3, 0)
      timeRanges.push({
        start,
        end,
        label: `Q${Math.floor(quarterStart / 3) + 1} ${start.getFullYear()}`
      })
    }
  }

  return timeRanges
}

async function fetchGradesForPeriod(supabase: Awaited<ReturnType<typeof createClient>>, studentId: string, range: { start: Date; end: Date }) {
  const { data: grades } = await supabase
    .from('submission_grades')
    .select('grade, submission_date, subjects(name_vietnamese)')
    .eq('student_id', studentId)
    .gte('submission_date', range.start.toISOString())
    .lte('submission_date', range.end.toISOString())

  const gradeAverage = grades && grades.length > 0
    ? (grades.reduce((sum: number, g: any) => sum + g.grade, 0) / grades.length).toFixed(2)
    : null

  return {
    average: gradeAverage,
    count: grades?.length || 0,
    highest: grades && grades.length > 0 ? Math.max(...grades.map((g: any) => g.grade)) : null,
    lowest: grades && grades.length > 0 ? Math.min(...grades.map((g: any) => g.grade)) : null
  }
}

async function fetchBehaviorForPeriod(supabase: Awaited<ReturnType<typeof createClient>>, studentId: string, range: { start: Date; end: Date }) {
  const { data: violations } = await supabase
    .from('student_violations')
    .select('severity, recorded_at')
    .eq('student_id', studentId)
    .gte('recorded_at', range.start.toISOString())
    .lte('recorded_at', range.end.toISOString())

  const violationsBySeverity = violations?.reduce((acc: Record<string, number>, v: any) => {
    acc[v.severity] = (acc[v.severity] || 0) + 1
    return acc
  }, {}) || {}

  return {
    total_violations: violations?.length || 0,
    severity_breakdown: violationsBySeverity
  }
}

function processAttendanceForPeriod() {
  return {
    note: 'Attendance tracking not yet implemented'
  }
}

function calculateGradeTrends(trends: Record<string, unknown>[]) {
  const gradeAverages = trends
    .map((t: any) => parseFloat(t.grades?.average))
    .filter(avg => !isNaN(avg))

  if (gradeAverages.length < 2) {
    return null
  }

  const recent = gradeAverages.slice(-2)
  let direction: string
  if (recent[1] > recent[0]) {
    direction = 'improving'
  } else if (recent[1] < recent[0]) {
    direction = 'declining'
  } else {
    direction = 'stable'
  }
  const change = (recent[1] - recent[0]).toFixed(2)

  return {
    direction,
    change: parseFloat(change),
    trend: gradeAverages
  }
}

function calculateBehaviorTrends(trends: Record<string, unknown>[]) {
  const violationCounts = trends.map((t: any) => t.behavior?.total_violations || 0)

  if (violationCounts.length < 2) {
    return null
  }

  const recent = violationCounts.slice(-2)
  let direction: string
  if (recent[1] < recent[0]) {
    direction = 'improving'
  } else if (recent[1] > recent[0]) {
    direction = 'declining'
  } else {
    direction = 'stable'
  }
  const change = recent[1] - recent[0]

  return {
    direction,
    change,
    trend: violationCounts
  }
}

// Academic analysis implementation
async function getAcademicAnalysis(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, analysisType = 'overall' } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )

  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }

  try {
    // Get comprehensive data for analysis
    const [gradesResult, feedbackResult, violationsResult] = await Promise.all([
      // Get grades from last 3 months
      supabase
        .from('submission_grades')
        .select(`
          grade,
          submission_date,
          subjects(name_vietnamese, name_english)
        `)
        .eq('student_id', student.student_id)
        .gte('submission_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('submission_date', { ascending: false }),

      // Get teacher feedback from last 3 months
      supabase
        .from('student_feedback')
        .select(`
          rating,
          feedback_text,
          created_at,
          teacher_id,
          subject_id
        `)
        .eq('student_id', student.student_id)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false }),

      // Get violations from last 3 months
      supabase
        .from('student_violations')
        .select(`
          severity,
          description,
          recorded_at,
          violation_type:violation_types(
            name,
            violation_categories(name)
          )
        `)
        .eq('student_id', student.student_id)
        .gte('recorded_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false })
    ])

    const grades = gradesResult.data || []
    const feedback = feedbackResult.data || []
    const violations = violationsResult.data || []

    // Get lookup data for context building
    const [subjectsResult, teachersResult] = await Promise.all([
      supabase.from('subjects').select('id, name_vietnamese, name_english'),
      supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
    ])

    const subjects = subjectsResult.data || []
    const teachers = teachersResult.data || []
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    const teacherMap = new Map(teachers.map(t => [t.id, t]))

    // Perform analysis based on type
    let analysis: Record<string, unknown> = {}

    if (analysisType === 'overall' || analysisType === 'comparison') {
      // Overall academic performance analysis
      const gradesBySubject = grades.reduce((acc: Record<string, number[]>, grade: any) => {
        const subject = grade.subjects?.name_vietnamese || 'Unknown'
        if (!acc[subject]) acc[subject] = []
        acc[subject].push(grade.grade)
        return acc
      }, {})

      const subjectAverages = Object.entries(gradesBySubject).map(([subject, gradeList]) => ({
        subject,
        average: (gradeList.reduce((sum, grade) => sum + grade, 0) / gradeList.length).toFixed(2),
        count: gradeList.length,
        highest: Math.max(...gradeList),
        lowest: Math.min(...gradeList)
      }))

      const overallAverage = grades.length > 0
        ? (grades.reduce((sum: number, g: any) => sum + g.grade, 0) / grades.length).toFixed(2)
        : 'N/A'

      // Feedback analysis
      const feedbackByRating = feedback.reduce((acc: Record<number, number>, f: any) => {
        acc[f.rating] = (acc[f.rating] || 0) + 1
        return acc
      }, {})

      const averageRating = feedback.length > 0
        ? (feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length).toFixed(2)
        : 'N/A'

      // Violation analysis
      const violationsBySeverity = violations.reduce((acc: Record<string, number>, v: any) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1
        return acc
      }, {})

      analysis = {
        type: 'overall_analysis',
        period: 'Last 3 months',
        academic_performance: {
          overall_average: overallAverage,
          total_grades: grades.length,
          subject_breakdown: subjectAverages,
          grade_distribution: grades.reduce((acc: Record<string, number>, g: any) => {
            let range: string
            if (g.grade >= 8) {
              range = 'excellent'
            } else if (g.grade >= 6.5) {
              range = 'good'
            } else if (g.grade >= 5) {
              range = 'average'
            } else {
              range = 'needs_improvement'
            }
            acc[range] = (acc[range] || 0) + 1
            return acc
          }, {})
        },
        teacher_feedback: {
          average_rating: averageRating,
          total_feedback: feedback.length,
          rating_distribution: feedbackByRating,
          recent_comments: feedback.slice(0, 3).map((f: any) => {
            const subject = subjectMap.get(f.subject_id)
            const teacher = teacherMap.get(f.teacher_id)
            return {
              subject: subject?.name_vietnamese || 'Unknown Subject',
              rating: f.rating,
              comment: f.feedback_text || 'No comment',
              teacher: teacher?.full_name || 'Unknown Teacher',
              date: new Date(f.created_at).toLocaleDateString('vi-VN')
            }
          })
        },
        behavior_analysis: {
          total_violations: violations.length,
          severity_breakdown: violationsBySeverity,
          recent_violations: violations.slice(0, 3).map((v: any) => ({
            type: v.violation_type?.name,
            category: v.violation_type?.violation_categories?.name,
            severity: v.severity,
            date: new Date(v.recorded_at).toLocaleDateString('vi-VN')
          }))
        }
      }
    }

    return {
      studentName: (student as any).profiles?.full_name || studentName,
      analysisType,
      analysis,
      summary: {
        dataPoints: {
          grades: grades.length,
          feedback: feedback.length,
          violations: violations.length
        },
        timeframe: '3 months'
      }
    }

  } catch (error) {
    console.error('Academic analysis error:', error)
    return { error: `Failed to analyze academic performance: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Helper functions for getProgressTrends to reduce cognitive complexity
async function processMetricData(
  metric: string,
  studentId: string,
  range: { start: Date; end: Date; label: string },
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Record<string, unknown>> {
  const periodData: Record<string, unknown> = {
    period: range.label,
    start_date: range.start.toISOString(),
    end_date: range.end.toISOString()
  }

  if (metric === 'grades' || metric === 'overall') {
    periodData.grades = await fetchGradesForPeriod(supabase, studentId, range)
  }

  if (metric === 'behavior' || metric === 'overall') {
    periodData.behavior = await fetchBehaviorForPeriod(supabase, studentId, range)
  }

  if (metric === 'attendance' || metric === 'overall') {
    periodData.attendance = processAttendanceForPeriod()
  }

  return periodData
}

function buildTrendAnalysis(metric: string, trends: Record<string, unknown>[]): Record<string, unknown> {
  const trendAnalysis: Record<string, unknown> = {}

  if (metric === 'grades' || metric === 'overall') {
    const gradeTrends = calculateGradeTrends(trends)
    if (gradeTrends) {
      trendAnalysis.grades = gradeTrends
    }
  }

  if (metric === 'behavior' || metric === 'overall') {
    const behaviorTrends = calculateBehaviorTrends(trends)
    if (behaviorTrends) {
      trendAnalysis.behavior = behaviorTrends
    }
  }

  return trendAnalysis
}

function formatProgressResponse(
  student: any,
  studentName: string,
  metric: string,
  period: string,
  trends: Record<string, unknown>[],
  analysis: Record<string, unknown>,
  timeRanges: { start: Date; end: Date; label: string }[]
): Record<string, unknown> {
  return {
    studentName: student.profiles?.full_name || studentName,
    metric,
    period,
    trends,
    analysis,
    summary: {
      periods_analyzed: trends.length,
      timeframe: `${timeRanges[0]?.label} to ${timeRanges[timeRanges.length - 1]?.label}`
    }
  }
}

async function getProgressTrends(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, metric = 'overall', period = 'monthly' } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )

  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }

  try {
    // Calculate time periods based on period parameter
    const now = new Date()
    const timeRanges = calculateTimeRanges(period as string, now)

    const trends: Record<string, unknown>[] = []

    // Process data for each time range using helper function
    for (const range of timeRanges) {
      const periodData = await processMetricData(metric as string, student.student_id, range, supabase)
      trends.push(periodData)
    }

    // Build trend analysis using helper function
    const trendAnalysis = buildTrendAnalysis(metric as string, trends)

    // Format and return response using helper function
    return formatProgressResponse(student, studentName as string, metric as string, period as string, trends, trendAnalysis, timeRanges)

  } catch (error) {
    console.error('Progress trends error:', error)
    return { error: `Failed to analyze progress trends: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Helper functions for getTeacherFeedback to reduce cognitive complexity
function buildFeedbackQuery(supabase: Awaited<ReturnType<typeof createClient>>, studentId: string, subjectName: string | undefined, feedbackType: string, subjects: any[]) {
  let query = supabase
    .from('student_feedback')
    .select(`
      rating,
      feedback_text,
      created_at,
      teacher_id,
      subject_id
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  // Apply subject filter if specified
  if (subjectName) {
    const matchingSubjects = subjects.filter((s: any) =>
      s.name_vietnamese?.toLowerCase().includes(subjectName.toLowerCase())
    )
    if (matchingSubjects.length > 0) {
      query = query.in('subject_id', matchingSubjects.map((s: any) => s.id))
    }
  }

  // Apply time filter based on feedback type
  if (feedbackType === 'recent') {
    query = query.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).limit(10)
  } else if (feedbackType === 'summary') {
    query = query.gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
  } else if (feedbackType === 'recommendations') {
    query = query.gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
  }

  return query
}

function processRecentFeedback(feedback: any[], subjectMap: Map<any, any>, teacherMap: Map<any, any>) {
  return feedback?.map((f: any) => {
    const subject = subjectMap.get(f.subject_id)
    const teacher = teacherMap.get(f.teacher_id)
    return {
      subject: subject?.name_vietnamese || 'Unknown Subject',
      teacher: teacher?.full_name || 'Unknown Teacher',
      rating: f.rating,
      comment: f.feedback_text || 'No comment',
      date: new Date(f.created_at).toLocaleDateString('vi-VN')
    }
  }) || []
}

function processSummaryFeedback(feedback: any[]) {
  const feedbackBySubject = feedback?.reduce((acc: Record<string, any[]>, f: any) => {
    const subjectName = f.timetable_events?.subjects?.name_vietnamese || 'Unknown Subject'
    if (!acc[subjectName]) acc[subjectName] = []
    acc[subjectName].push(f)
    return acc
  }, {}) || {}

  const subjectSummaries = Object.entries(feedbackBySubject).map(([subject, feedbackList]) => {
    const averageRating = (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(2)
    const ratingDistribution = feedbackList.reduce((acc: Record<number, number>, f) => {
      acc[f.rating] = (acc[f.rating] || 0) + 1
      return acc
    }, {})

    return {
      subject,
      teacher: feedbackList[0]?.timetable_events?.profiles?.full_name || 'Unknown Teacher',
      averageRating: parseFloat(averageRating),
      totalFeedback: feedbackList.length,
      ratingDistribution,
      recentComments: feedbackList.slice(0, 3).map(f => ({
        rating: f.rating,
        comment: f.feedback_text || 'No comment',
        date: new Date(f.created_at).toLocaleDateString('vi-VN')
      }))
    }
  })

  const overallStats = {
    averageRating: feedback && feedback.length > 0
      ? (feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length).toFixed(2)
      : 'N/A',
    ratingDistribution: feedback?.reduce((acc: Record<number, number>, f: any) => {
      acc[f.rating] = (acc[f.rating] || 0) + 1
      return acc
    }, {}) || {}
  }

  return { subjectSummaries, overallStats }
}

function processRecommendationsFeedback(feedback: any[]) {
  const lowRatingFeedback = feedback?.filter((f: any) => f.rating <= 3) || []
  const highRatingFeedback = feedback?.filter((f: any) => f.rating >= 4) || []

  const areasForImprovement = lowRatingFeedback.map((f: any) => ({
    subject: f.timetable_events?.subjects?.name_vietnamese || 'Unknown Subject',
    teacher: f.timetable_events?.profiles?.full_name || 'Unknown Teacher',
    rating: f.rating,
    feedback: f.feedback_text || 'No comment',
    date: new Date(f.created_at).toLocaleDateString('vi-VN')
  }))

  const strengths = highRatingFeedback.map((f: any) => ({
    subject: f.timetable_events?.subjects?.name_vietnamese || 'Unknown Subject',
    teacher: f.timetable_events?.profiles?.full_name || 'Unknown Teacher',
    rating: f.rating,
    feedback: f.feedback_text || 'No comment',
    date: new Date(f.created_at).toLocaleDateString('vi-VN')
  }))

  return {
    areasForImprovement,
    strengths,
    summary: {
      needsAttention: areasForImprovement.length,
      performingWell: strengths.length,
      averageRating: feedback && feedback.length > 0
        ? (feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length).toFixed(2)
        : 'N/A'
    }
  }
}

async function getTeacherFeedback(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, subjectName, feedbackType = 'recent' } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!student_id(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )

  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }

  try {
    // Get lookup data
    const [subjectsResult, teachersResult] = await Promise.all([
      supabase.from('subjects').select('id, name_vietnamese, name_english'),
      supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
    ])

    const subjects = subjectsResult.data || []
    const teachers = teachersResult.data || []
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    const teacherMap = new Map(teachers.map(t => [t.id, t]))

    // Build query based on feedback type
    const query = buildFeedbackQuery(supabase, student.student_id, subjectName as string, feedbackType as string, subjects)
    const { data: feedback, error } = await query

    if (error) {
      return { error: `Failed to fetch teacher feedback: ${error.message}` }
    }

    // Process feedback based on type
    const result: Record<string, unknown> = {
      studentName: (student as any).profiles?.full_name || studentName,
      subjectFilter: subjectName || 'all subjects',
      feedbackType,
      totalFeedback: feedback?.length || 0
    }

    if (feedbackType === 'recent') {
      result.recentFeedback = processRecentFeedback(feedback, subjectMap, teacherMap)
    } else if (feedbackType === 'summary') {
      const summaryData = processSummaryFeedback(feedback)
      result.subjectSummaries = summaryData.subjectSummaries
      result.overallStats = summaryData.overallStats
    } else if (feedbackType === 'recommendations') {
      result.recommendations = processRecommendationsFeedback(feedback)
    }

    return result

  } catch (error) {
    console.error('Teacher feedback error:', error)
    return { error: `Failed to get teacher feedback: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Get comprehensive student grades from official grade submissions
async function getStudentGrades(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, semester, analysisType = 'summary' } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )

  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }

  try {
    // Get current academic year and semester if not specified
    let semesterFilter = ''
    if (semester) {
      semesterFilter = semester as string
    }

    // Query student grade submissions (official semester grades)
    let query = supabase
      .from('student_grade_submissions')
      .select(`
        id,
        submission_name,
        status,
        created_at,
        academic_year:academic_years(name),
        semester:semesters(name),
        class:classes(
          name,
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(full_name)
        ),
        grades:individual_subject_grades(
          subject_id,
          midterm_grade,
          final_grade,
          average_grade,
          notes,
          subject:subjects(
            code,
            name_vietnamese,
            category
          )
        )
      `)
      .eq('student_id', student.student_id)
      .eq('status', 'sent_to_teacher')
      .order('created_at', { ascending: false })

    if (semesterFilter) {
      // Add semester filter if specified
      query = query.ilike('semester.name', `%${semesterFilter}%`)
    }

    const { data: gradeSubmissions, error } = await query

    if (error) {
      return { error: `Failed to fetch grade submissions: ${error.message}` }
    }

    if (!gradeSubmissions || gradeSubmissions.length === 0) {
      return {
        studentName: (student as any).profiles?.full_name || studentName,
        message: 'ChÆ°a cÃ³ báº£ng Ä‘iá»ƒm chÃ­nh thá»©c nÃ o Ä‘Æ°á»£c gá»­i tá»« nhÃ  trÆ°á»ng.',
        gradeSubmissions: []
      }
    }

    // Process grade data based on analysis type
    const result: Record<string, unknown> = {
      studentName: (student as any).profiles?.full_name || studentName,
      analysisType,
      totalSubmissions: gradeSubmissions.length
    }

    if (analysisType === 'summary' || analysisType === 'detailed') {
      // Get the most recent grade submission
      const latestSubmission = gradeSubmissions[0]

      result.latestGradeReport = {
        submissionName: latestSubmission.submission_name,
        academicYear: latestSubmission.academic_year?.[0]?.name,
        semester: latestSubmission.semester?.[0]?.name,
        className: latestSubmission.class?.[0]?.name,
        homeroomTeacher: latestSubmission.class?.[0]?.homeroom_teacher?.[0]?.full_name,
        submittedAt: new Date(latestSubmission.created_at).toLocaleDateString('vi-VN'),
        subjects: latestSubmission.grades?.map((grade: any) => ({
          subjectCode: grade.subject?.code,
          subjectName: grade.subject?.name_vietnamese,
          category: grade.subject?.category,
          midtermGrade: grade.midterm_grade,
          finalGrade: grade.final_grade,
          averageGrade: grade.average_grade,
          notes: grade.notes
        })) || []
      }

      // Calculate statistics
      const validGrades = latestSubmission.grades?.filter((g: any) => g.average_grade !== null) || []
      if (validGrades.length > 0) {
        const averages = validGrades.map((g: any) => g.average_grade)
        result.statistics = {
          totalSubjects: validGrades.length,
          overallAverage: (averages.reduce((sum: number, grade: number) => sum + grade, 0) / averages.length).toFixed(2),
          highestGrade: Math.max(...averages),
          lowestGrade: Math.min(...averages),
          excellentCount: averages.filter(g => g >= 8).length,
          goodCount: averages.filter(g => g >= 6.5 && g < 8).length,
          averageCount: averages.filter(g => g >= 5 && g < 6.5).length,
          belowAverageCount: averages.filter(g => g < 5).length
        }
      }
    }

    if (analysisType === 'trends' && gradeSubmissions.length > 1) {
      // Compare multiple submissions to show trends
      result.gradeTrends = gradeSubmissions.slice(0, 3).map((submission: any) => ({
        period: `${submission.semester?.name} - ${submission.academic_year?.name}`,
        submissionName: submission.submission_name,
        date: new Date(submission.created_at).toLocaleDateString('vi-VN'),
        subjectAverages: submission.grades?.reduce((acc: Record<string, number>, grade: any) => {
          if (grade.average_grade !== null) {
            acc[grade.subject?.name_vietnamese || 'Unknown'] = grade.average_grade
          }
          return acc
        }, {}) || {}
      }))
    }

    if (analysisType === 'detailed') {
      // Include all grade submissions
      result.allGradeReports = gradeSubmissions.map((submission: any) => ({
        submissionName: submission.submission_name,
        academicYear: submission.academic_year?.name,
        semester: submission.semester?.name,
        submittedAt: new Date(submission.created_at).toLocaleDateString('vi-VN'),
        subjectCount: submission.grades?.length || 0,
        averageGrade: submission.grades?.length > 0
          ? (submission.grades
              .filter((g: any) => g.average_grade !== null)
              .reduce((sum: number, g: any) => sum + g.average_grade, 0) /
             submission.grades.filter((g: any) => g.average_grade !== null).length).toFixed(2)
          : 'N/A'
      }))
    }

    return result

  } catch (error) {
    console.error('Student grades error:', error)
    return { error: `Failed to get student grades: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Helper functions for getTeacherInformation to reduce cognitive complexity
function processHomeroomTeacher(classAssignment: any, teacherType: string) {
  if (teacherType !== 'homeroom' && teacherType !== 'all') {
    return null
  }

  if (classAssignment?.classes?.[0]?.homeroom_teacher?.[0]) {
    return {
      name: classAssignment.classes[0].homeroom_teacher[0].full_name,
      email: classAssignment.classes[0].homeroom_teacher[0].email,
      employeeId: classAssignment.classes[0].homeroom_teacher[0].employee_id,
      className: classAssignment.classes[0].name,
      academicYear: classAssignment.classes[0].academic_year?.[0]?.name,
      semester: classAssignment.classes[0].semester?.[0]?.name,
      role: 'GiÃ¡o viÃªn chá»§ nhiá»‡m'
    }
  } else {
    return {
      message: 'ChÆ°a cÃ³ thÃ´ng tin giÃ¡o viÃªn chá»§ nhiá»‡m'
    }
  }
}

async function processSubjectTeachers(supabase: Awaited<ReturnType<typeof createClient>>, classId: string, teacherType: string) {
  if (teacherType !== 'subject_teachers' && teacherType !== 'all') {
    return { subjectTeachers: [], teachersByCategory: {}, totalSubjectTeachers: 0 }
  }

  const { data: teacherAssignments } = await supabase
    .from('teacher_class_assignments')
    .select(`
      teacher_id,
      subject_id,
      class_id,
      teacher:profiles!teacher_class_assignments_teacher_id_fkey(
        full_name,
        email,
        employee_id
      ),
      subject:subjects(
        code,
        name_vietnamese,
        category
      ),
      class:classes(name)
    `)
    .eq('class_id', classId)
    .eq('is_active', true)

  if (!teacherAssignments || teacherAssignments.length === 0) {
    return {
      subjectTeachers: [],
      message: 'ChÆ°a cÃ³ thÃ´ng tin phÃ¢n cÃ´ng giÃ¡o viÃªn bá»™ mÃ´n'
    }
  }

  const subjectTeachers = teacherAssignments.map((assignment: any) => ({
    teacherName: assignment.teacher?.full_name,
    teacherEmail: assignment.teacher?.email,
    employeeId: assignment.teacher?.employee_id,
    subjectCode: assignment.subject?.code,
    subjectName: assignment.subject?.name_vietnamese,
    subjectCategory: assignment.subject?.category,
    className: assignment.class?.name,
    role: 'GiÃ¡o viÃªn bá»™ mÃ´n'
  }))

  // Group by subject category for better organization
  const teachersByCategory = teacherAssignments.reduce((acc: Record<string, any[]>, assignment: any) => {
    const category = assignment.subject?.category || 'KhÃ¡c'
    if (!acc[category]) acc[category] = []
    acc[category].push({
      teacherName: assignment.teacher?.full_name,
      subjectName: assignment.subject?.name_vietnamese,
      subjectCode: assignment.subject?.code
    })
    return acc
  }, {})

  return {
    subjectTeachers,
    teachersByCategory,
    totalSubjectTeachers: teacherAssignments.length
  }
}

function buildContactSummary(homeroomTeacher: any, subjectTeachers: any[]) {
  const allTeachers = []

  if (homeroomTeacher?.name) {
    allTeachers.push({
      name: homeroomTeacher.name,
      email: homeroomTeacher.email,
      role: 'GiÃ¡o viÃªn chá»§ nhiá»‡m',
      priority: 'high'
    })
  }

  if (subjectTeachers && Array.isArray(subjectTeachers)) {
    subjectTeachers.forEach((teacher: any) => {
      allTeachers.push({
        name: teacher.teacherName,
        email: teacher.teacherEmail,
        role: `GiÃ¡o viÃªn ${teacher.subjectName}`,
        priority: 'normal'
      })
    })
  }

  return {
    totalTeachers: allTeachers.length,
    teachers: allTeachers,
    note: 'LiÃªn há»‡ giÃ¡o viÃªn chá»§ nhiá»‡m cho cÃ¡c váº¥n Ä‘á» chung, giÃ¡o viÃªn bá»™ mÃ´n cho cÃ¡c váº¥n Ä‘á» cá»¥ thá»ƒ vá» mÃ´n há»c'
  }
}

// Get teacher information for a student
async function getTeacherInformation(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, teacherType = 'all' } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )

  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }

  try {
    const result: Record<string, unknown> = {
      studentName: (student as any).profiles?.full_name || studentName,
      teacherType
    }

    // Get current class assignment to find homeroom teacher
    const { data: classAssignment } = await supabase
      .from('student_class_assignments')
      .select(`
        class_id,
        classes!inner(
          name,
          homeroom_teacher_id,
          academic_year:academic_years(name),
          semester:semesters(name),
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(
            full_name,
            email,
            employee_id
          )
        )
      `)
      .eq('student_id', student.student_id)
      .eq('is_active', true)
      .single()

    // Process homeroom teacher
    const homeroomTeacher = processHomeroomTeacher(classAssignment, teacherType as string)
    if (homeroomTeacher) {
      result.homeroomTeacher = homeroomTeacher
    }

    // Process subject teachers
    const subjectTeachersData = await processSubjectTeachers(supabase, classAssignment?.class_id, teacherType as string)
    Object.assign(result, subjectTeachersData)

    // Add contact information summary
    if (teacherType === 'all') {
      result.contactSummary = buildContactSummary(result.homeroomTeacher, result.subjectTeachers as any[])
    }

    return result

  } catch (error) {
    console.error('Teacher information error:', error)
    return { error: `Failed to get teacher information: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Get website usage guide for parents
async function getWebsiteUsageGuide(_supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>): Promise<FunctionResponse> {
  const { feature, stepByStep = true } = args

  const guides = {
    overview: {
      title: 'HÆ°á»›ng dáº«n sá»­ dá»¥ng Cá»•ng thÃ´ng tin Phá»¥ huynh',
      description: 'Cá»•ng thÃ´ng tin giÃºp phá»¥ huynh theo dÃµi tÃ¬nh hÃ¬nh há»c táº­p vÃ  sinh hoáº¡t cá»§a con em',
      mainFeatures: [
        'Xem báº£ng Ä‘iá»ƒm vÃ  káº¿t quáº£ há»c táº­p',
        'Nháº­n pháº£n há»“i tá»« giÃ¡o viÃªn',
        'Theo dÃµi thÃ´ng bÃ¡o tá»« nhÃ  trÆ°á»ng',
        'ÄÄƒng kÃ½ lá»‹ch háº¹n vá»›i giÃ¡o viÃªn',
        'Xem vi pháº¡m vÃ  khen thÆ°á»Ÿng',
        'Ná»™p Ä‘Æ¡n xin nghá»‰ há»c',
        'Chat vá»›i AI há»— trá»£'
      ]
    },
    grades: {
      title: 'Xem báº£ng Ä‘iá»ƒm vÃ  káº¿t quáº£ há»c táº­p',
      steps: [
        '1. ÄÄƒng nháº­p vÃ o há»‡ thá»‘ng vá»›i tÃ i khoáº£n phá»¥ huynh',
        '2. VÃ o menu "Báº£ng Ä‘iá»ƒm" hoáº·c "Káº¿t quáº£ há»c táº­p"',
        '3. Chá»n con em báº¡n muá»‘n xem (náº¿u cÃ³ nhiá»u con)',
        '4. Chá»n há»c ká»³ vÃ  nÄƒm há»c',
        '5. Xem chi tiáº¿t Ä‘iá»ƒm tá»«ng mÃ´n há»c',
        '6. Táº£i xuá»‘ng báº£ng Ä‘iá»ƒm PDF náº¿u cáº§n'
      ],
      tips: [
        'Báº£ng Ä‘iá»ƒm Ä‘Æ°á»£c cáº­p nháº­t sau khi giÃ¡o viÃªn hoÃ n thÃ nh cháº¥m Ä‘iá»ƒm',
        'CÃ³ thá»ƒ xem Ä‘iá»ƒm giá»¯a ká»³, cuá»‘i ká»³ vÃ  Ä‘iá»ƒm trung bÃ¬nh',
        'Nháº­n thÃ´ng bÃ¡o qua email khi cÃ³ báº£ng Ä‘iá»ƒm má»›i'
      ]
    },
    feedback: {
      title: 'Xem pháº£n há»“i tá»« giÃ¡o viÃªn',
      steps: [
        '1. VÃ o menu "Pháº£n há»“i giÃ¡o viÃªn"',
        '2. Chá»n con em vÃ  thá»i gian muá»‘n xem',
        '3. Xem pháº£n há»“i theo tá»«ng mÃ´n há»c',
        '4. Äá»c nháº­n xÃ©t chi tiáº¿t tá»« giÃ¡o viÃªn',
        '5. Xem Ä‘Ã¡nh giÃ¡ báº±ng sao (1-5 sao)',
        '6. LiÃªn há»‡ giÃ¡o viÃªn náº¿u cáº§n lÃ m rÃµ'
      ],
      tips: [
        'Pháº£n há»“i Ä‘Æ°á»£c cáº­p nháº­t hÃ ng tuáº§n',
        'CÃ³ thá»ƒ lá»c theo mÃ´n há»c cá»¥ thá»ƒ',
        'LÆ°u Ã½ cÃ¡c khuyáº¿n nghá»‹ tá»« giÃ¡o viÃªn'
      ]
    },
    notifications: {
      title: 'Theo dÃµi thÃ´ng bÃ¡o tá»« nhÃ  trÆ°á»ng',
      steps: [
        '1. Kiá»ƒm tra biá»ƒu tÆ°á»£ng chuÃ´ng á»Ÿ gÃ³c pháº£i mÃ n hÃ¬nh',
        '2. Click vÃ o Ä‘á»ƒ xem danh sÃ¡ch thÃ´ng bÃ¡o',
        '3. Äá»c thÃ´ng bÃ¡o má»›i (cÃ³ dáº¥u cháº¥m Ä‘á»)',
        '4. Click vÃ o thÃ´ng bÃ¡o Ä‘á»ƒ xem chi tiáº¿t',
        '5. ÄÃ¡nh dáº¥u Ä‘Ã£ Ä‘á»c hoáº·c lÆ°u thÃ´ng bÃ¡o quan trá»ng'
      ],
      types: [
        'ThÃ´ng bÃ¡o tá»« giÃ¡o viÃªn chá»§ nhiá»‡m',
        'ThÃ´ng bÃ¡o tá»« giÃ¡o viÃªn bá»™ mÃ´n',
        'ThÃ´ng bÃ¡o tá»« ban giÃ¡m hiá»‡u',
        'ThÃ´ng bÃ¡o sá»± kiá»‡n, hoáº¡t Ä‘á»™ng'
      ]
    },
    meetings: {
      title: 'ÄÄƒng kÃ½ lá»‹ch háº¹n vá»›i giÃ¡o viÃªn',
      steps: [
        '1. VÃ o menu "Lá»‹ch háº¹n" hoáº·c "Gáº·p gá»¡ giÃ¡o viÃªn"',
        '2. Chá»n giÃ¡o viÃªn muá»‘n gáº·p',
        '3. Xem lá»‹ch trá»‘ng cá»§a giÃ¡o viÃªn',
        '4. Chá»n thá»i gian phÃ¹ há»£p',
        '5. Nháº­p lÃ½ do vÃ  ná»™i dung muá»‘n trao Ä‘á»•i',
        '6. Gá»­i yÃªu cáº§u vÃ  chá» xÃ¡c nháº­n'
      ],
      tips: [
        'Äáº·t lá»‹ch trÆ°á»›c Ã­t nháº¥t 1 ngÃ y',
        'Chuáº©n bá»‹ cÃ¢u há»i trÆ°á»›c khi gáº·p',
        'CÃ³ thá»ƒ há»§y hoáº·c Ä‘á»•i lá»‹ch náº¿u cáº§n'
      ]
    },
    violations: {
      title: 'Xem vi pháº¡m vÃ  khen thÆ°á»Ÿng',
      steps: [
        '1. VÃ o menu "Háº¡nh kiá»ƒm" hoáº·c "Vi pháº¡m/Khen thÆ°á»Ÿng"',
        '2. Chá»n con em vÃ  khoáº£ng thá»i gian',
        '3. Xem danh sÃ¡ch vi pháº¡m (náº¿u cÃ³)',
        '4. Xem danh sÃ¡ch khen thÆ°á»Ÿng',
        '5. Äá»c chi tiáº¿t tá»«ng sá»± viá»‡c',
        '6. LiÃªn há»‡ giÃ¡o viÃªn náº¿u cÃ³ tháº¯c máº¯c'
      ],
      categories: [
        'Vi pháº¡m: Ä‘i muá»™n, khÃ´ng lÃ m bÃ i táº­p, vi pháº¡m ná»™i quy',
        'Khen thÆ°á»Ÿng: há»c tá»‘t, cÃ³ tiáº¿n bá»™, tham gia tÃ­ch cá»±c'
      ]
    },
    leave_application: {
      title: 'Ná»™p Ä‘Æ¡n xin nghá»‰ há»c',
      steps: [
        '1. VÃ o menu "ÄÆ¡n xin nghá»‰"',
        '2. Click "Táº¡o Ä‘Æ¡n má»›i"',
        '3. Chá»n con em cáº§n xin nghá»‰',
        '4. Chá»n ngÃ y nghá»‰ (tá»« ngÃ y - Ä‘áº¿n ngÃ y)',
        '5. Nháº­p lÃ½ do nghá»‰ há»c',
        '6. ÄÃ­nh kÃ¨m áº£nh giáº¥y tá» (náº¿u cáº§n)',
        '7. Gá»­i Ä‘Æ¡n cho giÃ¡o viÃªn chá»§ nhiá»‡m'
      ],
      tips: [
        'Ná»™p Ä‘Æ¡n trÆ°á»›c khi nghá»‰ Ã­t nháº¥t 1 ngÃ y',
        'ÄÃ­nh kÃ¨m giáº¥y bÃ¡c sÄ© náº¿u nghá»‰ á»‘m',
        'Theo dÃµi tráº¡ng thÃ¡i duyá»‡t Ä‘Æ¡n'
      ]
    },
    chatbot: {
      title: 'Sá»­ dá»¥ng AI Chatbot há»— trá»£',
      steps: [
        '1. Click vÃ o biá»ƒu tÆ°á»£ng chat á»Ÿ gÃ³c mÃ n hÃ¬nh',
        '2. Nháº­p cÃ¢u há»i báº±ng tiáº¿ng Viá»‡t',
        '3. Äá»£i AI phÃ¢n tÃ­ch vÃ  tráº£ lá»i',
        '4. Äáº·t cÃ¢u há»i tiáº¿p theo náº¿u cáº§n',
        '5. Sá»­ dá»¥ng cÃ¡c gá»£i Ã½ cÃ¢u há»i cÃ³ sáºµn'
      ],
      capabilities: [
        'PhÃ¢n tÃ­ch káº¿t quáº£ há»c táº­p cá»§a con',
        'TÃ³m táº¯t pháº£n há»“i tá»« giÃ¡o viÃªn',
        'HÆ°á»›ng dáº«n sá»­ dá»¥ng cÃ¡c tÃ­nh nÄƒng',
        'Cung cáº¥p thÃ´ng tin giÃ¡o viÃªn',
        'Tráº£ lá»i cÃ¡c cÃ¢u há»i vá» giÃ¡o dá»¥c'
      ],
      examples: [
        '"Káº¿t quáº£ há»c táº­p cá»§a con em tháº¿ nÃ o?"',
        '"GiÃ¡o viÃªn nÃ³i gÃ¬ vá» con em?"',
        '"LÃ m sao Ä‘á»ƒ xem báº£ng Ä‘iá»ƒm?"',
        '"ThÃ´ng tin giÃ¡o viÃªn chá»§ nhiá»‡m?"'
      ]
    }
  }

  const result: Record<string, unknown> = {
    requestedFeature: feature || 'overview',
    stepByStep
  }

  if (!feature || feature === 'overview') {
    result.guide = guides.overview
    result.availableFeatures = Object.keys(guides).filter(key => key !== 'overview')
  } else if (guides[feature as keyof typeof guides]) {
    result.guide = guides[feature as keyof typeof guides]
  } else {
    result.error = `TÃ­nh nÄƒng "${typeof feature === 'string' ? feature : String(feature)}" khÃ´ng tá»“n táº¡i. CÃ¡c tÃ­nh nÄƒng cÃ³ sáºµn: ${Object.keys(guides).join(', ')}`
  }

  // Add general tips for all features
  result.generalTips = [
    'LuÃ´n Ä‘Äƒng xuáº¥t sau khi sá»­ dá»¥ng xong',
    'Cáº­p nháº­t thÃ´ng tin liÃªn láº¡c Ä‘á»ƒ nháº­n thÃ´ng bÃ¡o',
    'Kiá»ƒm tra thÃ´ng bÃ¡o thÆ°á»ng xuyÃªn',
    'LiÃªn há»‡ nhÃ  trÆ°á»ng náº¿u gáº·p khÃ³ khÄƒn ká»¹ thuáº­t',
    'Sá»­ dá»¥ng chatbot AI Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£ nhanh chÃ³ng'
  ]

  result.supportContact = {
    email: 'support@school.edu.vn',
    phone: '024-xxxx-xxxx',
    workingHours: 'Thá»© 2 - Thá»© 6: 7:00 - 17:00'
  }

  return result
}

// Helper functions for getNotifications to reduce cognitive complexity
function calculateTimeFilter(timeframe: string): Date {
  const timeFilter = new Date()
  switch (timeframe) {
    case 'week':
      timeFilter.setDate(timeFilter.getDate() - 7)
      break
    case 'month':
      timeFilter.setMonth(timeFilter.getMonth() - 1)
      break
    case 'semester':
      timeFilter.setMonth(timeFilter.getMonth() - 4)
      break
    case 'upcoming':
      // For upcoming events, we want future dates
      return new Date()
    default:
      timeFilter.setMonth(timeFilter.getMonth() - 1)
  }
  return timeFilter
}

async function fetchNotifications(supabase: Awaited<ReturnType<typeof createClient>>, notificationType: string, timeFilter: Date) {
  if (notificationType !== 'all' && notificationType !== 'announcements' && notificationType !== 'recent') {
    return []
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      id,
      title,
      content,
      image_url,
      created_at,
      target_roles,
      target_classes,
      sender:profiles!notifications_sender_id_fkey(full_name, role)
    `)
    .eq('is_active', true)
    .gte('created_at', timeFilter.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  return notifications?.map((notif: any) => ({
    title: notif.title,
    content: notif.content,
    imageUrl: notif.image_url,
    date: new Date(notif.created_at).toLocaleDateString('vi-VN'),
    sender: notif.sender?.full_name || 'NhÃ  trÆ°á»ng',
    senderRole: notif.sender?.role || 'admin',
    targetRoles: notif.target_roles,
    targetClasses: notif.target_classes
  })) || []
}

async function fetchMeetings(supabase: Awaited<ReturnType<typeof createClient>>, notificationType: string, timeFilter: Date, timeframe: string) {
  if (notificationType !== 'all' && notificationType !== 'meetings') {
    return []
  }

  const { data: meetings } = await supabase
    .from('meeting_schedules')
    .select(`
      id,
      title,
      description,
      meeting_date,
      meeting_location,
      duration_minutes,
      meeting_type,
      teacher:profiles!meeting_schedules_teacher_id_fkey(full_name),
      class:classes(name)
    `)
    .gte('meeting_date', timeframe === 'upcoming' ? new Date().toISOString() : timeFilter.toISOString())
    .order('meeting_date', { ascending: timeframe === 'upcoming' })
    .limit(10)

  return meetings?.map((meeting: any) => ({
    title: meeting.title,
    description: meeting.description,
    date: new Date(meeting.meeting_date).toLocaleDateString('vi-VN'),
    time: new Date(meeting.meeting_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    location: meeting.meeting_location,
    duration: meeting.duration_minutes,
    type: meeting.meeting_type,
    teacher: meeting.teacher?.full_name,
    className: meeting.class?.name
  })) || []
}

async function fetchTimetableEvents(supabase: Awaited<ReturnType<typeof createClient>>, notificationType: string, studentName: string | undefined, parentId: string) {
  if (notificationType !== 'all' && notificationType !== 'exams' && notificationType !== 'schedule') {
    return []
  }

  if (!studentName) {
    return []
  }

  // Get student info
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes(studentName.toLowerCase())
  )

  if (!student) {
    return []
  }

  // Get student's class assignments
  const { data: classAssignments } = await supabase
    .from('student_class_assignments')
    .select('class_id')
    .eq('student_id', student.student_id)
    .eq('is_active', true)

  if (!classAssignments || classAssignments.length === 0) {
    return []
  }

  const classIds = classAssignments.map(ca => ca.class_id)

  // Get timetable events for the student's classes
  const { data: timetableEvents } = await supabase
    .from('timetable_events')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      week_number,
      notes,
      class:classes(name),
      subject:subjects(code, name_vietnamese),
      teacher:profiles!timetable_events_teacher_id_fkey(full_name),
      classroom:classrooms(name, building, floor)
    `)
    .in('class_id', classIds)
    .order('day_of_week')
    .order('start_time')

  return timetableEvents?.map((event: any) => ({
    dayOfWeek: event.day_of_week,
    startTime: event.start_time,
    endTime: event.end_time,
    weekNumber: event.week_number,
    notes: event.notes,
    className: event.class?.name,
    subjectCode: event.subject?.code,
    subjectName: event.subject?.name_vietnamese,
    teacher: event.teacher?.full_name,
    classroom: event.classroom?.name,
    building: event.classroom?.building,
    floor: event.classroom?.floor
  })) || []
}

// Get notifications from the school system
async function getNotifications(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, notificationType = 'all', timeframe = 'month' } = args

  try {
    const result: Record<string, unknown> = {
      notificationType,
      timeframe
    }

    // Get time filter
    const timeFilter = calculateTimeFilter(timeframe as string)

    // Get general notifications
    result.notifications = await fetchNotifications(supabase, notificationType as string, timeFilter)

    // Get meeting schedules
    result.meetings = await fetchMeetings(supabase, notificationType as string, timeFilter, timeframe as string)

    // Get timetable events (for exam schedules)
    result.timetableEvents = await fetchTimetableEvents(supabase, notificationType as string, studentName as string, parentId)

    // Add summary
    const totalNotifications = (result.notifications as any[])?.length || 0
    const totalMeetings = (result.meetings as any[])?.length || 0
    const totalEvents = (result.timetableEvents as any[])?.length || 0

    result.summary = {
      totalNotifications,
      totalMeetings,
      totalEvents,
      totalItems: totalNotifications + totalMeetings + totalEvents,
      timeframe,
      message: (() => {
        const totalItems = totalNotifications + totalMeetings + totalEvents
        let timeframeName: string
        if (timeframe === 'week') {
          timeframeName = 'tuáº§n'
        } else if (timeframe === 'month') {
          timeframeName = 'thÃ¡ng'
        } else if (timeframe === 'semester') {
          timeframeName = 'há»c ká»³'
        } else {
          timeframeName = 'thá»i gian'
        }
        return `TÃ¬m tháº¥y ${totalItems} thÃ´ng bÃ¡o vÃ  sá»± kiá»‡n trong ${timeframeName} qua`
      })()
    }

    return result

  } catch (error) {
    console.error('Notifications error:', error)
    return { error: `Failed to get notifications: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Helper functions for getAcademicInfo to reduce cognitive complexity
async function fetchCurrentAcademicInfo(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: currentAcademicYear } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single()

  if (!currentAcademicYear) {
    return { currentAcademicYear: null, currentSemester: null }
  }

  const currentAcademicYearData = {
    id: currentAcademicYear.id,
    name: currentAcademicYear.name,
    startDate: new Date(currentAcademicYear.start_date).toLocaleDateString('vi-VN'),
    endDate: new Date(currentAcademicYear.end_date).toLocaleDateString('vi-VN'),
    isCurrent: currentAcademicYear.is_current,
    createdAt: new Date(currentAcademicYear.created_at).toLocaleDateString('vi-VN')
  }

  // Get current semester
  const { data: currentSemester } = await supabase
    .from('semesters')
    .select('*')
    .eq('academic_year_id', currentAcademicYear.id)
    .eq('is_current', true)
    .single()

  const currentSemesterData = currentSemester ? {
    id: currentSemester.id,
    name: currentSemester.name,
    semesterNumber: currentSemester.semester_number,
    startDate: new Date(currentSemester.start_date).toLocaleDateString('vi-VN'),
    endDate: new Date(currentSemester.end_date).toLocaleDateString('vi-VN'),
    weeksCount: currentSemester.weeks_count,
    isCurrent: currentSemester.is_current
  } : null

  return {
    currentAcademicYear: currentAcademicYearData,
    currentSemester: currentSemesterData
  }
}

async function fetchAllAcademicYears(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: allAcademicYears } = await supabase
    .from('academic_years')
    .select('*')
    .order('start_date', { ascending: false })

  return allAcademicYears?.map((year: any) => ({
    id: year.id,
    name: year.name,
    startDate: new Date(year.start_date).toLocaleDateString('vi-VN'),
    endDate: new Date(year.end_date).toLocaleDateString('vi-VN'),
    isCurrent: year.is_current,
    createdAt: new Date(year.created_at).toLocaleDateString('vi-VN')
  })) || []
}

async function fetchSemesters(supabase: Awaited<ReturnType<typeof createClient>>, academicYear: string | undefined) {
  let targetAcademicYearId = null

  if (academicYear) {
    const { data: specifiedYear } = await supabase
      .from('academic_years')
      .select('id')
      .ilike('name', `%${academicYear}%`)
      .single()
    targetAcademicYearId = specifiedYear?.id
  } else {
    const { data: currentYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single()
    targetAcademicYearId = currentYear?.id
  }

  if (!targetAcademicYearId) {
    return []
  }

  const { data: semesters } = await supabase
    .from('semesters')
    .select('*')
    .eq('academic_year_id', targetAcademicYearId)
    .order('semester_number')

  return semesters?.map((semester: any) => ({
    id: semester.id,
    name: semester.name,
    semesterNumber: semester.semester_number,
    startDate: new Date(semester.start_date).toLocaleDateString('vi-VN'),
    endDate: new Date(semester.end_date).toLocaleDateString('vi-VN'),
    weeksCount: semester.weeks_count,
    isCurrent: semester.is_current
  })) || []
}

async function buildAcademicSchedule(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: currentYear } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single()

  if (!currentYear) {
    return null
  }

  const { data: semesters } = await supabase
    .from('semesters')
    .select('*')
    .eq('academic_year_id', currentYear.id)
    .order('semester_number')

  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]

  return {
    academicYear: {
      name: currentYear.name,
      startDate: new Date(currentYear.start_date).toLocaleDateString('vi-VN'),
      endDate: new Date(currentYear.end_date).toLocaleDateString('vi-VN')
    },
    semesters: semesters?.map((semester: any) => {
      const semesterStart = new Date(semester.start_date)
      const semesterEnd = new Date(semester.end_date)
      const isActive = currentDate >= semester.start_date && currentDate <= semester.end_date

      return {
        name: semester.name,
        semesterNumber: semester.semester_number,
        startDate: semesterStart.toLocaleDateString('vi-VN'),
        endDate: semesterEnd.toLocaleDateString('vi-VN'),
        weeksCount: semester.weeks_count,
        isCurrent: semester.is_current,
        isActive,
        status: (() => {
          if (isActive) {
            return 'Äang diá»…n ra'
          } else if (semesterStart > now) {
            return 'Sáº¯p tá»›i'
          } else {
            return 'ÄÃ£ káº¿t thÃºc'
          }
        })()
      }
    }) || [],
    currentStatus: {
      date: now.toLocaleDateString('vi-VN'),
      academicYear: currentYear.name,
      currentSemester: semesters?.find((s: any) => s.is_current)?.name || 'ChÆ°a xÃ¡c Ä‘á»‹nh'
    }
  }
}

// Get academic year and semester information
async function getAcademicInfo(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>): Promise<FunctionResponse> {
  const { infoType = 'current', academicYear } = args

  try {
    const result: Record<string, unknown> = {
      infoType,
      requestedAcademicYear: academicYear
    }

    if (infoType === 'current' || infoType === 'all_years') {
      const currentInfo = await fetchCurrentAcademicInfo(supabase)
      Object.assign(result, currentInfo)
    }

    if (infoType === 'all_years') {
      result.allAcademicYears = await fetchAllAcademicYears(supabase)
    }

    if (infoType === 'semesters' || infoType === 'current') {
      result.semesters = await fetchSemesters(supabase, academicYear as string)
    }

    if (infoType === 'schedule') {
      result.academicSchedule = await buildAcademicSchedule(supabase)
    }

    return result

  } catch (error) {
    console.error('Academic info error:', error)
    return { error: `Failed to get academic info: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Get comprehensive system data
async function getSystemData(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, dataType = 'all_data', includeDetails = true } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!student_id(full_name)')
    .eq('parent_id', parentId)

  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )

  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }

  try {
    const result: Record<string, unknown> = {
      studentName: (student as any).profiles?.full_name || studentName,
      dataType,
      includeDetails
    }

    // Get student's class assignments
    const { data: classAssignments } = await supabase
      .from('student_class_assignments')
      .select(`
        class_id,
        is_active,
        class:classes(
          id,
          name,
          academic_year:academic_years(name),
          semester:semesters(name),
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(full_name, employee_id)
        )
      `)
      .eq('student_id', student.student_id)
      .eq('is_active', true)

    if (dataType === 'class_info' || dataType === 'all_data') {
      result.classInfo = classAssignments?.map((assignment: any) => ({
        className: assignment.class?.name,
        academicYear: assignment.class?.academic_year?.name,
        semester: assignment.class?.semester?.name,
        homeroomTeacher: assignment.class?.homeroom_teacher?.full_name,
        teacherEmployeeId: assignment.class?.homeroom_teacher?.employee_id,
        isActive: assignment.is_active
      })) || []
    }

    if (dataType === 'timetable' || dataType === 'schedule' || dataType === 'all_data') {
      const classIds = classAssignments?.map(ca => ca.class_id) || []

      if (classIds.length > 0) {
        // Get timetable events
        const { data: timetableEvents } = await supabase
          .from('timetable_events')
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            week_number,
            notes,
            class:classes(name),
            subject:subjects(
              id,
              code,
              name_vietnamese,
              name_english,
              category,
              credits
            ),
            teacher:profiles!timetable_events_teacher_id_fkey(
              full_name,
              employee_id,
              email
            ),
            classroom:classrooms(
              name,
              building,
              floor,
              capacity,
              room_type,
              equipment
            )
          `)
          .in('class_id', classIds)
          .order('day_of_week')
          .order('start_time')

        result.timetable = timetableEvents?.map((event: any) => ({
          id: event.id,
          dayOfWeek: event.day_of_week,
          dayName: ['Chá»§ nháº­t', 'Thá»© hai', 'Thá»© ba', 'Thá»© tÆ°', 'Thá»© nÄƒm', 'Thá»© sÃ¡u', 'Thá»© báº£y'][event.day_of_week],
          startTime: event.start_time,
          endTime: event.end_time,
          weekNumber: event.week_number,
          notes: event.notes,
          className: event.class?.name,
          subject: {
            id: event.subject?.id,
            code: event.subject?.code,
            nameVietnamese: event.subject?.name_vietnamese,
            nameEnglish: event.subject?.name_english,
            category: event.subject?.category,
            credits: event.subject?.credits
          },
          teacher: {
            name: event.teacher?.full_name,
            employeeId: event.teacher?.employee_id,
            email: event.teacher?.email
          },
          classroom: {
            name: event.classroom?.name,
            building: event.classroom?.building,
            floor: event.classroom?.floor,
            capacity: event.classroom?.capacity,
            roomType: event.classroom?.room_type,
            equipment: event.classroom?.equipment
          }
        })) || []

        // Group timetable by day for better organization
        const timetableByDay = (result.timetable as any[]).reduce((acc: Record<string, any[]>, event: any) => {
          const dayName = event.dayName
          if (!acc[dayName]) acc[dayName] = []
          acc[dayName].push(event)
          return acc
        }, {})

        result.timetableByDay = timetableByDay
      }
    }

    if (dataType === 'subjects' || dataType === 'all_data') {
      // Get all subjects the student is studying
      const classIds = classAssignments?.map(ca => ca.class_id) || []

      if (classIds.length > 0) {
        const { data: subjectAssignments } = await supabase
          .from('teacher_class_assignments')
          .select(`
            subject:subjects(
              id,
              code,
              name_vietnamese,
              name_english,
              category,
              credits,
              description,
              is_active
            ),
            teacher:profiles!teacher_class_assignments_teacher_id_fkey(
              full_name,
              employee_id,
              email
            )
          `)
          .in('class_id', classIds)
          .eq('is_active', true)

        // Group subjects by category
        const subjectsByCategory = subjectAssignments?.reduce((acc: Record<string, any[]>, assignment: any) => {
          const category = assignment.subject?.category || 'KhÃ¡c'
          if (!acc[category]) acc[category] = []

          // Check if subject already exists in this category
          const existingSubject = acc[category].find(s => s.id === assignment.subject?.id)
          if (!existingSubject) {
            acc[category].push({
              id: assignment.subject?.id,
              code: assignment.subject?.code,
              nameVietnamese: assignment.subject?.name_vietnamese,
              nameEnglish: assignment.subject?.name_english,
              category: assignment.subject?.category,
              credits: assignment.subject?.credits,
              description: assignment.subject?.description,
              isActive: assignment.subject?.is_active,
              teacher: {
                name: assignment.teacher?.full_name,
                employeeId: assignment.teacher?.employee_id,
                email: assignment.teacher?.email
              }
            })
          }
          return acc
        }, {}) || {}

        result.subjects = subjectsByCategory
        result.totalSubjects = Object.values(subjectsByCategory).flat().length
      }
    }

    // Add summary information
    result.summary = {
      studentName: (student as any).profiles?.full_name,
      totalClasses: (result.classInfo as any[])?.length || 0,
      totalTimetableEvents: (result.timetable as any[])?.length || 0,
      totalSubjects: result.totalSubjects || 0,
      dataTypes: dataType === 'all_data' ? ['class_info', 'timetable', 'subjects'] : [dataType],
      generatedAt: new Date().toLocaleString('vi-VN')
    }

    return result

  } catch (error) {
    console.error('System data error:', error)
    return { error: `Failed to get system data: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}
