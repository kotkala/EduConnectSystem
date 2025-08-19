import { redirect } from 'next/navigation'

export default function StudentNotificationsPage() {
  // Student portal moved to /student. Redirect old link.
  redirect('/student/notifications')
}
