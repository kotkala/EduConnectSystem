import { createMessage } from "./parent-chatbot"
import {
  prepareConversationHistory,
  createStreamRequest,
  validateStreamResponse,
  processStream,
  finalizeMessage,
  handleStreamError
} from "./chat-utils"
import { saveMessage } from "@/lib/actions/chat-history-actions"

// Types for the hook
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  contextUsed?: {
    studentsCount: number
    feedbackCount: number
    gradesCount: number
    violationsCount: number
  } | Record<string, unknown>
  functionCalls?: number
  promptStrength?: number
  conversationId?: string
  hasFeedback?: boolean
}

interface UseChatStreamingProps {
  messages: Message[]
  setMessages: (updater: (prev: Message[]) => Message[]) => void
  setInputMessage: (value: string) => void
  setIsLoading: (value: boolean) => void
  setIsStreaming: (value: boolean) => void
  conversationId?: string | null
  parentId?: string | null
}

interface UseChatStreamingReturn {
  sendMessage: (inputMessage: string) => Promise<void>
}

// Helper function to calculate prompt strength based on context and function calls
function calculatePromptStrength(
  contextUsed?: {
    studentsCount: number
    feedbackCount: number
    gradesCount: number
    violationsCount: number
  } | Record<string, unknown>,
  functionCalls?: number
): number {
  if (!contextUsed) return 0.3 // Base strength without context

  // Check if contextUsed has the expected structure
  if ('studentsCount' in contextUsed &&
      'feedbackCount' in contextUsed &&
      'gradesCount' in contextUsed &&
      'violationsCount' in contextUsed) {
    const { studentsCount, feedbackCount, gradesCount, violationsCount } = contextUsed as {
      studentsCount: number
      feedbackCount: number
      gradesCount: number
      violationsCount: number
    }
    const totalDataPoints = feedbackCount + gradesCount + violationsCount
    const functionCallBonus = (functionCalls || 0) * 0.1

    // Calculate strength based on available data
    let strength = 0.3 // Base strength

    if (studentsCount > 0) strength += 0.1
    if (totalDataPoints > 0) strength += Math.min(totalDataPoints * 0.02, 0.4)
    if (functionCalls && functionCalls > 0) strength += Math.min(functionCallBonus, 0.2)

    return Math.min(strength, 1.0) // Cap at 100%
  }

  return 0.3 // Default strength for unknown context structure
}

// Custom hook for chat streaming functionality
export function useChatStreaming({
  messages,
  setMessages,
  setInputMessage,
  setIsLoading,
  setIsStreaming,
  conversationId,
  parentId
}: UseChatStreamingProps): UseChatStreamingReturn {

  const sendMessage = async (inputMessage: string): Promise<void> => {
    // Early return for invalid input or loading states
    if (!inputMessage.trim()) return

    // Prepare user message and update state
    const userMessage = createMessage('user', inputMessage.trim())
    const messageText = inputMessage.trim()

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setIsStreaming(true)

    try {
      // Prepare conversation history for API
      const conversationHistory = prepareConversationHistory(messages)

      // Create and validate stream request
      const response = await createStreamRequest(messageText, conversationHistory)
      const reader = validateStreamResponse(response)

      // Create initial assistant message
      const assistantMessageId = crypto.randomUUID()
      setMessages(prev => [...prev, createMessage('assistant', '', undefined, assistantMessageId)])

      // Process the entire stream
      const { accumulatedText, contextUsed, functionCalls } = await processStream(reader, assistantMessageId, setMessages)

      // Calculate prompt strength based on context and function calls
      const promptStrength = calculatePromptStrength(contextUsed || undefined, functionCalls)

      // Final update with context information
      finalizeMessage(assistantMessageId, accumulatedText, contextUsed, setMessages)

      // Save messages to database if conversation and parent IDs are available
      if (conversationId && parentId) {
        // Save user message with its ID
        await saveMessage({
          id: userMessage.id,
          conversation_id: conversationId,
          role: 'user',
          content: messageText,
          function_calls: 0,
          prompt_strength: 0
        })

        // Save assistant message with its ID
        await saveMessage({
          id: assistantMessageId,
          conversation_id: conversationId,
          role: 'assistant',
          content: accumulatedText,
          context_used: contextUsed || undefined,
          function_calls: functionCalls || 0,
          prompt_strength: promptStrength
        })
      }

    } catch (error) {
      // Handle any errors that occur during streaming
      handleStreamError(error, setMessages)
    } finally {
      // Always cleanup loading states
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  return { sendMessage }
}
