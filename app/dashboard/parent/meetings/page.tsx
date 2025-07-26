import { Metadata } from "next";
import { SidebarLayout } from "@/components/dashboard/sidebar-layout";
import { ParentMeetingSchedules } from "@/components/parent-dashboard/parent-meeting-schedules";

export const metadata: Metadata = {
  title: "Meeting Schedules",
  description: "View meeting schedules from homeroom teachers",
};

export default function ParentMeetingSchedulesPage() {
  return (
    <SidebarLayout role="parent" title="Meeting Schedules">
      <div className="flex flex-1 flex-col gap-4">
        <ParentMeetingSchedules />
      </div>
    </SidebarLayout>
  );
}
