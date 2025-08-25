import { Metadata } from "next"
import AdminScheduleChangeManagement from "@/features/schedule-change/components/admin-schedule-change-management"

export const metadata: Metadata = {
  title: "Quản Lý Đơn Thay Đổi Lịch Dạy | EduConnect",
  description: "Quản lý và duyệt đơn thay đổi lịch dạy của giáo viên",
}

export default function AdminScheduleChangePage() {
  return <AdminScheduleChangeManagement />
}
