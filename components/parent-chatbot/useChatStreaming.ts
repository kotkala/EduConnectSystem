import { createMessage } from "./parent-chatbot"
import {
  prepareConversationHistory,
  createStreamRequest,
  validateStreamResponse,
  processStream,
  finalizeMessage,
  handleStreamError
} from "./chat-utils"

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
  }
}

interface UseChatStreamingProps {
  messages: Message[]
  setMessages: (updater: (prev: Message[]) => Message[]) => void
  setInputMessage: (value: string) => void
  setIsLoading: (value: boolean) => void
  setIsStreaming: (value: boolean) => void
}

interface UseChatStreamingReturn {
  sendMessage: (inputMessage: string) => Promise<void>
}

// Custom hook for chat streaming functionality
export function useChatStreaming({
  messages,
  setMessages,
  setInputMessage,
  setIsLoading,
  setIsStreaming
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
      const assistantMessageId = Date.now().toString()
      setMessages(prev => [...prev, createMessage('assistant', '', undefined, assistantMessageId)])

      // Process the entire stream
      const { accumulatedText, contextUsed } = await processStream(reader, assistantMessageId, setMessages)

      // Final update with context information
      finalizeMessage(assistantMessageId, accumulatedText, contextUsed, setMessages)

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
