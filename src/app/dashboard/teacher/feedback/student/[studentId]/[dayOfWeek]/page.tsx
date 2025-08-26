import { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudentDayFeedbackDetail } from "@/features/grade-management/components/homeroom-feedback/student-day-feedback-detail";

interface PageProps {
  readonly params: Promise<{
    readonly studentId: string;
    readonly dayOfWeek: string;
  }>;
  readonly searchParams: Promise<{
    readonly academic_year_id?: string;
    readonly semester_id?: string;
    readonly week_number?: string;
    readonly student_name?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const dayNames = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const dayName = dayNames[parseInt(resolvedParams.dayOfWeek)] || 'Không xác định';
  const studentName = resolvedSearchParams.student_name || 'Học sinh';

  return {
    title: `Phản hồi ${studentName} - ${dayName}`,
    description: `Xem chi tiết phản hồi học tập của ${studentName} trong ngày ${dayName}`,
  };
}

export default async function StudentDayFeedbackPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Validate parameters
  const dayOfWeek = parseInt(resolvedParams.dayOfWeek);
  if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    notFound();
  }

  if (!resolvedSearchParams.academic_year_id || !resolvedSearchParams.semester_id || !resolvedSearchParams.week_number) {
    notFound();
  }

  const filters = {
    academic_year_id: resolvedSearchParams.academic_year_id,
    semester_id: resolvedSearchParams.semester_id,
    week_number: parseInt(resolvedSearchParams.week_number),
  };

  return (
    <div className="p-6">
      <div className="flex flex-1 flex-col gap-4">
        <StudentDayFeedbackDetail
          studentId={resolvedParams.studentId}
          dayOfWeek={dayOfWeek}
          filters={filters}
          studentName={resolvedSearchParams.student_name}
        />
      </div>
    </div>
  );
}
