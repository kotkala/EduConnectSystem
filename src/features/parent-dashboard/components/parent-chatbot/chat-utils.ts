import { toast } from "sonner"
import { createMessage } from "./parent-chatbot"

// Types for chat utilities
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

interface ConversationHistoryItem {
  role: 'user' | 'model'
  content: string
}

interface StreamData {
  type: 'text' | 'function_results' | 'complete' | 'error'
  data: {
    message?: string
    length?: number
    contextUsed?: {
      studentsCount: number
      feedbackCount: number
      gradesCount: number
      violationsCount: number
    }
    functionCalls?: number
  } | string | number
}

// Helper function to prepare conversation history for API
export function prepareConversationHistory(messages: Message[]): ConversationHistoryItem[] {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    content: msg.content
  }))
}

// Helper function to create stream request
export async function createStreamRequest(messageText: string, conversationHistory: ConversationHistoryItem[]): Promise<Response> {
  const response = await fetch('/api/chatbot/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: messageText,
      history: conversationHistory
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get response')
  }

  return response
}

// Helper function to validate stream response and get reader
export function validateStreamResponse(response: Response): ReadableStreamDefaultReader<Uint8Array> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response stream')
  }
  return reader
}

// Helper function to process individual stream chunk
export function processStreamChunk(line: string): StreamData | null {
  if (line.startsWith('data: ')) {
    try {
      return JSON.parse(line.slice(6))
    } catch (parseError) {
      console.error('Error parsing chunk:', parseError)
      return null
    }
  }
  return null
}

// Helper functions to reduce complexity in handleStreamData
function handleTextData(data: StreamData, accumulatedText: string, assistantMessageId: string, setMessages: (updater: (prev: Message[]) => Message[]) => void): string {
  const newAccumulatedText = accumulatedText + (typeof data.data === 'string' ? data.data : '')

  // Update the assistant message in real-time, or create it if it doesn't exist
  setMessages(prev => {
    const existingMessageIndex = prev.findIndex(msg => msg.id === assistantMessageId)

    if (existingMessageIndex >= 0) {
      // Update existing message
      return prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: newAccumulatedText }
          : msg
      )
    } else {
      // Create new assistant message if it doesn't exist (first text chunk)
      return [...prev, createMessage('assistant', newAccumulatedText, undefined, assistantMessageId)]
    }
  })

  return newAccumulatedText
}

function handleFunctionResultsData(data: StreamData): number {
  return typeof data.data === 'object' && data.data && 'length' in data.data ? data.data.length as number : 0
}

function handleCompleteData(data: StreamData, functionCalls: number): { contextUsed: Message['contextUsed'] | null; functionCalls: number } {
  let contextUsed: Message['contextUsed'] | null = null
  let newFunctionCalls = functionCalls

  if (typeof data.data === 'object' && data.data) {
    contextUsed = 'contextUsed' in data.data ? data.data.contextUsed as Message['contextUsed'] : null
    newFunctionCalls = 'functionCalls' in data.data ? data.data.functionCalls as number || functionCalls : functionCalls
  }

  return { contextUsed, functionCalls: newFunctionCalls }
}

function handleErrorData(data: StreamData): never {
  const errorMessage = typeof data.data === 'object' && data.data && 'message' in data.data
    ? data.data.message as string
    : 'Unknown error'
  throw new Error(errorMessage)
}

// Helper function to handle different stream data types
export function handleStreamData(
  data: StreamData,
  accumulatedText: string,
  assistantMessageId: string,
  setMessages: (updater: (prev: Message[]) => Message[]) => void
): {
  newAccumulatedText: string
  contextUsed: Message['contextUsed'] | null
  functionCalls: number
} {
  let newAccumulatedText = accumulatedText
  let contextUsed: Message['contextUsed'] | null = null
  let functionCalls = 0

  if (data.type === 'text') {
    newAccumulatedText = handleTextData(data, accumulatedText, assistantMessageId, setMessages)
  } else if (data.type === 'function_results') {
    functionCalls = handleFunctionResultsData(data)
  } else if (data.type === 'complete') {
    const result = handleCompleteData(data, functionCalls)
    contextUsed = result.contextUsed
    functionCalls = result.functionCalls
  } else if (data.type === 'error') {
    handleErrorData(data)
  }

  return { newAccumulatedText, contextUsed, functionCalls }
}

// Helper function to finalize message with context information
export function finalizeMessage(
  assistantMessageId: string,
  accumulatedText: string,
  contextUsed: Message['contextUsed'] | null,
  setMessages: (updater: (prev: Message[]) => Message[]) => void
): void {
  if (contextUsed) {
    setMessages(prev => prev.map(msg =>
      msg.id === assistantMessageId
        ? { ...msg, content: accumulatedText, contextUsed }
        : msg
    ))
  }
}

// Helper function to handle stream errors
export function handleStreamError(
  error: unknown,
  setMessages: (updater: (prev: Message[]) => Message[]) => void
): void {
  console.error('Chat error:', error)
  toast.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.')

  const errorMessage = createMessage('assistant', 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau ít phút.')
  setMessages(prev => [...prev, errorMessage])
}

// Helper function to process stream chunk lines
async function processStreamLines(
  lines: string[],
  accumulatedText: string,
  assistantMessageId: string,
  setMessages: (updater: (prev: Message[]) => Message[]) => void,
  contextUsed: Message['contextUsed'] | null,
  functionCalls: number
): Promise<{ accumulatedText: string; contextUsed: Message['contextUsed'] | null; functionCalls: number }> {
  let newAccumulatedText = accumulatedText
  let newContextUsed = contextUsed
  let newFunctionCalls = functionCalls

  for (const line of lines) {
    const data = processStreamChunk(line)
    if (data) {
      const result = handleStreamData(data, newAccumulatedText, assistantMessageId, setMessages)
      newAccumulatedText = result.newAccumulatedText
      if (result.contextUsed) newContextUsed = result.contextUsed
      if (result.functionCalls) newFunctionCalls = result.functionCalls
    }
  }

  return { accumulatedText: newAccumulatedText, contextUsed: newContextUsed, functionCalls: newFunctionCalls }
}

// Helper function to process the entire stream
export async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  assistantMessageId: string,
  setMessages: (updater: (prev: Message[]) => Message[]) => void
): Promise<{ accumulatedText: string; contextUsed: Message['contextUsed'] | null; functionCalls: number }> {
  let accumulatedText = ''
  let contextUsed: Message['contextUsed'] | null = null
  let functionCalls = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = new TextDecoder().decode(value)
    const lines = chunk.split('\n')

    const result = await processStreamLines(lines, accumulatedText, assistantMessageId, setMessages, contextUsed, functionCalls)
    accumulatedText = result.accumulatedText
    contextUsed = result.contextUsed
    functionCalls = result.functionCalls
  }

  return { accumulatedText, contextUsed, functionCalls }
}
