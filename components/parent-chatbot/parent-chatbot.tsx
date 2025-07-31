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
  }
}

interface ParentChatbotProps {
  isOpen: boolean
  onClose: () => void
  onMinimize: () => void
  isMinimized: boolean
  mode?: 'floating' | 'page'
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
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          conversationHistory
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          contextUsed: data.contextUsed
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau ít phút.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
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
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/logo.png" alt="EduConnect AI" />
                  <AvatarFallback className="bg-blue-500 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

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
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-purple-500 text-white'
                      }`}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
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
                            <span>Dựa trên {message.contextUsed.feedbackCount} phản hồi, {message.contextUsed.gradesCount} điểm số</span>
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
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-purple-500 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
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
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Hỏi về tình hình học tập của con em..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
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
