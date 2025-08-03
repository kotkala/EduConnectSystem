"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Share
} from "lucide-react"
import { toast } from "sonner"

// Import shared components and utilities to eliminate duplication
import { ChatAvatar, createMessage, formatTime, copyMessage, handleKeyPress } from "./parent-chatbot"

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

interface FullPageChatbotProps {
  readonly className?: string
}

export default function FullPageChatbot({ className }: FullPageChatbotProps) {
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
  const [fontSize, setFontSize] = useState([14]) // Font size setting

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

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



  // Suggested prompts for parents
  const suggestedPrompts = [
    "Điểm số gần đây của con em như thế nào?",
    "Con em có cần cải thiện môn nào không?",
    "Phản hồi từ giáo viên tuần này ra sao?",
    "Con em có tiến bộ gì đáng chú ý không?",
    "Môn nào con em học tốt nhất?",
    "Tôi nên hỗ trợ con em học tập như thế nào?"
  ]

  return (
    <div className={`flex h-screen bg-white text-gray-900 ${className}`}>
      {/* Main Content - No separate sidebar, use existing layout */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Trợ Lý AI EduConnect</h2>
              </div>
              <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                ● Đang hoạt động
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suggested Prompts */}
          {messages.length === 1 && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">💡 Gợi ý câu hỏi:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={`prompt-${prompt.slice(0, 20)}-${index}`}
                    variant="outline"
                    className="text-left justify-start h-auto p-3 text-sm text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => setInputMessage(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <div className="flex items-start space-x-4">
                  <ChatAvatar role={message.role} size="sm" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {message.role === 'user' ? 'Bạn' : 'EduConnect AI'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    <div className="prose max-w-none">
                      <p
                        className="text-gray-800 whitespace-pre-wrap leading-relaxed"
                        style={{ fontSize: `${fontSize[0]}px` }}
                      >
                        {message.content}
                      </p>
                    </div>
                    
                    {/* Context info for assistant messages */}
                    {message.role === 'assistant' && message.contextUsed && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 text-xs text-blue-700">
                          <Sparkles className="h-3 w-3" />
                          <span>Dựa trên {message.contextUsed.feedbackCount} phản hồi, {message.contextUsed.gradesCount} điểm số</span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.content)}
                        className="h-6 px-2 text-xs text-gray-600 hover:text-gray-900"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {(isLoading && !isStreaming) && (
              <div className="flex items-start space-x-4">
                <ChatAvatar role="assistant" size="sm" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">EduConnect AI</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex items-start space-x-4">
                <ChatAvatar role="assistant" size="sm" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">EduConnect AI</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Đang trả lời...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, sendMessage)}
                  placeholder="Hỏi về tình hình học tập của con em..."
                  disabled={isLoading || isStreaming}
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || isStreaming}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Settings */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">⚙️ CÀI ĐẶT HIỂN THỊ</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="font-size-slider" className="text-xs font-medium text-gray-600">Kích cỡ chữ</label>
                    <span className="text-xs text-gray-600">{fontSize[0]}px</span>
                  </div>
                  <Slider
                    id="font-size-slider"
                    value={fontSize}
                    onValueChange={setFontSize}
                    max={20}
                    min={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Nhỏ</span>
                    <span>Vừa</span>
                    <span>Lớn</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">📋 THÔNG TIN</h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-medium">EduConnect AI</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phiên bản:</span>
                    <span className="font-medium">2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trạng thái:</span>
                    <span className="font-medium text-green-600">● Hoạt động</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">💡 HƯỚNG DẪN</h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="space-y-2 text-xs text-blue-700">
                  <p>• Hỏi về điểm số và thành tích học tập</p>
                  <p>• Xem phản hồi từ giáo viên</p>
                  <p>• Theo dõi tiến bộ của con em</p>
                  <p>• Nhận tư vấn hỗ trợ học tập</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
