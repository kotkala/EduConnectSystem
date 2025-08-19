'use server'

import { createClient } from '@/shared/utils/supabase/server'
import { checkAdminPermissions } from '@/lib/utils/permission-utils'

// Get overall grade statistics - Optimized with single query
export async function getOverallGradeStatsAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Use a single optimized query with aggregation
    const { data: stats, error } = await supabase
      .rpc('get_overall_grade_stats')

    if (error) {
      // Fallback to original method if RPC doesn't exist
      console.warn('RPC not available, using fallback method')

      // Optimized single query approach
      const [submissionsResult, studentsResult, classesResult, subjectsResult] = await Promise.all([
        supabase.from('student_grade_submissions').select('id', { count: 'exact', head: true }).eq('status', 'sent_to_teacher'),
        supabase.from('student_grade_submissions').select('student_id').eq('status', 'sent_to_teacher'),
        supabase.from('student_grade_submissions').select('class_id').eq('status', 'sent_to_teacher'),
        supabase.from('individual_subject_grades').select('subject_id').not('average_grade', 'is', null)
      ])

      if (submissionsResult.error || studentsResult.error || classesResult.error || subjectsResult.error) {
        throw new Error('Failed to fetch statistics')
      }

      const uniqueStudents = new Set(studentsResult.data?.map(s => s.student_id) || []).size
      const uniqueClasses = new Set(classesResult.data?.map(c => c.class_id) || []).size
      const uniqueSubjects = new Set(subjectsResult.data?.map(s => s.subject_id) || []).size

      return {
        success: true,
        data: {
          totalSubmissions: submissionsResult.count || 0,
          totalStudents: uniqueStudents,
          totalClasses: uniqueClasses,
          totalSubjects: uniqueSubjects
        }
      }
    }

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('Error fetching overall grade stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch overall stats"
    }
  }
}

// Get grade distribution data - Optimized with aggregation
export async function getGradeDistributionAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Use aggregation query for better performance
    const { data: distribution, error } = await supabase
      .rpc('get_grade_distribution')

    if (error) {
      // Fallback to optimized client-side calculation
      console.warn('RPC not available, using fallback method')

      const { data: grades, error: gradesError } = await supabase
        .from('individual_subject_grades')
        .select('average_grade')
        .not('average_grade', 'is', null)
        .limit(10000) // Limit for performance

      if (gradesError) {
        return { success: false, error: gradesError.message }
      }

      const gradeValues = grades?.map(g => g.average_grade).filter(Boolean) || []

      // Use reduce for better performance than multiple filters
      const distribution = gradeValues.reduce((acc, grade) => {
        if (grade >= 8.5) acc.excellent++
        else if (grade >= 7.0) acc.good++
        else if (grade >= 5.0) acc.average++
        else acc.poor++
        return acc
      }, { excellent: 0, good: 0, average: 0, poor: 0 })

      const total = gradeValues.length
      const distributionData = [
        { name: 'Xuất sắc (≥8.5)', count: distribution.excellent, percentage: total > 0 ? Math.round((distribution.excellent / total) * 100) : 0 },
        { name: 'Khá (7.0-8.4)', count: distribution.good, percentage: total > 0 ? Math.round((distribution.good / total) * 100) : 0 },
        { name: 'Trung bình (5.0-6.9)', count: distribution.average, percentage: total > 0 ? Math.round((distribution.average / total) * 100) : 0 },
        { name: 'Yếu (<5.0)', count: distribution.poor, percentage: total > 0 ? Math.round((distribution.poor / total) * 100) : 0 }
      ]

      return {
        success: true,
        data: distributionData
      }
    }

    return {
      success: true,
      data: distribution
    }
  } catch (error) {
    console.error('Error fetching grade distribution:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch grade distribution"
    }
  }
}

// Get class performance comparison
export async function getClassPerformanceAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: classGrades, error } = await supabase
      .from('student_grade_submissions')
      .select(`
        class_id,
        class:classes!student_grade_submissions_class_id_fkey(name),
        grades:individual_subject_grades(average_grade)
      `)
      .eq('status', 'sent_to_teacher')

    if (error) {
      return { success: false, error: error.message }
    }

    const classPerformance = classGrades?.reduce((acc, submission) => {
      const className = (submission.class as unknown as { name: string })?.name
      if (!className) return acc

      if (!acc[className]) {
        acc[className] = { grades: [], count: 0 }
      }

      const validGrades = submission.grades?.filter(g => g.average_grade !== null).map(g => g.average_grade) || []
      acc[className].grades.push(...validGrades)
      acc[className].count += 1

      return acc
    }, {} as Record<string, { grades: number[], count: number }>)

    const performanceData = Object.entries(classPerformance || {}).map(([className, data]) => {
      const average = data.grades.length > 0 
        ? Math.round((data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length) * 10) / 10
        : 0

      return {
        className,
        averageGrade: average,
        studentCount: data.count,
        totalGrades: data.grades.length
      }
    }).sort((a, b) => b.averageGrade - a.averageGrade)

    return {
      success: true,
      data: performanceData
    }
  } catch (error) {
    console.error('Error fetching class performance:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class performance"
    }
  }
}

// Get subject analysis
export async function getSubjectAnalysisAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: subjectGrades, error } = await supabase
      .from('individual_subject_grades')
      .select(`
        subject_id,
        average_grade,
        subject:subjects(name_vietnamese, category)
      `)
      .not('average_grade', 'is', null)

    if (error) {
      return { success: false, error: error.message }
    }

    const subjectPerformance = subjectGrades?.reduce((acc, grade) => {
      const subjectName = (grade.subject as unknown as { name_vietnamese: string })?.name_vietnamese
      if (!subjectName || !grade.average_grade) return acc

      if (!acc[subjectName]) {
        acc[subjectName] = { grades: [], category: (grade.subject as unknown as { category: string })?.category }
      }

      acc[subjectName].grades.push(grade.average_grade)
      return acc
    }, {} as Record<string, { grades: number[], category: string }>)

    const analysisData = Object.entries(subjectPerformance || {}).map(([subjectName, data]) => {
      const average = data.grades.length > 0 
        ? Math.round((data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length) * 10) / 10
        : 0

      const highest = data.grades.length > 0 ? Math.max(...data.grades) : 0
      const lowest = data.grades.length > 0 ? Math.min(...data.grades) : 0

      return {
        subjectName,
        category: data.category,
        averageGrade: average,
        highestGrade: highest,
        lowestGrade: lowest,
        totalGrades: data.grades.length
      }
    }).sort((a, b) => b.averageGrade - a.averageGrade)

    return {
      success: true,
      data: analysisData
    }
  } catch (error) {
    console.error('Error fetching subject analysis:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subject analysis"
    }
  }
}

// Get trend analysis (by semester)
export async function getTrendAnalysisAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: trendData, error } = await supabase
      .from('student_grade_submissions')
      .select(`
        semester_id,
        academic_year_id,
        semester:semesters(name),
        academic_year:academic_years(name),
        grades:individual_subject_grades(average_grade)
      `)
      .eq('status', 'sent_to_teacher')
      .order('academic_year_id', { ascending: true })
      .order('semester_id', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const trendAnalysis = trendData?.reduce((acc, submission) => {
      const semesterName = (submission.semester as unknown as { name: string })?.name
      const yearName = (submission.academic_year as unknown as { name: string })?.name
      const periodKey = `${yearName} - ${semesterName}`

      if (!acc[periodKey]) {
        acc[periodKey] = { grades: [] }
      }

      const validGrades = submission.grades?.filter(g => g.average_grade !== null).map(g => g.average_grade) || []
      acc[periodKey].grades.push(...validGrades)

      return acc
    }, {} as Record<string, { grades: number[] }>)

    const trendChartData = Object.entries(trendAnalysis || {}).map(([period, data]) => {
      const average = data.grades.length > 0 
        ? Math.round((data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length) * 10) / 10
        : 0

      return {
        period,
        averageGrade: average,
        totalGrades: data.grades.length
      }
    })

    return {
      success: true,
      data: trendChartData
    }
  } catch (error) {
    console.error('Error fetching trend analysis:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch trend analysis"
    }
  }
}
