import Link from "next/link"
import Image from "next/image"
import { MenuIcon } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Menu } from "@/shared/components/dashboard/menu"
import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetTitle
} from "@/shared/components/ui/sheet"
import { UserRole } from "@/lib/types"

interface SheetMenuProps {
  role: UserRole
}

export function SheetMenu({ role }: SheetMenuProps) {
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden" asChild>
        <Button className="h-8" variant="outline" size="icon">
          <MenuIcon size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader>
          <Button
            className="flex justify-center items-center pb-2 pt-1"
            variant="link"
            asChild
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  src="/Edu icon.svg"
                  alt="EduConnect"
                  width={16}
                  height={16}
                  className="size-4"
                />
              </div>
              <SheetTitle className="font-bold text-lg">EduConnect</SheetTitle>
            </Link>
          </Button>
        </SheetHeader>
        <Menu isOpen={true} role={role} />
      </SheetContent>
    </Sheet>
  )
}
