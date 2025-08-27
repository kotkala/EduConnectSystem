import { Metadata } from "next";
import TeacherMeetingsPage from "@/features/meetings/components/teacher-meetings/teacher-meetings-page";
import { TeacherPageTemplate } from "@/shared/components/dashboard/teacher-page-template";

export const metadata: Metadata = {
  title: "Họp Phụ Huynh",
  description: "Quản lý lịch họp phụ huynh cho lớp chủ nhiệm",
};

export default function TeacherMeetingsPageRoute() {
  return (
    <TeacherPageTemplate
      title="Họp phụ huynh"
      description="Quản lý lịch họp phụ huynh cho lớp chủ nhiệm"
      showCard={true}
    >
      <div className="flex flex-1 flex-col gap-4">
        <TeacherMeetingsPage />
      </div>
    </TeacherPageTemplate>
  );
}
