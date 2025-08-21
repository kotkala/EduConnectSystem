/**
 * Feedback status utilities for timetable events
 * Handles fetching and calculating feedback completion status
 */

import { createClient } from "@/lib/supabase/client";

export interface FeedbackInfo {
  feedbackCount: number;
  totalStudents: number;
  hasFeedback: boolean;
}

/**
 * Get feedback information for a specific timetable event
 */
export async function getFeedbackInfo(
  timetableEventId: string,
  classId: string
): Promise<FeedbackInfo | null> {
  try {
    const supabase = createClient();

    // Get feedback count for this timetable event
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('student_feedback')
      .select('id, student_id')
      .eq('timetable_event_id', timetableEventId);

    if (feedbackError) {
      console.error('Error fetching feedback data:', feedbackError);
      return null;
    }

    // Get total number of students in the class
    const { data: studentsData, error: studentsError } = await supabase
      .from('class_assignments')
      .select('user_id')
      .eq('class_id', classId)
      .eq('assignment_type', 'student')
      .eq('is_active', true);

    if (studentsError) {
      console.error('Error fetching students data:', studentsError);
      return null;
    }

    const feedbackCount = feedbackData?.length || 0;
    const totalStudents = studentsData?.length || 0;
    const hasFeedback = feedbackCount > 0;

    return {
      feedbackCount,
      totalStudents,
      hasFeedback
    };
  } catch (error) {
    console.error('Error getting feedback info:', error);
    return null;
  }
}

/**
 * Get feedback information for multiple timetable events (batch operation)
 * This is more efficient than calling getFeedbackInfo multiple times
 */
export async function getBatchFeedbackInfo(
  timetableEventIds: string[],
  classIds: string[]
): Promise<Map<string, FeedbackInfo>> {
  const feedbackMap = new Map<string, FeedbackInfo>();

  if (timetableEventIds.length === 0) {
    return feedbackMap;
  }

  try {
    const supabase = createClient();

    // Get feedback counts for all timetable events
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('student_feedback')
      .select('timetable_event_id, student_id')
      .in('timetable_event_id', timetableEventIds);

    if (feedbackError) {
      console.error('Error fetching batch feedback data:', feedbackError);
      return feedbackMap;
    }

    // Get student counts for all classes
    const uniqueClassIds = [...new Set(classIds)];
    const { data: studentsData, error: studentsError } = await supabase
      .from('class_assignments')
      .select('class_id, user_id')
      .in('class_id', uniqueClassIds)
      .eq('assignment_type', 'student')
      .eq('is_active', true);

    if (studentsError) {
      console.error('Error fetching batch students data:', studentsError);
      return feedbackMap;
    }

    // Create class -> student count mapping
    const classStudentCounts = new Map<string, number>();
    studentsData?.forEach(student => {
      const count = classStudentCounts.get(student.class_id) || 0;
      classStudentCounts.set(student.class_id, count + 1);
    });

    // Create timetable event -> feedback count mapping
    const eventFeedbackCounts = new Map<string, number>();
    feedbackData?.forEach(feedback => {
      const count = eventFeedbackCounts.get(feedback.timetable_event_id) || 0;
      eventFeedbackCounts.set(feedback.timetable_event_id, count + 1);
    });

    // Build final feedback info map
    timetableEventIds.forEach((eventId, index) => {
      const classId = classIds[index];
      const feedbackCount = eventFeedbackCounts.get(eventId) || 0;
      const totalStudents = classStudentCounts.get(classId) || 0;
      const hasFeedback = feedbackCount > 0;

      feedbackMap.set(eventId, {
        feedbackCount,
        totalStudents,
        hasFeedback
      });
    });

    return feedbackMap;
  } catch (error) {
    console.error('Error getting batch feedback info:', error);
    return feedbackMap;
  }
}

/**
 * Calculate feedback completion percentage
 */
export function getFeedbackCompletionPercentage(feedbackInfo: FeedbackInfo): number {
  if (feedbackInfo.totalStudents === 0) return 0;
  return Math.round((feedbackInfo.feedbackCount / feedbackInfo.totalStudents) * 100);
}
