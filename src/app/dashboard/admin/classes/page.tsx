import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ClassesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 mb-4">
        <Link href="/dashboard/admin">
          <Button variant="outline">Back to Admin Dashboard</Button>
        </Link>
      </div>
      <div className="text-lg">Classes management coming soon...</div>
    </div>
  )
} 