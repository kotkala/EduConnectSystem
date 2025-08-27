'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas following Context7 patterns
const createConversationSchema = z.object({
  title: z.string().optional(),
  parent_id: z.string().uuid()
})

const createMessageSchema = z.object({
  id: z.string().uuid().optional(),
  conversation_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Content is required'),
  context_used: z.record(z.string(), z.unknown()).optional(),
  function_calls: z.number().int().min(0).default(0),
  prompt_strength: z.number().min(0).max(1).default(0)
})

const createFeedbackSchema = z.object({
  message_id: z.string().uuid(),
  parent_id: z.string().uuid(),
  is_helpful: z.boolean(),
  rating: z.enum(['excellent', 'good', 'average', 'poor', 'very_poor']),
  comment: z.string().optional(),
  user_question: z.string().min(1),
  ai_response: z.string().min(1)
})

const searchMessagesSchema = z.object({
  query: z.string().min(1),
  parent_id: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(20)
})

// Types for chat history
export interface ChatConversation {
  id: string
  parent_id: string
  title: string | null
  created_at: string
  updated_at: string
  is_archived: boolean
  message_count?: number
  last_message?: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  context_used?: Record<string, unknown>
  function_calls: number
  prompt_strength: number
  created_at: string
  updated_at: string
  feedback?: ChatFeedback
}

export interface ChatFeedback {
  id: string
  message_id: string
  parent_id: string
  is_helpful: boolean
  rating: 'excellent' | 'good' | 'average' | 'poor' | 'very_poor'
  comment?: string
  user_question: string
  ai_response: string
  created_at: string
  updated_at: string
}

// Create new conversation
export async function createConversation(data: z.infer<typeof createConversationSchema>) {
  try {
    const validatedData = createConversationSchema.parse(data)
    const supabase = await createClient()

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        parent_id: validatedData.parent_id,
        title: validatedData.title || 'Cuộc trò chuyện mới'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return { success: false, error: error.message }
    }

    // Don't revalidate path to prevent sidebar reload during chat
    // revalidatePath('/parent/chatbot')
    return { success: true, data: conversation }
  } catch (error) {
    console.error('Create conversation error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Save message to conversation
export async function saveMessage(data: z.infer<typeof createMessageSchema>) {
  try {
    const validatedData = createMessageSchema.parse(data)
    const supabase = await createClient()

    const insertData: Record<string, unknown> = {
      conversation_id: validatedData.conversation_id,
      role: validatedData.role,
      content: validatedData.content,
      context_used: validatedData.context_used,
      function_calls: validatedData.function_calls,
      prompt_strength: validatedData.prompt_strength
    }

    // If ID is provided, use it; otherwise let database generate one
    if (validatedData.id) {
      insertData.id = validatedData.id
    }

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error saving message:', error)
      return { success: false, error: error.message }
    }

    // Update conversation updated_at
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', validatedData.conversation_id)

    // Don't revalidate path to prevent sidebar reload during chat
    // revalidatePath('/parent/chatbot')
    return { success: true, data: message }
  } catch (error) {
    console.error('Save message error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get conversations for parent
export async function getConversations(parentId: string, limit = 20) {
  try {
    const supabase = await createClient()

    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select(`
        id,
        parent_id,
        title,
        created_at,
        updated_at,
        is_archived
      `)
      .eq('parent_id', parentId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching conversations:', error)
      return { success: false, error: error.message }
    }

    // Optimized: Get message stats in a single query to avoid N+1 problem
    const conversationIds = conversations.map(c => c.id)

    // Get message counts for all conversations at once
    const { data: messageCounts } = await supabase
      .from('chat_messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .then(async (result) => {
        if (result.data) {
          const counts = result.data.reduce((acc: Record<string, number>, msg: { conversation_id: string }) => {
            acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1
            return acc
          }, {})
          return { data: counts }
        }
        return { data: {} }
      })

    // Get last messages for all conversations at once
    const { data: lastMessages } = await supabase
      .from('chat_messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .then(async (result) => {
        if (result.data) {
          const lastMsgs = result.data.reduce((acc: Record<string, string>, msg: { conversation_id: string; content: string; created_at: string }) => {
            if (!acc[msg.conversation_id]) {
              acc[msg.conversation_id] = msg.content?.substring(0, 100) || ''
            }
            return acc
          }, {})
          return { data: lastMsgs }
        }
        return { data: {} }
      })

    // Combine data efficiently
    const conversationsWithStats = conversations.map((conv) => ({
      ...conv,
      message_count: messageCounts?.[conv.id] || 0,
      last_message: lastMessages?.[conv.id] || ''
    }))

    return { success: true, data: conversationsWithStats }
  } catch (error) {
    console.error('Get conversations error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get messages for conversation
export async function getMessages(conversationId: string) {
  try {
    const supabase = await createClient()

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        conversation_id,
        role,
        content,
        context_used,
        function_calls,
        prompt_strength,
        created_at,
        updated_at,
        feedback:chat_feedback(
          id,
          is_helpful,
          rating,
          comment,
          created_at
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: messages }
  } catch (error) {
    console.error('Get messages error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Submit feedback for AI message
export async function submitFeedback(data: z.infer<typeof createFeedbackSchema>) {
  try {
    const validatedData = createFeedbackSchema.parse(data)
    const supabase = await createClient()

    // Check if message exists in database before submitting feedback
    const { data: messageExists, error: checkError } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('id', validatedData.message_id)
      .single()

    if (checkError || !messageExists) {
      return {
        success: false,
        error: 'Không thể gửi phản hồi cho tin nhắn chưa được lưu. Vui lòng thử lại sau.'
      }
    }

    const { data: feedback, error } = await supabase
      .from('chat_feedback')
      .insert({
        message_id: validatedData.message_id,
        parent_id: validatedData.parent_id,
        is_helpful: validatedData.is_helpful,
        rating: validatedData.rating,
        comment: validatedData.comment,
        user_question: validatedData.user_question,
        ai_response: validatedData.ai_response
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting feedback:', error)
      return { success: false, error: error.message }
    }

    // Don't revalidate path to prevent sidebar reload during chat
    // revalidatePath('/parent/chatbot')
    return { success: true, data: feedback }
  } catch (error) {
    console.error('Submit feedback error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Search messages
export async function searchMessages(data: z.infer<typeof searchMessagesSchema>) {
  try {
    const validatedData = searchMessagesSchema.parse(data)
    const supabase = await createClient()

    // First get conversation IDs for the parent
    const { data: conversations, error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('parent_id', validatedData.parent_id)

    if (convError) {
      console.error('Error fetching conversations:', convError)
      return { success: false, error: convError.message }
    }

    const conversationIds = conversations.map(conv => conv.id)

    if (conversationIds.length === 0) {
      return { success: true, data: [] }
    }

    // Then search messages in those conversations
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        conversation_id,
        role,
        content,
        created_at,
        conversation:chat_conversations(
          id,
          title,
          created_at
        )
      `)
      .textSearch('content', validatedData.query)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(validatedData.limit)

    if (error) {
      console.error('Error searching messages:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: messages }
  } catch (error) {
    console.error('Search messages error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Archive conversation
export async function archiveConversation(conversationId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('chat_conversations')
      .update({ is_archived: true })
      .eq('id', conversationId)

    if (error) {
      console.error('Error archiving conversation:', error)
      return { success: false, error: error.message }
    }

    // Don't revalidate path to prevent sidebar reload during chat
    // revalidatePath('/parent/chatbot')
    return { success: true }
  } catch (error) {
    console.error('Archive conversation error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
