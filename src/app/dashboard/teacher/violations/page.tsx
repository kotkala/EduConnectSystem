import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import TeacherViolationsPageClient from './teacher-violations-page-client'

export default async function TeacherViolationsPage() {
  try {
    const supabase = await createClient()

    // Context7 pattern: Proper error handling for auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      redirect('/')
    }

    // Context7 pattern: Better error handling for profile query with homeroom check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, homeroom_enabled')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      redirect('/dashboard')
    }

    if (!profile || profile.role !== 'teacher') {
      redirect('/dashboard')
    }

    // Context7 pattern: Check if teacher has homeroom enabled
    if (!profile.homeroom_enabled) {
      // Teacher exists but homeroom is not enabled
      return (
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Vi pháº¡m há»c sinh</h1>
                <p className="text-muted-foreground">Báº£ng Ä‘iá»u khiá»ƒn giÃ¡o viÃªn</p>
              </div>
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">YÃªu cáº§u quyá»n GVCN</h2>
                <p className="text-muted-foreground mb-4">
                  Chá»‰ giÃ¡o viÃªn chá»§ nhiá»‡m má»›i cÃ³ thá»ƒ xem vÃ  quáº£n lÃ½ vi pháº¡m há»c sinh.
                </p>
                <p className="text-sm text-muted-foreground">
                  Náº¿u báº¡n tin Ä‘Ã¢y lÃ  nháº§m láº«n, vui lÃ²ng liÃªn há»‡ quáº£n trá»‹ viÃªn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Context7 pattern: Check for assigned homeroom class
    const { data: homeroomClass, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('homeroom_teacher_id', user.id)
      .single()

    if (classError) {
      console.error('Class query error:', classError)
      // Teacher is homeroom enabled but no class assigned yet
    }

    // Teacher is homeroom enabled
    const isHomeroomTeacher = profile.homeroom_enabled

    return (
      <div className="p-6">
        <Suspense fallback={<div>Äang táº£i...</div>}>
          <TeacherViolationsPageClient
            homeroomClass={homeroomClass}
            isHomeroomTeacher={isHomeroomTeacher}
            user={user}
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Page error:', error)
    // Context7 pattern: Graceful error handling
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Lá»—i káº¿t ná»‘i</h2>
            <p className="text-muted-foreground mb-4">
              KhÃ´ng thá»ƒ káº¿t ná»‘i cÆ¡ sá»Ÿ dá»¯ liá»‡u. Vui lÃ²ng kiá»ƒm tra Internet vÃ  thá»­ láº¡i.
            </p>
            <p className="text-sm text-muted-foreground">
              Vui lÃ²ng táº£i láº¡i trang Ä‘á»ƒ thá»­ láº¡i.
            </p>
          </div>
        </div>
      </div>
    )
  }
}
