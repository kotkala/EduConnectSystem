import { Metadata } from "next";
import { ParentMeetingSchedules } from "@/components/parent-dashboard/parent-meeting-schedules";

export const metadata: Metadata = {
  title: "Meeting Schedules",
  description: "View meeting schedules from homeroom teachers",
};

export default function ParentMeetingSchedulesPage() {
  return (
    <div className="p-6">
      <div className="flex flex-1 flex-col gap-4">
        <ParentMeetingSchedules />
      </div>
    </div>
  );
}
