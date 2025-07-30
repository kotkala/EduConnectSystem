import { Metadata } from "next";
import { SidebarLayout } from "@/components/dashboard/sidebar-layout";
import ParentFeedbackDashboard from "@/components/parent-feedback/parent-feedback-dashboard";

export const metadata: Metadata = {
  title: "Phản Hồi Học Tập",
  description: "Xem phản hồi học tập của con em từ giáo viên",
};

export default function ParentFeedbackPage() {
  return (
    <SidebarLayout role="parent" title="Phản Hồi Học Tập">
      <div className="flex flex-1 flex-col gap-4">
        <ParentFeedbackDashboard />
      </div>
    </SidebarLayout>
  );
}
