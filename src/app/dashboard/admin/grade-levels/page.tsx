import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GradeLevelsTable } from '@/components/admin/grade-levels-table'

export default function GradeLevelsPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
        <h1 className="text-2xl font-bold">Grade Levels Management</h1>
      </div>
      <GradeLevelsTable />
    </div>
  )
} 