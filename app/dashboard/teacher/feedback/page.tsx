import { Metadata } from "next";
import { SidebarLayout } from "@/components/dashboard/sidebar-layout";
import { HomeroomFeedbackDashboard } from "@/components/homeroom-feedback/homeroom-feedback-dashboard";

export const metadata: Metadata = {
  title: "Phản Hồi Học Sinh",
  description: "Xem phản hồi học tập của học sinh trong lớp chủ nhiệm",
};

export default function HomeroomFeedbackPage() {
  return (
    <SidebarLayout role="teacher" title="Phản Hồi Học Sinh">
      <div className="flex flex-1 flex-col gap-4">
        <HomeroomFeedbackDashboard />
      </div>
    </SidebarLayout>
  );
}
