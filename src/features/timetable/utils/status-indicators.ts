/**
 * Hệ thống chỉ báo trạng thái cho các tiết học
 * Cung cấp các chỉ báo trạng thái trực quan với mô tả rõ ràng
 */

export type EventStatus = 'scheduled' | 'current' | 'completed' | 'needs_feedback';

export interface StatusIndicator {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

export const STATUS_INDICATORS: Record<EventStatus, StatusIndicator> = {
  scheduled: {
    label: 'Sắp diễn ra',
    description: 'Tiết học chưa bắt đầu',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  },
  current: {
    label: 'Đang diễn ra',
    description: 'Tiết học đang diễn ra',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  completed: {
    label: 'Đã hoàn thành',
    description: 'Tiết học đã kết thúc',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  needs_feedback: {
    label: 'Cần phản hồi',
    description: 'Tiết học đã kết thúc, cần tạo phản hồi',
    color: 'text-red-700',
    bgColor: 'bg-red-100'
  }
};

/**
 * Hàm hỗ trợ xác định trạng thái phản hồi
 */
function getFeedbackStatus(feedbackInfo?: {
  feedbackCount: number;
  totalStudents: number;
  hasFeedback: boolean;
}): EventStatus {
  if (!feedbackInfo) return 'completed';

  if (!feedbackInfo.hasFeedback || feedbackInfo.feedbackCount < feedbackInfo.totalStudents) {
    return 'needs_feedback';
  } else {
    return 'completed';
  }
}

/**
 * Xác định trạng thái tiết học dựa trên thời gian và thông tin phản hồi
 */
export function getEventStatus(
  eventDate: Date,
  startTime: string,
  endTime: string,
  hasSubstitute: boolean = false,
  hasExchange: boolean = false,
  feedbackInfo?: {
    feedbackCount: number;
    totalStudents: number;
    hasFeedback: boolean;
  }
): EventStatus {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  // Các tiết học trong tương lai
  if (eventDay > today) {
    return 'scheduled';
  }

  // Các tiết học trong quá khứ
  if (eventDay < today) {
    return getFeedbackStatus(feedbackInfo);
  }

  // Các tiết học hôm nay - kiểm tra thời gian
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const eventStart = new Date(eventDate);
  eventStart.setHours(startHour, startMinute, 0, 0);

  const eventEnd = new Date(eventDate);
  eventEnd.setHours(endHour, endMinute, 0, 0);

  if (now >= eventStart && now <= eventEnd) {
    return 'current';
  } else if (now < eventStart) {
    return 'scheduled';
  } else {
    return getFeedbackStatus(feedbackInfo);
  }
}

/**
 * Lấy thông tin chỉ báo trạng thái
 */
export function getStatusIndicator(status: EventStatus): StatusIndicator {
  return STATUS_INDICATORS[status];
}

/**
 * Lấy tất cả chỉ báo trạng thái để hiển thị trong hướng dẫn
 */
export function getAllStatusIndicators(): StatusIndicator[] {
  return Object.values(STATUS_INDICATORS);
}
