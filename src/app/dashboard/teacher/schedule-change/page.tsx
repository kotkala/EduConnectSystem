import { Metadata } from "next"
import TeacherScheduleChangeList from "@/features/schedule-change/components/teacher-schedule-change-list"

export const metadata: Metadata = {
  title: "Đơn Thay Đổi Lịch Dạy | EduConnect",
  description: "Quản lý đơn thay đổi lịch dạy của giáo viên",
}

export default function TeacherScheduleChangePage() {
  return <TeacherScheduleChangeList />
}
