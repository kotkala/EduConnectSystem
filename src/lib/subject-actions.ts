'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SubjectFormData, SubjectUpdateFormData } from './validations'
import { Subject } from './types'

/**
 * Server Actions for subject management following Next.js 15 patterns
 * Direct Supabase client usage with proper error handling
 */

export async function createSubjectAction(formData: SubjectFormData) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { subject: null, error: 'Authentication required' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { subject: null, error: 'Admin access required' }
  }

  // Check if subject code already exists
  const { data: existingSubject } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', formData.code)
    .single()

  if (existingSubject) {
    return { subject: null, error: 'Subject code already exists' }
  }

  // Create the subject
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      code: formData.code,
      name_vietnamese: formData.name_vietnamese,
      name_english: formData.name_english,
      category: formData.category,
      description: formData.description || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating subject:', error)
    return { subject: null, error: 'Không thể tạo môn học' }
  }

  revalidatePath('/dashboard/admin/subjects')
  return { subject: data, error: null }
}

export async function updateSubjectAction(formData: SubjectUpdateFormData) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { subject: null, error: 'Authentication required' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { subject: null, error: 'Admin access required' }
  }

  // Check if subject exists
  const { data: existingSubject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', formData.id)
    .single()

  if (!existingSubject) {
    return { subject: null, error: 'Subject not found' }
  }

  // Check if code is being changed and if new code already exists
  if (formData.code && formData.code !== existingSubject.code) {
    const { data: codeExists } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', formData.code)
      .neq('id', formData.id)
      .single()

    if (codeExists) {
      return { subject: null, error: 'Subject code already exists' }
    }
  }

  // Prepare update data (only include fields that are provided)
  const updateData: Partial<Subject> = {}
  if (formData.code !== undefined) updateData.code = formData.code
  if (formData.name_vietnamese !== undefined) updateData.name_vietnamese = formData.name_vietnamese
  if (formData.name_english !== undefined) updateData.name_english = formData.name_english
  if (formData.category !== undefined) updateData.category = formData.category
  if (formData.description !== undefined) updateData.description = formData.description || null

  // Update the subject
  const { data, error } = await supabase
    .from('subjects')
    .update(updateData)
    .eq('id', formData.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating subject:', error)
    return { subject: null, error: 'Failed to update subject' }
  }

  revalidatePath('/dashboard/admin/subjects')
  return { subject: data, error: null }
}

export async function deleteSubjectAction(subjectId: string) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Admin access required' }
  }

  // Check if subject exists
  const { data: existingSubject } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .single()

  if (!existingSubject) {
    return { success: false, error: 'Subject not found' }
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('subjects')
    .update({ is_active: false })
    .eq('id', subjectId)

  if (error) {
    console.error('Error deleting subject:', error)
    return { success: false, error: 'Failed to delete subject' }
  }

  revalidatePath('/dashboard/admin/subjects')
  return { success: true, error: null }
}

export async function getSubjectsAction() {
  const supabase = await createClient()

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name_vietnamese', { ascending: true })

  if (error) {
    console.error('Error fetching subjects:', error)
    return { subjects: [], error: 'Không thể lấy danh sách môn học' }
  }

  return { subjects: subjects || [], error: null }
}

export async function getSubjectByIdAction(subjectId: string) {
  const supabase = await createClient()

  const { data: subject, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching subject:', error)
    return { subject: null, error: 'Subject not found' }
  }

  return { subject, error: null }
}
