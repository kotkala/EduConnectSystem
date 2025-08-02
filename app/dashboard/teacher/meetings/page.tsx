import { Metadata } from "next";
import TeacherMeetingsPage from "@/components/teacher-meetings/teacher-meetings-page";

export const metadata: Metadata = {
  title: "Họp Phụ Huynh",
  description: "Quản lý lịch họp phụ huynh cho lớp chủ nhiệm",
};

export default function TeacherMeetingsPageRoute() {
  return (
    <div className="p-6">
      <div className="flex flex-1 flex-col gap-4">
        <TeacherMeetingsPage />
      </div>
    </div>
  );
}
