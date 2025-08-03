/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
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
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  
  if (subjectName) {
    query = query.or(`subjects.name_vietnamese.ilike.%${subjectName}%,subjects.name_english.ilike.%${subjectName}%`)
  }
  
  const { data: grades, error } = await query
  
  if (error) {
    return { error: `Failed to fetch grades: ${error.message}` }
  }
  
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Academic analysis implementation
async function getAcademicAnalysis(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, analysisType = 'overall' } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        .from('teacher_feedback')
        .select(`
          rating,
          comment,
          ai_summary,
          week_number,
          subject_name,
          teacher_name,
          created_at
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

    // Perform analysis based on type
    let analysis: Record<string, unknown> = {}

    if (analysisType === 'overall' || analysisType === 'comparison') {
      // Overall academic performance analysis
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            const range = g.grade >= 8 ? 'excellent' : g.grade >= 6.5 ? 'good' : g.grade >= 5 ? 'average' : 'needs_improvement'
            acc[range] = (acc[range] || 0) + 1
            return acc
          }, {})
        },
        teacher_feedback: {
          average_rating: averageRating,
          total_feedback: feedback.length,
          rating_distribution: feedbackByRating,
          recent_comments: feedback.slice(0, 3).map((f: any) => ({
            subject: f.subject_name,
            rating: f.rating,
            comment: f.comment || f.ai_summary,
            teacher: f.teacher_name,
            week: f.week_number
          }))
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

async function getProgressTrends(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, metric = 'overall', period = 'monthly' } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )

  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }

  try {
    // Calculate time periods based on period parameter
    const now = new Date()
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

    const trends: Record<string, unknown>[] = []

    for (const range of timeRanges) {
      const periodData: Record<string, unknown> = {
        period: range.label,
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString()
      }

      if (metric === 'grades' || metric === 'overall') {
        // Get grades for this period
        const { data: grades } = await supabase
          .from('submission_grades')
          .select('grade, submission_date, subjects(name_vietnamese)')
          .eq('student_id', student.student_id)
          .gte('submission_date', range.start.toISOString())
          .lte('submission_date', range.end.toISOString())

        const gradeAverage = grades && grades.length > 0
          ? (grades.reduce((sum: number, g: any) => sum + g.grade, 0) / grades.length).toFixed(2)
          : null

        periodData.grades = {
          average: gradeAverage,
          count: grades?.length || 0,
          highest: grades && grades.length > 0 ? Math.max(...grades.map((g: any) => g.grade)) : null,
          lowest: grades && grades.length > 0 ? Math.min(...grades.map((g: any) => g.grade)) : null
        }
      }

      if (metric === 'behavior' || metric === 'overall') {
        // Get violations for this period
        const { data: violations } = await supabase
          .from('student_violations')
          .select('severity, recorded_at')
          .eq('student_id', student.student_id)
          .gte('recorded_at', range.start.toISOString())
          .lte('recorded_at', range.end.toISOString())

        const violationsBySeverity = violations?.reduce((acc: Record<string, number>, v: any) => {
          acc[v.severity] = (acc[v.severity] || 0) + 1
          return acc
        }, {}) || {}

        periodData.behavior = {
          total_violations: violations?.length || 0,
          severity_breakdown: violationsBySeverity
        }
      }

      if (metric === 'attendance' || metric === 'overall') {
        // Note: Attendance data would need to be implemented based on your attendance tracking system
        periodData.attendance = {
          note: 'Attendance tracking not yet implemented'
        }
      }

      trends.push(periodData)
    }

    // Calculate trend direction
    const trendAnalysis: Record<string, unknown> = {}

    if (metric === 'grades' || metric === 'overall') {
      const gradeAverages = trends
        .map((t: any) => parseFloat(t.grades?.average))
        .filter(avg => !isNaN(avg))

      if (gradeAverages.length >= 2) {
        const recent = gradeAverages.slice(-2)
        const direction = recent[1] > recent[0] ? 'improving' : recent[1] < recent[0] ? 'declining' : 'stable'
        const change = (recent[1] - recent[0]).toFixed(2)

        trendAnalysis.grades = {
          direction,
          change: parseFloat(change),
          trend: gradeAverages
        }
      }
    }

    if (metric === 'behavior' || metric === 'overall') {
      const violationCounts = trends.map((t: any) => t.behavior?.total_violations || 0)

      if (violationCounts.length >= 2) {
        const recent = violationCounts.slice(-2)
        const direction = recent[1] < recent[0] ? 'improving' : recent[1] > recent[0] ? 'declining' : 'stable'
        const change = recent[1] - recent[0]

        trendAnalysis.behavior = {
          direction,
          change,
          trend: violationCounts
        }
      }
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      studentName: (student as any).profiles?.full_name || studentName,
      metric,
      period,
      trends,
      analysis: trendAnalysis,
      summary: {
        periods_analyzed: trends.length,
        timeframe: `${timeRanges[0]?.label} to ${timeRanges[timeRanges.length - 1]?.label}`
      }
    }

  } catch (error) {
    console.error('Progress trends error:', error)
    return { error: `Failed to analyze progress trends: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

async function getTeacherFeedback(supabase: Awaited<ReturnType<typeof createClient>>, args: Record<string, unknown>, parentId: string): Promise<FunctionResponse> {
  const { studentName, subjectName, feedbackType = 'recent' } = args

  // Get student ID from parent relationship
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id, profiles!parent_student_relationships_student_id_fkey(full_name)')
    .eq('parent_id', parentId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const student = relationships?.find((rel: any) =>
    rel.profiles?.full_name?.toLowerCase().includes((studentName as string).toLowerCase())
  )

  if (!student) {
    return { error: `Student "${studentName}" not found in your children list` }
  }

  try {
    // Build query based on feedback type
    let query = supabase
      .from('teacher_feedback')
      .select(`
        rating,
        comment,
        ai_summary,
        week_number,
        subject_name,
        teacher_name,
        created_at
      `)
      .eq('student_id', student.student_id)
      .order('created_at', { ascending: false })

    // Apply subject filter if specified
    if (subjectName) {
      query = query.ilike('subject_name', `%${subjectName}%`)
    }

    // Apply time filter based on feedback type
    if (feedbackType === 'recent') {
      query = query.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).limit(10)
    } else if (feedbackType === 'summary') {
      query = query.gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    } else if (feedbackType === 'recommendations') {
      query = query.gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    }

    const { data: feedback, error } = await query

    if (error) {
      return { error: `Failed to fetch teacher feedback: ${error.message}` }
    }

    // Process feedback based on type
    const result: Record<string, unknown> = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      studentName: (student as any).profiles?.full_name || studentName,
      subjectFilter: subjectName || 'all subjects',
      feedbackType,
      totalFeedback: feedback?.length || 0
    }

    if (feedbackType === 'recent') {
      result.recentFeedback = feedback?.map((f: any) => ({
        subject: f.subject_name,
        teacher: f.teacher_name,
        rating: f.rating,
        comment: f.comment || f.ai_summary,
        week: f.week_number,
        date: new Date(f.created_at).toLocaleDateString('vi-VN')
      })) || []

    } else if (feedbackType === 'summary') {
      // Aggregate feedback by subject
      const feedbackBySubject = feedback?.reduce((acc: Record<string, any[]>, f: any) => {
        if (!acc[f.subject_name]) acc[f.subject_name] = []
        acc[f.subject_name].push(f)
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
          teacher: feedbackList[0]?.teacher_name,
          averageRating: parseFloat(averageRating),
          totalFeedback: feedbackList.length,
          ratingDistribution,
          recentComments: feedbackList.slice(0, 3).map(f => ({
            rating: f.rating,
            comment: f.comment || f.ai_summary,
            week: f.week_number
          }))
        }
      })

      result.subjectSummaries = subjectSummaries
      result.overallStats = {
        averageRating: feedback && feedback.length > 0
          ? (feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length).toFixed(2)
          : 'N/A',
        ratingDistribution: feedback?.reduce((acc: Record<number, number>, f: any) => {
          acc[f.rating] = (acc[f.rating] || 0) + 1
          return acc
        }, {}) || {}
      }

    } else if (feedbackType === 'recommendations') {
      // Extract actionable recommendations from feedback
      const lowRatingFeedback = feedback?.filter((f: any) => f.rating <= 3) || []
      const highRatingFeedback = feedback?.filter((f: any) => f.rating >= 4) || []

      const areasForImprovement = lowRatingFeedback.map((f: any) => ({
        subject: f.subject_name,
        teacher: f.teacher_name,
        rating: f.rating,
        feedback: f.comment || f.ai_summary,
        week: f.week_number
      }))

      const strengths = highRatingFeedback.map((f: any) => ({
        subject: f.subject_name,
        teacher: f.teacher_name,
        rating: f.rating,
        feedback: f.comment || f.ai_summary,
        week: f.week_number
      }))

      result.recommendations = {
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

    return result

  } catch (error) {
    console.error('Teacher feedback error:', error)
    return { error: `Failed to get teacher feedback: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}
