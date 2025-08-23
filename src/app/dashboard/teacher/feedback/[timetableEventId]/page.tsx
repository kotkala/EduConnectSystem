import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeacherFeedbackForm } from "@/features/teacher-management/components/feedback/teacher-feedback-form";
import { 
  getTimetableEventForFeedbackAction,
  checkFeedbackEditPermissionAction,
  getEventFeedbackAction
} from "@/features/teacher-management/actions/teacher-feedback-actions";

interface PageProps {
  params: Promise<{
    timetableEventId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { timetableEventId } = await params;
  const eventResult = await getTimetableEventForFeedbackAction(timetableEventId);
  
  if (!eventResult.success || !eventResult.data) {
    return {
      title: "Phản Hồi Học Sinh",
      description: "Tạo phản hồi cho học sinh"
    };
  }

  const event = eventResult.data;
  return {
    title: `Phản Hồi - ${event.subject_name} - ${event.class_name}`,
    description: `Tạo phản hồi cho học sinh lớp ${event.class_name} môn ${event.subject_name}`
  };
}

export default async function TeacherFeedbackPage({ params }: Readonly<PageProps>) {
  const { timetableEventId } = await params;

  // Get timetable event details
  const eventResult = await getTimetableEventForFeedbackAction(timetableEventId);
  
  if (!eventResult.success || !eventResult.data) {
    notFound();
  }

  // Check edit permissions
  const permissionResult = await checkFeedbackEditPermissionAction(timetableEventId);

  if (!permissionResult.success) {
    notFound();
  }

  // Get existing feedback if any
  const feedbackResult = await getEventFeedbackAction(timetableEventId);

  const event = eventResult.data;
  const permission = permissionResult.data!;
  const existingFeedback = feedbackResult.success ? feedbackResult.data : [];

  const getDayName = (dayOfWeek: number) => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return days[dayOfWeek] || 'Không xác định';
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Phản Hồi Học Sinh
          </h1>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              <strong>Môn học:</strong> {event.subject_name} ({event.subject_code})
            </div>
            <div>
              <strong>Lớp:</strong> {event.class_name}
            </div>
            <div>
              <strong>Thời gian:</strong> {getDayName(event.day_of_week)}, {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </div>
            <div>
              <strong>Ngày học:</strong> {new Date(event.actual_lesson_date).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div>
              <strong>Tuần:</strong> {event.week_number}, {event.semester_name} ({event.academic_year_name})
            </div>
          </div>
        </div>

        {/* Time Limit Warning */}
        {!permission.canEdit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-sm font-medium">Hết thời gian chỉnh sửa</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Bạn chỉ có thể tạo hoặc chỉnh sửa phản hồi trong vòng 24 giờ sau khi kết thúc tiết học.
            </p>
          </div>
        )}

        {permission.canEdit && permission.timeRemaining && permission.timeRemaining > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="text-sm font-medium">Thời gian còn lại</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Bạn còn {Math.floor(permission.timeRemaining / 60)} giờ {permission.timeRemaining % 60} phút để tạo hoặc chỉnh sửa phản hồi.
            </p>
          </div>
        )}

        {/* Feedback Form */}
        <TeacherFeedbackForm
          timetableEvent={event}
          existingFeedback={existingFeedback || []}
          canEdit={permission.canEdit}
          hasExistingFeedback={permission.hasExistingFeedback}
        />
      </div>
    </div>
  );
}
