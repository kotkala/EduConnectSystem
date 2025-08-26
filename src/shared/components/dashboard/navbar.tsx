import { UserNav } from "@/shared/components/dashboard/user-nav"
import { SheetMenu } from "@/shared/components/dashboard/sheet-menu"
import { AcademicYearSelector } from "@/features/admin-management/components/admin/academic-year-selector"
import { UserRole } from "@/lib/types"

interface NavbarProps {
  title: string
  role: UserRole
}

export function Navbar({ title, role }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu role={role} />
          <h1 className="font-bold">{title}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {role === 'admin' && <AcademicYearSelector />}
          <UserNav role={role} />
        </div>
      </div>
    </header>
  )
}
