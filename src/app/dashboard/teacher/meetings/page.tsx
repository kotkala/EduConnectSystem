import { Metadata } from "next";
import TeacherMeetingsPage from "@/features/meetings/components/teacher-meetings/teacher-meetings-page";

export const metadata: Metadata = {
  title: "Há»p Phá»¥ Huynh",
  description: "Quáº£n lÃ½ lá»‹ch há»p phá»¥ huynh cho lá»›p chá»§ nhiá»‡m",
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
