'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { createClient } from '@/shared/utils/supabase/client'

export function useHomeroomTeacher() {
  const { user, profile } = useAuth()
  const [isHomeroomTeacher, setIsHomeroomTeacher] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkHomeroomStatus = async () => {
      if (!user || !profile || profile.role !== 'teacher') {
        setIsHomeroomTeacher(false)
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Check if teacher has homeroom_enabled flag
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('homeroom_enabled')
          .eq('id', user.id)
          .single()

        setIsHomeroomTeacher(!!teacherProfile?.homeroom_enabled)
      } catch (error) {
        console.error('Error checking homeroom status:', error)
        setIsHomeroomTeacher(false)
      } finally {
        setLoading(false)
      }
    }

    checkHomeroomStatus()
  }, [user, profile])

  return { isHomeroomTeacher, loading }
}
