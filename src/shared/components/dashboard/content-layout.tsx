import { Navbar } from "@/shared/components/dashboard/navbar"
import { UserRole } from "@/lib/types"

interface ContentLayoutProps {
  readonly title: string
  readonly children: React.ReactNode
  readonly role: UserRole
}

export function ContentLayout({ title, children, role }: Readonly<ContentLayoutProps>) {
  return (
    <div>
      <Navbar title={title} role={role} />
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 pt-8 pb-8">{children}</div>
    </div>
  )
}
