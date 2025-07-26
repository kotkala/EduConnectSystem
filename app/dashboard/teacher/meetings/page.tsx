import { Metadata } from "next";
import { SidebarLayout } from "@/components/dashboard/sidebar-layout";
import TeacherMeetingsPage from "@/components/teacher-meetings/teacher-meetings-page";

export const metadata: Metadata = {
  title: "Họp Phụ Huynh",
  description: "Quản lý lịch họp phụ huynh cho lớp chủ nhiệm",
};

export default function TeacherMeetingsPageRoute() {
  return (
    <SidebarLayout role="teacher" title="Họp Phụ Huynh">
      <div className="flex flex-1 flex-col gap-4">
        <TeacherMeetingsPage />
      </div>
    </SidebarLayout>
  );
}
