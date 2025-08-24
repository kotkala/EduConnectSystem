import { Metadata } from "next"
import TeacherScheduleChangeForm from "@/features/schedule-change/components/teacher-schedule-change-form"

export const metadata: Metadata = {
  title: "Tạo Đơn Thay Đổi Lịch Dạy | EduConnect",
  description: "Tạo đơn yêu cầu thay đổi lịch dạy",
}

export default function CreateScheduleChangePage() {
  return <TeacherScheduleChangeForm />
}
