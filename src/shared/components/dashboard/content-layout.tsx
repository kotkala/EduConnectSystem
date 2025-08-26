import { Navbar } from "@/shared/components/dashboard/navbar"
import { UserRole } from "@/lib/types"

interface ContentLayoutProps {
  title: string
  children: React.ReactNode
  role: UserRole
}

export function ContentLayout({ title, children, role }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} role={role} />
      <div className="container pt-8 pb-8 px-4 sm:px-8">{children}</div>
    </div>
  )
}
