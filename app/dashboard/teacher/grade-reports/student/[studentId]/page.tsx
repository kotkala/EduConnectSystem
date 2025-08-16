import { Metadata } from "next";
import { TeacherStudentGradeDetailClient } from "./teacher-student-grade-detail-client";

export const metadata: Metadata = {
  title: "Chi tiết điểm học sinh",
  description: "Xem chi tiết điểm số và tạo đánh giá cho học sinh",
};

interface PageProps {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function TeacherStudentGradeDetailPage({ params }: PageProps) {
  const { studentId } = await params;

  return (
    <div className="p-6">
      <TeacherStudentGradeDetailClient studentId={studentId} />
    </div>
  );
}
