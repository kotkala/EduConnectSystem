import { Metadata } from "next";
import { HomeroomFeedbackDashboard } from "@/features/grade-management/components/homeroom-feedback/homeroom-feedback-dashboard";
import { TeacherPageTemplate } from "@/shared/components/dashboard/teacher-page-template";

export const metadata: Metadata = {
  title: "Phản Hồi Học Sinh",
  description: "Xem phản hồi học tập của học sinh trong lớp chủ nhiệm",
};

export default function HomeroomFeedbackPage() {
  return (
    <TeacherPageTemplate
      title="Phản hồi học sinh"
      description="Xem phản hồi học tập của học sinh trong lớp chủ nhiệm"
      showCard={true}
    >
      <div className="flex flex-1 flex-col gap-4">
        <HomeroomFeedbackDashboard />
      </div>
    </TeacherPageTemplate>
  );
}
