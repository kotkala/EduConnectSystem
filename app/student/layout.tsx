import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentNav } from './(components)/student-nav'

export default async function StudentLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/pending-approval')
  if (profile.role !== 'student') redirect('/dashboard')

  return (
    <div className="min-h-svh bg-background">
      {/* Top pills navigation for student section */}
      <StudentNav />
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-4 md:px-6">
        {children}
      </div>
    </div>
  )
}


