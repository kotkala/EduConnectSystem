import { Metadata } from "next";
import ParentFeedbackDashboard from "@/components/parent-feedback/parent-feedback-dashboard";

export const metadata: Metadata = {
  title: "Phản Hồi Học Tập",
  description: "Xem phản hồi học tập của con em từ giáo viên",
};

export default function ParentFeedbackPage() {
  return (
    <div className="p-6">
      <div className="flex flex-1 flex-col gap-4">
        <ParentFeedbackDashboard />
      </div>
    </div>
  );
}
