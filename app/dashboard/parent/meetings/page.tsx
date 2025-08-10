import { Metadata } from "next";
import { SidebarLayout } from "@/components/dashboard/sidebar-layout";
import { ParentMeetingSchedules } from "@/components/parent-dashboard/parent-meeting-schedules";

export const metadata: Metadata = {
  title: "Lịch họp phụ huynh",
  description: "Xem lịch họp từ giáo viên chủ nhiệm",
};

export default function ParentMeetingSchedulesPage() {
  return (
    <SidebarLayout role="parent" title="Lịch họp phụ huynh">
      <ParentMeetingSchedules />
    </SidebarLayout>
  );
}
