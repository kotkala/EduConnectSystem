import { Metadata } from "next"
import AdminScheduleChangeManagement from "@/features/schedule-change/components/admin-schedule-change-management"
import { AdminPageTemplate } from "@/shared/components/dashboard/admin-page-template"

export const metadata: Metadata = {
  title: "Quản Lý Đơn Thay Đổi Lịch Dạy | EduConnect",
  description: "Quản lý và duyệt đơn thay đổi lịch dạy của giáo viên",
}

export default function AdminScheduleChangePage() {
  return (
    <AdminPageTemplate
      title="Thay đổi lịch học"
      description="Quản lý các yêu cầu thay đổi lịch học"
      showCard={false}
    >
      <AdminScheduleChangeManagement />
    </AdminPageTemplate>
  )
}
