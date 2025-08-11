import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'

// Initialize Google Generative AI client
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
})

// Interface for feedback data
interface FeedbackData {
  rating: number
  feedback_text: string
  subject: { name_vietnamese: string } | { name_vietnamese: string }[]
  teacher: { full_name: string } | { full_name: string }[]
  created_at: string
}

// Interface for violation data
interface ViolationData {
  violation_date: string
  description: string
  points: number
  violation_type: { name: string } | { name: string }[]
}



/**
 * Generate AI-powered academic performance summary using Google Generative AI
 * Analyzes 4 weeks of teacher feedback and creates comprehensive Vietnamese summary
 */
export async function generateAIAcademicSummary(
  studentId: string, 
  reportPeriodId: string
): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Get report period dates
    const { data: reportPeriod } = await supabase
      .from('report_periods')
      .select('start_date, end_date, name')
      .eq('id', reportPeriodId)
      .single()

    if (!reportPeriod) {
      return 'Không có dữ liệu phản hồi trong kỳ báo cáo này.'
    }

    // Get feedback within the report period with optimized query
    const { data: feedback } = await supabase
      .from('student_feedback')
      .select(`
        rating,
        feedback_text,
        created_at,
        subject:subjects(name_vietnamese),
        teacher:profiles!teacher_id(full_name)
      `)
      .eq('student_id', studentId)
      .gte('created_at', reportPeriod.start_date + 'T00:00:00.000Z')
      .lte('created_at', reportPeriod.end_date + 'T23:59:59.999Z')
      .order('created_at', { ascending: false })

    if (!feedback || feedback.length === 0) {
      return 'Chưa có phản hồi từ giáo viên trong kỳ báo cáo này.'
    }

    // Prepare data for AI analysis with comprehensive processing
    const feedbackSummary = feedback.map((item: FeedbackData) => {
      const subject = Array.isArray(item.subject) ? item.subject[0] : item.subject
      const teacher = Array.isArray(item.teacher) ? item.teacher[0] : item.teacher

      // Clean AI-generated markers from feedback text
      const cleanFeedback = item.feedback_text?.replace(/^\[AI_GENERATED:[^\]]+\]\s*/, '') || ''

      return {
        subject: subject?.name_vietnamese || 'Môn học',
        teacher: teacher?.full_name || 'Giáo viên',
        rating: item.rating,
        comment: cleanFeedback,
        date: item.created_at
      }
    })

    // Comprehensive data analysis
    const subjectAnalysis = feedbackSummary.reduce((acc: Record<string, {
      ratings: number[],
      comments: string[],
      teachers: Set<string>,
      count: number
    }>, item) => {
      if (!acc[item.subject]) {
        acc[item.subject] = {
          ratings: [],
          comments: [],
          teachers: new Set(),
          count: 0
        }
      }

      if (item.rating !== null && item.rating !== undefined) {
        acc[item.subject].ratings.push(item.rating)
      }
      if (item.comment) {
        acc[item.subject].comments.push(item.comment)
      }
      acc[item.subject].teachers.add(item.teacher)
      acc[item.subject].count++

      return acc
    }, {})

    // Calculate statistics
    const totalFeedback = feedbackSummary.length
    const ratedFeedback = feedbackSummary.filter(f => f.rating !== null && f.rating !== undefined)
    const overallAverage = ratedFeedback.length > 0
      ? ratedFeedback.reduce((sum, f) => sum + f.rating, 0) / ratedFeedback.length
      : 0

    const subjectStats = Object.entries(subjectAnalysis).map(([subject, data]) => {
      const avgRating = data.ratings.length > 0
        ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
        : null
      return {
        subject,
        avgRating,
        feedbackCount: data.count,
        ratingCount: data.ratings.length,
        teacherCount: data.teachers.size,
        hasComments: data.comments.length > 0,
        sampleComments: data.comments.slice(0, 2) // First 2 comments for context
      }
    }).sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))

    // Create comprehensive AI prompt for academic performance analysis
    const subjectBreakdown = subjectStats.map(stat => {
      const ratingText = stat.avgRating !== null ? `${stat.avgRating.toFixed(1)}/5` : 'chưa có điểm'
      const commentsText = stat.sampleComments.length > 0 ? ` (${stat.sampleComments.join('; ')})` : ''
      return `- ${stat.subject}: ${ratingText} điểm từ ${stat.ratingCount}/${stat.feedbackCount} phản hồi${commentsText}`
    }).join('\n')

    const prompt = `
Bạn là một giáo viên chủ nhiệm có kinh nghiệm. Hãy phân tích chi tiết và tóm tắt tình hình học tập của học sinh trong ${reportPeriod.name} (${reportPeriod.start_date} đến ${reportPeriod.end_date}).

THÔNG TIN KỲ BÁO CÁO:
- Kỳ báo cáo: ${reportPeriod.name}
- Thời gian: ${reportPeriod.start_date} đến ${reportPeriod.end_date}
- Tổng số phản hồi: ${totalFeedback}
- Phản hồi có điểm: ${ratedFeedback.length}
- Điểm trung bình chung: ${overallAverage.toFixed(1)}/5
- Số môn học: ${Object.keys(subjectAnalysis).length}

PHÂN TÍCH THEO MÔN HỌC:
${subjectBreakdown}

YÊU CẦU PHÂN TÍCH CHI TIẾT:
1. Viết bằng tiếng Việt, phong cách trang trọng, phù hợp cho báo cáo giáo dục
2. Bắt đầu bằng việc nêu rõ kỳ báo cáo và thời gian cụ thể
3. Tóm tắt TẤT CẢ feedback từ giáo viên trong kỳ báo cáo này
4. Phân tích cụ thể từng môn học với điểm mạnh và điểm yếu
5. So sánh kết quả giữa các môn học, xác định môn mạnh và môn cần cải thiện
6. Đưa ra nhận xét về xu hướng học tập và thái độ học tập trong kỳ này
7. Đề xuất ngắn gọn các biện pháp cải thiện chính
8. Tóm tắt trong 80-120 từ, viết ngắn gọn, súc tích
9. Đảm bảo chính xác 100% dựa trên dữ liệu thống kê đã cung cấp
10. Tập trung vào những điểm chính, không cần chi tiết quá mức

Tóm tắt chi tiết tình hình học tập:
`

    // Generate content using Google Generative AI
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: 0.2, // Lower temperature for more consistent, factual output
        maxOutputTokens: 400, // Reduced for concise summaries
        topP: 0.9,
        topK: 40
      }
    })

    const aiSummary = response.text?.trim()
    
    if (!aiSummary) {
      // Fallback to basic summary if AI fails
      return generateBasicAcademicSummary(feedbackSummary)
    }

    return aiSummary

  } catch (error) {
    console.error('Error generating AI academic summary:', error)
    
    // Fallback to basic summary on error
    try {
      const supabase = await createClient()
      const { data: feedback } = await supabase
        .from('student_feedback')
        .select('rating, subject:subjects(name_vietnamese)')
        .eq('student_id', studentId)
        .gte('created_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())

      if (feedback && feedback.length > 0) {
        const avgRating = feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / feedback.length
        return `Tình hình học tập: Điểm trung bình ${avgRating.toFixed(1)}/5 từ ${feedback.length} phản hồi của giáo viên.`
      }
    } catch (fallbackError) {
      console.error('Fallback summary also failed:', fallbackError)
    }
    
    return 'Không thể tạo tóm tắt tình hình học tập. Vui lòng thử lại sau.'
  }
}

/**
 * Generate AI-powered discipline status summary using Google Generative AI
 * Analyzes violations in the report period and creates comprehensive Vietnamese summary
 */
export async function generateAIDisciplineSummary(
  studentId: string, 
  reportPeriodId: string
): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Get report period dates
    const { data: reportPeriod } = await supabase
      .from('report_periods')
      .select('start_date, end_date, name')
      .eq('id', reportPeriodId)
      .single()

    if (!reportPeriod) {
      return 'Không có dữ liệu vi phạm trong kỳ báo cáo này.'
    }

    // Get violations within the report period with optimized query
    const { data: violations } = await supabase
      .from('student_violations')
      .select(`
        violation_date,
        description,
        points,
        severity,
        violation_type:violation_types(name, default_severity)
      `)
      .eq('student_id', studentId)
      .gte('violation_date', reportPeriod.start_date)
      .lte('violation_date', reportPeriod.end_date)
      .order('violation_date', { ascending: false })

    if (!violations || violations.length === 0) {
      return 'Học sinh tuân thủ tốt nội quy nhà trường trong kỳ báo cáo này. Không có vi phạm nào được ghi nhận.'
    }

    // Comprehensive violations data analysis
    const violationSummary = violations.map((item: ViolationData, index: number) => {
      const violationType = Array.isArray(item.violation_type) ? item.violation_type[0] : item.violation_type

      return {
        index: index + 1,
        type: violationType?.name || 'Vi phạm',
        date: item.violation_date,
        description: item.description || '',
        points: item.points || 0
      }
    })

    // Calculate comprehensive statistics
    const totalPoints = violationSummary.reduce((sum, item) => sum + item.points, 0)

    // Group by violation type
    const typeAnalysis = violationSummary.reduce((acc: Record<string, {
      count: number,
      totalPoints: number,
      descriptions: string[]
    }>, item) => {
      if (!acc[item.type]) {
        acc[item.type] = {
          count: 0,
          totalPoints: 0,
          descriptions: []
        }
      }
      acc[item.type].count++
      acc[item.type].totalPoints += item.points
      if (item.description) {
        acc[item.type].descriptions.push(item.description)
      }
      return acc
    }, {})

    // Skip severity analysis since we don't have severity data

    const typeStats = Object.entries(typeAnalysis)
      .map(([type, data]) => ({
        type,
        count: data.count,
        totalPoints: data.totalPoints,
        avgPoints: data.totalPoints / data.count,
        sampleDescriptions: data.descriptions.slice(0, 2)
      }))
      .sort((a, b) => b.count - a.count)

    // Create comprehensive AI prompt for discipline analysis
    const typeBreakdown = typeStats.map(stat => {
      const descriptions = stat.sampleDescriptions.length > 0 ? ` (${stat.sampleDescriptions.join('; ')})` : ''
      return `- ${stat.type}: ${stat.count} lần, ${stat.totalPoints} điểm trừ${descriptions}`
    }).join('\n')

    const prompt = `
Bạn là một giáo viên chủ nhiệm có kinh nghiệm. Hãy phân tích chi tiết tình hình tuân thủ nội quy của học sinh trong ${reportPeriod.name} (${reportPeriod.start_date} đến ${reportPeriod.end_date}).

THÔNG TIN KỲ BÁO CÁO:
- Kỳ báo cáo: ${reportPeriod.name}
- Thời gian: ${reportPeriod.start_date} đến ${reportPeriod.end_date}
- Tổng số vi phạm: ${violations.length}
- Tổng điểm trừ: ${totalPoints} điểm

PHÂN TÍCH THEO LOẠI VI PHẠM:
${typeBreakdown}

CHI TIẾT CÁC VI PHẠM:
${violationSummary.map(v => `- ${v.date}: ${v.type} - ${v.description} (${v.points} điểm)`).join('\n')}

YÊU CẦU BẮT BUỘC:
1. CHỈ viết bằng tiếng Việt, TUYỆT ĐỐI KHÔNG dùng từ tiếng Anh
2. Liệt kê cụ thể từng loại vi phạm và số lần vi phạm
3. Phân tích xu hướng và mức độ nghiêm trọng
4. Đưa ra nhận định về ý thức kỷ luật của học sinh
5. Sử dụng ngôn ngữ trang trọng, phù hợp với báo cáo giáo dục
6. Tóm tắt trong 60-80 từ, ngắn gọn nhưng đầy đủ thông tin
7. Đảm bảo chính xác 100% dựa trên dữ liệu thống kê đã cung cấp
8. Không sử dụng các từ như: "performance", "behavior", "discipline" - thay bằng "thành tích", "hành vi", "kỷ luật"

Ví dụ mẫu: "Trong kỳ báo cáo này, học sinh có 3 vi phạm gồm: đi muộn (2 lần, 4 điểm), không làm bài tập (1 lần, 2 điểm). Tổng cộng 6 điểm trừ. Học sinh cần cải thiện ý thức thời gian và trách nhiệm học tập."

Tóm tắt chi tiết tình hình rèn luyện:
`

    // Generate content using Google Generative AI with Vietnamese optimization
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: 0.1, // Very low temperature for consistent Vietnamese output
        maxOutputTokens: 250, // Reduced for concise summaries
        topP: 0.8, // Lower for more focused responses
        topK: 20, // Lower for more deterministic output
        candidateCount: 1 // Single response for consistency
      }
    })

    const aiSummary = response.text?.trim()
    
    if (!aiSummary) {
      // Fallback to basic summary if AI fails
      return generateBasicDisciplineSummary(violationSummary, totalPoints)
    }

    return aiSummary

  } catch (error) {
    console.error('Error generating AI discipline summary:', error)
    
    // Fallback to basic summary on error
    try {
      const supabase = await createClient()
      // Get report period for fallback
      const { data: reportPeriod } = await supabase
        .from('report_periods')
        .select('start_date, end_date, name')
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

      if (reportPeriod) {
        const { data: violations } = await supabase
          .from('student_violations')
          .select('points, violation_date')
          .eq('student_id', studentId)
          .gte('violation_date', reportPeriod.start_date)
          .lte('violation_date', reportPeriod.end_date)

        if (violations && violations.length > 0) {
          const totalPoints = violations.reduce((sum, item) => sum + (item.points || 0), 0)
          return `Trong ${reportPeriod.name}, học sinh có ${violations.length} vi phạm với tổng ${totalPoints} điểm trừ.`
        } else {
          return `Trong ${reportPeriod.name}, học sinh tuân thủ tốt nội quy nhà trường. Không có vi phạm nào được ghi nhận.`
        }
      }
    } catch (fallbackError) {
      console.error('Fallback discipline summary also failed:', fallbackError)
    }
    
    return 'Không thể tạo tóm tắt tình hình kỷ luật. Vui lòng thử lại sau.'
  }
}

// Fallback function for basic academic summary
function generateBasicAcademicSummary(feedbackData: Array<{ subject: string; rating: number }>): string {
  const subjects = feedbackData.reduce((acc: Record<string, number[]>, item) => {
    if (!acc[item.subject]) acc[item.subject] = []
    acc[item.subject].push(item.rating)
    return acc
  }, {})

  const summary = 'Tình hình học tập: '
  const subjectSummaries = Object.entries(subjects).map(([subject, ratings]) => {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
    return `${subject} ${avg.toFixed(1)}/5`
  })

  return summary + subjectSummaries.join(', ') + '.'
}

// Fallback function for basic discipline summary
function generateBasicDisciplineSummary(violations: Array<{ type: string; index: number; points: number }>, totalPoints: number): string {
  const violationTypes = violations.reduce((acc: Record<string, number>, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1
    return acc
  }, {})

  const typeList = Object.entries(violationTypes)
    .map(([type, count]) => `${type} (${count} lần)`)
    .join(', ')

  return `Có ${violations.length} vi phạm trong kỳ báo cáo: ${typeList}. Tổng điểm trừ: ${totalPoints} điểm.`
}

/**
 * Generate AI-powered strengths summary for student reports
 */
export async function generateAIStrengthsSummary(
  studentId: string,
  reportPeriodId: string
): Promise<string> {
  try {
    const supabase = await createClient()

    // Get report period dates
    const { data: reportPeriod } = await supabase
      .from('report_periods')
      .select('start_date, end_date, name')
      .eq('id', reportPeriodId)
      .single()

    if (!reportPeriod) {
      return 'Không có dữ liệu để tạo ưu điểm trong kỳ báo cáo này.'
    }

    // Get positive feedback (rating >= 4)
    const { data: feedback } = await supabase
      .from('student_feedback')
      .select(`
        rating,
        feedback_text,
        created_at,
        subject:subjects(name_vietnamese),
        teacher:profiles!teacher_id(full_name)
      `)
      .eq('student_id', studentId)
      .gte('created_at', reportPeriod.start_date + 'T00:00:00.000Z')
      .lte('created_at', reportPeriod.end_date + 'T23:59:59.999Z')
      .gte('rating', 4)
      .order('created_at', { ascending: false })

    if (!feedback || feedback.length === 0) {
      return 'Học sinh cần cố gắng hơn để có những điểm tích cực trong học tập.'
    }

    // Prepare positive feedback data
    const positiveFeedback = feedback.map((item: FeedbackData) => {
      const subject = Array.isArray(item.subject) ? item.subject[0] : item.subject
      const teacher = Array.isArray(item.teacher) ? item.teacher[0] : item.teacher
      const cleanFeedback = item.feedback_text?.replace(/^\[AI_GENERATED:[^\]]+\]\s*/, '') || ''

      return {
        subject: subject?.name_vietnamese || 'Môn học',
        teacher: teacher?.full_name || 'Giáo viên',
        rating: item.rating,
        comment: cleanFeedback
      }
    })

    const prompt = `
Bạn là một giáo viên chủ nhiệm có kinh nghiệm. Hãy tóm tắt ưu điểm của học sinh dựa trên phản hồi tích cực từ giáo viên trong ${reportPeriod.name}.

PHẢN HỒI TÍCH CỰC:
${positiveFeedback.map(f => `- ${f.subject}: ${f.rating}/5 điểm - ${f.comment}`).join('\n')}

YÊU CẦU:
1. Viết bằng tiếng Việt, phong cách trang trọng
2. Tóm tắt trong 40-60 từ, ngắn gọn
3. Tập trung vào những ưu điểm nổi bật nhất
4. Viết theo cách tích cực, khuyến khích
5. Đảm bảo chính xác dựa trên dữ liệu

Ưu điểm của học sinh:
`

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 200,
        topP: 0.9,
        topK: 40
      }
    })

    const aiSummary = response.text?.trim()
    return aiSummary || 'Học sinh có những điểm tích cực trong học tập cần được ghi nhận.'

  } catch (error) {
    console.error('Error generating AI strengths summary:', error)
    return 'Không thể tạo tóm tắt ưu điểm. Vui lòng thử lại sau.'
  }
}

/**
 * Generate AI-powered weaknesses summary for student reports
 */
export async function generateAIWeaknessesSummary(
  studentId: string,
  reportPeriodId: string
): Promise<string> {
  try {
    const supabase = await createClient()

    // Get report period dates
    const { data: reportPeriod } = await supabase
      .from('report_periods')
      .select('start_date, end_date, name')
      .eq('id', reportPeriodId)
      .single()

    if (!reportPeriod) {
      return 'Không có dữ liệu để tạo khuyết điểm trong kỳ báo cáo này.'
    }

    // Get negative feedback (rating <= 3) and violations
    const [feedbackResult, violationsResult] = await Promise.all([
      supabase
        .from('student_feedback')
        .select(`
          rating,
          feedback_text,
          created_at,
          subject:subjects(name_vietnamese),
          teacher:profiles!teacher_id(full_name)
        `)
        .eq('student_id', studentId)
        .gte('created_at', reportPeriod.start_date + 'T00:00:00.000Z')
        .lte('created_at', reportPeriod.end_date + 'T23:59:59.999Z')
        .lte('rating', 3)
        .order('created_at', { ascending: false }),

      supabase
        .from('student_violations')
        .select(`
          violation_date,
          description,
          points,
          violation_type:violation_types(name)
        `)
        .eq('student_id', studentId)
        .gte('violation_date', reportPeriod.start_date)
        .lte('violation_date', reportPeriod.end_date)
        .order('violation_date', { ascending: false })
    ])

    const negativeFeedback = feedbackResult.data || []
    const violations = violationsResult.data || []

    if (negativeFeedback.length === 0 && violations.length === 0) {
      return 'Học sinh cần duy trì và phát huy những điểm tốt hiện tại.'
    }

    // Prepare negative feedback data
    const negativeData = negativeFeedback.map((item: FeedbackData) => {
      const subject = Array.isArray(item.subject) ? item.subject[0] : item.subject
      const cleanFeedback = item.feedback_text?.replace(/^\[AI_GENERATED:[^\]]+\]\s*/, '') || ''

      return {
        subject: subject?.name_vietnamese || 'Môn học',
        rating: item.rating,
        comment: cleanFeedback
      }
    })

    const violationData = violations.map((item: ViolationData) => {
      const violationType = Array.isArray(item.violation_type) ? item.violation_type[0] : item.violation_type
      return {
        type: violationType?.name || 'Vi phạm',
        description: item.description || '',
        points: item.points || 0
      }
    })

    const prompt = `
Bạn là một giáo viên chủ nhiệm có kinh nghiệm. Hãy tóm tắt khuyết điểm cần cải thiện của học sinh dựa trên phản hồi và vi phạm trong ${reportPeriod.name}.

PHẢN HỒI CẦN CẢI THIỆN:
${negativeData.map(f => `- ${f.subject}: ${f.rating}/5 điểm - ${f.comment}`).join('\n')}

VI PHẠM:
${violationData.map(v => `- ${v.type}: ${v.description} (${v.points} điểm)`).join('\n')}

YÊU CẦU:
1. Viết bằng tiếng Việt, phong cách trang trọng
2. Tóm tắt trong 40-60 từ, ngắn gọn
3. Tập trung vào những khuyết điểm cần cải thiện nhất
4. Viết theo cách xây dựng, khuyến khích cải thiện
5. Đảm bảo chính xác dựa trên dữ liệu

Khuyết điểm cần cải thiện:
`

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 200,
        topP: 0.9,
        topK: 40
      }
    })

    const aiSummary = response.text?.trim()
    return aiSummary || 'Học sinh cần cố gắng cải thiện một số khía cạnh trong học tập và rèn luyện.'

  } catch (error) {
    console.error('Error generating AI weaknesses summary:', error)
    return 'Không thể tạo tóm tắt khuyết điểm. Vui lòng thử lại sau.'
  }
}
