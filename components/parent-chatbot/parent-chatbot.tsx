"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Send,
  User,
  Sparkles,
  Clock,
  X,
  Minimize2,
  Maximize2,
  MessageCircle,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

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

interface ParentChatbotProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onMinimize: () => void
  readonly isMinimized: boolean
  readonly mode?: 'floating' | 'page'
}

// Reusable ChatAvatar component to eliminate duplication
interface ChatAvatarProps {
  readonly role: 'user' | 'assistant' | 'system'
  readonly size?: 'sm' | 'md' | 'lg'
  readonly showOnlineStatus?: boolean
}

export function ChatAvatar({ role, size = 'md', showOnlineStatus = false }: ChatAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const bgColors = {
    user: 'bg-blue-500 text-white',
    assistant: 'bg-purple-500 text-white',
    system: 'bg-blue-500 text-white'
  }

  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={role === 'assistant' ? "/logo.png" : undefined} alt="Avatar" />
        <AvatarFallback className={bgColors[role]}>
          {role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      {showOnlineStatus && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  )
}

// Helper function to create messages and eliminate duplication
export function createMessage(
  role: 'user' | 'assistant',
  content: string,
  contextUsed?: Message['contextUsed'],
  id?: string
): Message {
  return {
    id: id || Date.now().toString(),
    role,
    content,
    timestamp: new Date(),
    ...(contextUsed && { contextUsed })
  }
}

// Shared utility functions to eliminate duplication
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function copyMessage(content: string): void {
  navigator.clipboard.writeText(content)
  toast.success('Đã sao chép tin nhắn')
}

export function handleKeyPress(e: React.KeyboardEvent, sendMessage: () => void): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

export default function ParentChatbot({
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
  mode = 'floating'
}: ParentChatbotProps) {
  const [showFloatingChat, setShowFloatingChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn theo dõi tình hình học tập của con em. Hãy hỏi tôi về điểm số, phản hồi từ giáo viên, hoặc bất kỳ thắc mắc nào về việc học của con bạn.',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isStreaming) return

    const userMessage = createMessage('user', inputMessage.trim())
    const messageText = inputMessage.trim()

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setIsStreaming(true)

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        content: msg.content
      }))

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

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      let accumulatedText = ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let contextUsed: any = null
      let functionCalls = 0

      // Create initial assistant message
      const assistantMessageId = Date.now().toString()
      setMessages(prev => [...prev, createMessage('assistant', '', undefined, assistantMessageId)])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'text') {
                accumulatedText += data.data

                // Update the assistant message in real-time
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedText }
                    : msg
                ))
              } else if (data.type === 'function_results') {
                functionCalls = data.data.length
              } else if (data.type === 'complete') {
                contextUsed = data.data.contextUsed
                functionCalls = data.data.functionCalls || functionCalls
              } else if (data.type === 'error') {
                throw new Error(data.data.message)
              }
            } catch (parseError) {
              console.error('Error parsing chunk:', parseError)
            }
          }
        }
      }

      // Final update with context information
      if (contextUsed) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedText, contextUsed }
            : msg
        ))
      }

    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.')

      const errorMessage = createMessage('assistant', 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau ít phút.')
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    handleKeyPress(e, sendMessage)
  }

  if (!isOpen) return null

  // Floating chatbot design (new compact design)
  if (mode === 'floating') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {/* Floating Chat Bubble */}
        <div className="relative">
          {/* Main Chat Bubble - only show when expanded */}
          {showFloatingChat && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-3 max-w-sm">
            <div className="flex items-start space-x-3">
              <ChatAvatar role="assistant" size="md" showOnlineStatus={true} />

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">EduConnect AI</h3>
                  <span className="text-xs text-green-600 font-medium">● Đang hoạt động</span>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  Con em học lớp 10A1 có điểm kiểm tra môn Toán chưa a?
                </p>

                <div className="bg-blue-500 text-white rounded-lg p-2 text-sm">
                  Điểm kiểm tra Toán của em Nguyễn Văn A lớp 10A1: 8.5 điểm. Bài kiểm tra ngày 15/11/2024.
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Xem lịch sử
                </Button>

                <Link href="/dashboard/parent/chatbot">
                  <Button
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Mở rộng
                  </Button>
                </Link>
              </div>
            </div>
            </div>
          )}

          {/* Floating Chat Icon */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowFloatingChat(!showFloatingChat)}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full h-12 w-12 p-0 shadow-lg"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Original full chatbot design
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-96 shadow-2xl border-2 transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}>
        {/* Header */}
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Trợ Lý AI</CardTitle>
                <p className="text-xs text-blue-100">Hỗ trợ phụ huynh 24/7</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(600px-80px)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <ChatAvatar role={message.role} size="sm" />
                    
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Context info for assistant messages */}
                      {message.role === 'assistant' && message.contextUsed && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <Sparkles className="h-3 w-3" />
                            <span>Dựa trên {message.contextUsed.feedbackCount} phản hồi, {message.contextUsed.gradesCount} điểm số, {message.contextUsed.violationsCount} vi phạm</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {(isLoading && !isStreaming) && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <ChatAvatar role="assistant" size="sm" />
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming indicator */}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <ChatAvatar role="assistant" size="sm" />
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Đang trả lời...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về tình hình học tập của con em..."
                  disabled={isLoading || isStreaming}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || isStreaming}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick suggestions */}
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  "Điểm số gần đây của con",
                  "Phản hồi từ giáo viên",
                  "Môn nào cần cải thiện?",
                  "Tiến bộ tuần này"
                ].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 text-xs"
                    onClick={() => setInputMessage(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
