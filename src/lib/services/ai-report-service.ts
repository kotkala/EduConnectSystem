import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

// Initialize Google Generative AI client
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
})

// Helper function to get style instructions
function getStyleInstructions(style: string): string {
  switch (style) {
    case 'friendly':
      return 'Sá»­ dá»¥ng phong cÃ¡ch gáº§n gÅ©i, thÃ¢n thiá»‡n, áº¥m Ã¡p nhÆ° má»™t ngÆ°á»i tháº§y quan tÃ¢m Ä‘áº¿n há»c sinh.'
    case 'serious':
      return 'Sá»­ dá»¥ng phong cÃ¡ch nghiÃªm tÃºc, ká»· luáº­t, trang trá»ng phÃ¹ há»£p vá»›i mÃ´i trÆ°á»ng giÃ¡o dá»¥c.'
    case 'encouraging':
      return 'Sá»­ dá»¥ng phong cÃ¡ch khÃ­ch lá»‡, Ä‘á»™ng viÃªn, tÃ­ch cá»±c Ä‘á»ƒ táº¡o Ä‘á»™ng lá»±c cho há»c sinh.'
    case 'understanding':
      return 'Sá»­ dá»¥ng phong cÃ¡ch láº¯ng nghe, tháº¥u hiá»ƒu, Ä‘á»“ng cáº£m vá»›i hoÃ n cáº£nh cá»§a há»c sinh.'
    default:
      return 'Sá»­ dá»¥ng phong cÃ¡ch gáº§n gÅ©i, thÃ¢n thiá»‡n, áº¥m Ã¡p nhÆ° má»™t ngÆ°á»i tháº§y quan tÃ¢m Ä‘áº¿n há»c sinh.'
  }
}

// Helper function to get length instructions
function getLengthInstructions(length: string): string {
  switch (length) {
    case 'short':
      return 'Viáº¿t ngáº¯n gá»n trong 1-2 cÃ¢u (20-40 tá»«), táº­p trung vÃ o Ä‘iá»ƒm chÃ­nh nháº¥t.'
    case 'medium':
      return 'Viáº¿t trung bÃ¬nh trong 3-5 cÃ¢u (60-100 tá»«), cung cáº¥p thÃ´ng tin cáº§n thiáº¿t.'
    case 'long':
      return 'Viáº¿t chi tiáº¿t trong 6 cÃ¢u trá»Ÿ lÃªn (120-200 tá»«), phÃ¢n tÃ­ch sÃ¢u vÃ  Ä‘áº§y Ä‘á»§.'
    default:
      return 'Viáº¿t trung bÃ¬nh trong 3-5 cÃ¢u (60-100 tá»«), cung cáº¥p thÃ´ng tin cáº§n thiáº¿t.'
  }
}

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
  reportPeriodId: string,
  style: string = 'friendly',
  length: string = 'medium'
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
      return 'KhÃ´ng cÃ³ dá»¯ liá»‡u pháº£n há»“i trong ká»³ bÃ¡o cÃ¡o nÃ y.'
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
      return 'ChÆ°a cÃ³ pháº£n há»“i tá»« giÃ¡o viÃªn trong ká»³ bÃ¡o cÃ¡o nÃ y.'
    }

    // Prepare data for AI analysis with comprehensive processing
    const feedbackSummary = feedback.map((item: FeedbackData) => {
      const subject = Array.isArray(item.subject) ? item.subject[0] : item.subject
      const teacher = Array.isArray(item.teacher) ? item.teacher[0] : item.teacher

      // Clean AI-generated markers from feedback text
      const cleanFeedback = item.feedback_text?.replace(/^\[AI_GENERATED:[^\]]+\]\s*/, '') || ''

      return {
        subject: subject?.name_vietnamese || 'MÃ´n há»c',
        teacher: teacher?.full_name || 'GiÃ¡o viÃªn',
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
      const ratingText = stat.avgRating !== null ? `${stat.avgRating.toFixed(1)}/5` : 'chÆ°a cÃ³ Ä‘iá»ƒm'
      const commentsText = stat.sampleComments.length > 0 ? ` (${stat.sampleComments.join('; ')})` : ''
      return `- ${stat.subject}: ${ratingText} Ä‘iá»ƒm tá»« ${stat.ratingCount}/${stat.feedbackCount} pháº£n há»“i${commentsText}`
    }).join('\n')

    const prompt = `
Báº¡n lÃ  má»™t giÃ¡o viÃªn chá»§ nhiá»‡m cÃ³ kinh nghiá»‡m. HÃ£y phÃ¢n tÃ­ch chi tiáº¿t vÃ  tÃ³m táº¯t tÃ¬nh hÃ¬nh há»c táº­p cá»§a há»c sinh trong ${reportPeriod.name} (${reportPeriod.start_date} Ä‘áº¿n ${reportPeriod.end_date}).

THÃ”NG TIN Ká»² BÃO CÃO:
- Ká»³ bÃ¡o cÃ¡o: ${reportPeriod.name}
- Thá»i gian: ${reportPeriod.start_date} Ä‘áº¿n ${reportPeriod.end_date}
- Tá»•ng sá»‘ pháº£n há»“i: ${totalFeedback}
- Pháº£n há»“i cÃ³ Ä‘iá»ƒm: ${ratedFeedback.length}
- Äiá»ƒm trung bÃ¬nh chung: ${overallAverage.toFixed(1)}/5
- Sá»‘ mÃ´n há»c: ${Object.keys(subjectAnalysis).length}

PHÃ‚N TÃCH THEO MÃ”N Há»ŒC:
${subjectBreakdown}

YÃŠU Cáº¦U PHÃ‚N TÃCH CHI TIáº¾T:
1. Viáº¿t báº±ng tiáº¿ng Viá»‡t, ${getStyleInstructions(style)}
2. ${getLengthInstructions(length)}
3. Báº¯t Ä‘áº§u báº±ng viá»‡c nÃªu rÃµ ká»³ bÃ¡o cÃ¡o vÃ  thá»i gian cá»¥ thá»ƒ
4. TÃ³m táº¯t Táº¤T Cáº¢ feedback tá»« giÃ¡o viÃªn trong ká»³ bÃ¡o cÃ¡o nÃ y
5. PhÃ¢n tÃ­ch cá»¥ thá»ƒ tá»«ng mÃ´n há»c vá»›i Ä‘iá»ƒm máº¡nh vÃ  Ä‘iá»ƒm yáº¿u
6. So sÃ¡nh káº¿t quáº£ giá»¯a cÃ¡c mÃ´n há»c, xÃ¡c Ä‘á»‹nh mÃ´n máº¡nh vÃ  mÃ´n cáº§n cáº£i thiá»‡n
7. ÄÆ°a ra nháº­n xÃ©t vá» xu hÆ°á»›ng há»c táº­p vÃ  thÃ¡i Ä‘á»™ há»c táº­p trong ká»³ nÃ y
8. Äá» xuáº¥t ngáº¯n gá»n cÃ¡c biá»‡n phÃ¡p cáº£i thiá»‡n chÃ­nh
9. Äáº£m báº£o chÃ­nh xÃ¡c 100% dá»±a trÃªn dá»¯ liá»‡u thá»‘ng kÃª Ä‘Ã£ cung cáº¥p
10. Táº­p trung vÃ o nhá»¯ng Ä‘iá»ƒm chÃ­nh, khÃ´ng cáº§n chi tiáº¿t quÃ¡ má»©c

TÃ³m táº¯t chi tiáº¿t tÃ¬nh hÃ¬nh há»c táº­p:
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
        return `TÃ¬nh hÃ¬nh há»c táº­p: Äiá»ƒm trung bÃ¬nh ${avgRating.toFixed(1)}/5 tá»« ${feedback.length} pháº£n há»“i cá»§a giÃ¡o viÃªn.`
      }
    } catch (fallbackError) {
      console.error('Fallback summary also failed:', fallbackError)
    }
    
    return 'KhÃ´ng thá»ƒ táº¡o tÃ³m táº¯t tÃ¬nh hÃ¬nh há»c táº­p. Vui lÃ²ng thá»­ láº¡i sau.'
  }
}

/**
 * Generate AI-powered discipline status summary using Google Generative AI
 * Analyzes violations in the report period and creates comprehensive Vietnamese summary
 */
export async function generateAIDisciplineSummary(
  studentId: string,
  reportPeriodId: string,
  style: string = 'friendly',
  length: string = 'medium'
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
      return 'KhÃ´ng cÃ³ dá»¯ liá»‡u vi pháº¡m trong ká»³ bÃ¡o cÃ¡o nÃ y.'
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
      return 'Há»c sinh tuÃ¢n thá»§ tá»‘t ná»™i quy nhÃ  trÆ°á»ng trong ká»³ bÃ¡o cÃ¡o nÃ y. KhÃ´ng cÃ³ vi pháº¡m nÃ o Ä‘Æ°á»£c ghi nháº­n.'
    }

    // Comprehensive violations data analysis
    const violationSummary = violations.map((item: ViolationData, index: number) => {
      const violationType = Array.isArray(item.violation_type) ? item.violation_type[0] : item.violation_type

      return {
        index: index + 1,
        type: violationType?.name || 'Vi pháº¡m',
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
      return `- ${stat.type}: ${stat.count} láº§n, ${stat.totalPoints} Ä‘iá»ƒm trá»«${descriptions}`
    }).join('\n')

    const prompt = `
Báº¡n lÃ  má»™t giÃ¡o viÃªn chá»§ nhiá»‡m cÃ³ kinh nghiá»‡m. HÃ£y phÃ¢n tÃ­ch chi tiáº¿t tÃ¬nh hÃ¬nh tuÃ¢n thá»§ ná»™i quy cá»§a há»c sinh trong ${reportPeriod.name} (${reportPeriod.start_date} Ä‘áº¿n ${reportPeriod.end_date}).

THÃ”NG TIN Ká»² BÃO CÃO:
- Ká»³ bÃ¡o cÃ¡o: ${reportPeriod.name}
- Thá»i gian: ${reportPeriod.start_date} Ä‘áº¿n ${reportPeriod.end_date}
- Tá»•ng sá»‘ vi pháº¡m: ${violations.length}
- Tá»•ng Ä‘iá»ƒm trá»«: ${totalPoints} Ä‘iá»ƒm

PHÃ‚N TÃCH THEO LOáº I VI PHáº M:
${typeBreakdown}

CHI TIáº¾T CÃC VI PHáº M:
${violationSummary.map(v => `- ${v.date}: ${v.type} - ${v.description} (${v.points} Ä‘iá»ƒm)`).join('\n')}

YÃŠU Cáº¦U Báº®T BUá»˜C:
1. CHá»ˆ viáº¿t báº±ng tiáº¿ng Viá»‡t, TUYá»†T Äá»I KHÃ”NG dÃ¹ng tá»« tiáº¿ng Anh
2. ${getStyleInstructions(style)}
3. ${getLengthInstructions(length)}
4. Liá»‡t kÃª cá»¥ thá»ƒ tá»«ng loáº¡i vi pháº¡m vÃ  sá»‘ láº§n vi pháº¡m
5. PhÃ¢n tÃ­ch xu hÆ°á»›ng vÃ  má»©c Ä‘á»™ nghiÃªm trá»ng
6. ÄÆ°a ra nháº­n Ä‘á»‹nh vá» Ã½ thá»©c ká»· luáº­t cá»§a há»c sinh
7. Äáº£m báº£o chÃ­nh xÃ¡c 100% dá»±a trÃªn dá»¯ liá»‡u thá»‘ng kÃª Ä‘Ã£ cung cáº¥p
8. KhÃ´ng sá»­ dá»¥ng cÃ¡c tá»« nhÆ°: "performance", "behavior", "discipline" - thay báº±ng "thÃ nh tÃ­ch", "hÃ nh vi", "ká»· luáº­t"

VÃ­ dá»¥ máº«u: "Trong ká»³ bÃ¡o cÃ¡o nÃ y, há»c sinh cÃ³ 3 vi pháº¡m gá»“m: Ä‘i muá»™n (2 láº§n, 4 Ä‘iá»ƒm), khÃ´ng lÃ m bÃ i táº­p (1 láº§n, 2 Ä‘iá»ƒm). Tá»•ng cá»™ng 6 Ä‘iá»ƒm trá»«. Há»c sinh cáº§n cáº£i thiá»‡n Ã½ thá»©c thá»i gian vÃ  trÃ¡ch nhiá»‡m há»c táº­p."

TÃ³m táº¯t chi tiáº¿t tÃ¬nh hÃ¬nh rÃ¨n luyá»‡n:
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
          return `Trong ${reportPeriod.name}, há»c sinh cÃ³ ${violations.length} vi pháº¡m vá»›i tá»•ng ${totalPoints} Ä‘iá»ƒm trá»«.`
        } else {
          return `Trong ${reportPeriod.name}, há»c sinh tuÃ¢n thá»§ tá»‘t ná»™i quy nhÃ  trÆ°á»ng. KhÃ´ng cÃ³ vi pháº¡m nÃ o Ä‘Æ°á»£c ghi nháº­n.`
        }
      }
    } catch (fallbackError) {
      console.error('Fallback discipline summary also failed:', fallbackError)
    }
    
    return 'KhÃ´ng thá»ƒ táº¡o tÃ³m táº¯t tÃ¬nh hÃ¬nh ká»· luáº­t. Vui lÃ²ng thá»­ láº¡i sau.'
  }
}

// Fallback function for basic academic summary
function generateBasicAcademicSummary(feedbackData: Array<{ subject: string; rating: number }>): string {
  const subjects = feedbackData.reduce((acc: Record<string, number[]>, item) => {
    if (!acc[item.subject]) acc[item.subject] = []
    acc[item.subject].push(item.rating)
    return acc
  }, {})

  const summary = 'TÃ¬nh hÃ¬nh há»c táº­p: '
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
    .map(([type, count]) => `${type} (${count} láº§n)`)
    .join(', ')

  return `CÃ³ ${violations.length} vi pháº¡m trong ká»³ bÃ¡o cÃ¡o: ${typeList}. Tá»•ng Ä‘iá»ƒm trá»«: ${totalPoints} Ä‘iá»ƒm.`
}

/**
 * Generate AI-powered strengths summary for student reports
 */
export async function generateAIStrengthsSummary(
  studentId: string,
  reportPeriodId: string,
  style: string = 'friendly',
  length: string = 'medium'
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
      return 'KhÃ´ng cÃ³ dá»¯ liá»‡u Ä‘á»ƒ táº¡o Æ°u Ä‘iá»ƒm trong ká»³ bÃ¡o cÃ¡o nÃ y.'
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
      return 'Há»c sinh cáº§n cá»‘ gáº¯ng hÆ¡n Ä‘á»ƒ cÃ³ nhá»¯ng Ä‘iá»ƒm tÃ­ch cá»±c trong há»c táº­p.'
    }

    // Prepare positive feedback data
    const positiveFeedback = feedback.map((item: FeedbackData) => {
      const subject = Array.isArray(item.subject) ? item.subject[0] : item.subject
      const teacher = Array.isArray(item.teacher) ? item.teacher[0] : item.teacher
      const cleanFeedback = item.feedback_text?.replace(/^\[AI_GENERATED:[^\]]+\]\s*/, '') || ''

      return {
        subject: subject?.name_vietnamese || 'MÃ´n há»c',
        teacher: teacher?.full_name || 'GiÃ¡o viÃªn',
        rating: item.rating,
        comment: cleanFeedback
      }
    })

    const prompt = `
Báº¡n lÃ  má»™t giÃ¡o viÃªn chá»§ nhiá»‡m cÃ³ kinh nghiá»‡m. HÃ£y tÃ³m táº¯t Æ°u Ä‘iá»ƒm cá»§a há»c sinh dá»±a trÃªn pháº£n há»“i tÃ­ch cá»±c tá»« giÃ¡o viÃªn trong ${reportPeriod.name}.

PHáº¢N Há»’I TÃCH Cá»°C:
${positiveFeedback.map(f => `- ${f.subject}: ${f.rating}/5 Ä‘iá»ƒm - ${f.comment}`).join('\n')}

YÃŠU Cáº¦U:
1. Viáº¿t báº±ng tiáº¿ng Viá»‡t, ${getStyleInstructions(style)}
2. ${getLengthInstructions(length)}
3. Táº­p trung vÃ o nhá»¯ng Æ°u Ä‘iá»ƒm ná»•i báº­t nháº¥t
4. Viáº¿t theo cÃ¡ch tÃ­ch cá»±c, khuyáº¿n khÃ­ch
5. Äáº£m báº£o chÃ­nh xÃ¡c dá»±a trÃªn dá»¯ liá»‡u

Æ¯u Ä‘iá»ƒm cá»§a há»c sinh:
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
    return aiSummary || 'Há»c sinh cÃ³ nhá»¯ng Ä‘iá»ƒm tÃ­ch cá»±c trong há»c táº­p cáº§n Ä‘Æ°á»£c ghi nháº­n.'

  } catch (error) {
    console.error('Error generating AI strengths summary:', error)
    return 'KhÃ´ng thá»ƒ táº¡o tÃ³m táº¯t Æ°u Ä‘iá»ƒm. Vui lÃ²ng thá»­ láº¡i sau.'
  }
}

/**
 * Generate AI-powered weaknesses summary for student reports
 */
export async function generateAIWeaknessesSummary(
  studentId: string,
  reportPeriodId: string,
  style: string = 'friendly',
  length: string = 'medium'
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
      return 'KhÃ´ng cÃ³ dá»¯ liá»‡u Ä‘á»ƒ táº¡o khuyáº¿t Ä‘iá»ƒm trong ká»³ bÃ¡o cÃ¡o nÃ y.'
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
      return 'Há»c sinh cáº§n duy trÃ¬ vÃ  phÃ¡t huy nhá»¯ng Ä‘iá»ƒm tá»‘t hiá»‡n táº¡i.'
    }

    // Prepare negative feedback data
    const negativeData = negativeFeedback.map((item: FeedbackData) => {
      const subject = Array.isArray(item.subject) ? item.subject[0] : item.subject
      const cleanFeedback = item.feedback_text?.replace(/^\[AI_GENERATED:[^\]]+\]\s*/, '') || ''

      return {
        subject: subject?.name_vietnamese || 'MÃ´n há»c',
        rating: item.rating,
        comment: cleanFeedback
      }
    })

    const violationData = violations.map((item: ViolationData) => {
      const violationType = Array.isArray(item.violation_type) ? item.violation_type[0] : item.violation_type
      return {
        type: violationType?.name || 'Vi pháº¡m',
        description: item.description || '',
        points: item.points || 0
      }
    })

    const prompt = `
Báº¡n lÃ  má»™t giÃ¡o viÃªn chá»§ nhiá»‡m cÃ³ kinh nghiá»‡m. HÃ£y tÃ³m táº¯t khuyáº¿t Ä‘iá»ƒm cáº§n cáº£i thiá»‡n cá»§a há»c sinh dá»±a trÃªn pháº£n há»“i vÃ  vi pháº¡m trong ${reportPeriod.name}.

PHáº¢N Há»’I Cáº¦N Cáº¢I THIá»†N:
${negativeData.map(f => `- ${f.subject}: ${f.rating}/5 Ä‘iá»ƒm - ${f.comment}`).join('\n')}

VI PHáº M:
${violationData.map(v => `- ${v.type}: ${v.description} (${v.points} Ä‘iá»ƒm)`).join('\n')}

YÃŠU Cáº¦U:
1. Viáº¿t báº±ng tiáº¿ng Viá»‡t, ${getStyleInstructions(style)}
2. ${getLengthInstructions(length)}
3. Táº­p trung vÃ o nhá»¯ng khuyáº¿t Ä‘iá»ƒm cáº§n cáº£i thiá»‡n nháº¥t
4. Viáº¿t theo cÃ¡ch xÃ¢y dá»±ng, khuyáº¿n khÃ­ch cáº£i thiá»‡n
5. Äáº£m báº£o chÃ­nh xÃ¡c dá»±a trÃªn dá»¯ liá»‡u

Khuyáº¿t Ä‘iá»ƒm cáº§n cáº£i thiá»‡n:
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
    return aiSummary || 'Há»c sinh cáº§n cá»‘ gáº¯ng cáº£i thiá»‡n má»™t sá»‘ khÃ­a cáº¡nh trong há»c táº­p vÃ  rÃ¨n luyá»‡n.'

  } catch (error) {
    console.error('Error generating AI weaknesses summary:', error)
    return 'KhÃ´ng thá»ƒ táº¡o tÃ³m táº¯t khuyáº¿t Ä‘iá»ƒm. Vui lÃ²ng thá»­ láº¡i sau.'
  }
}
