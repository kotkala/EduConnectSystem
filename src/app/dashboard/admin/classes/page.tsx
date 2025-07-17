import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ClassesTable } from '@/components/admin/classes-table'

export default function ClassesPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin">
          <Button variant="outline">Quay lại Dashboard</Button>
        </Link>
        <h1 className="text-2xl font-bold">Quản lý Lớp học</h1>
      </div>
      <ClassesTable />
    </div>
  )
} 