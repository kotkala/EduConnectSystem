"use client"

import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Slider } from "@/shared/components/ui/slider"
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Share,
  AlertTriangle,
  Gauge
} from "lucide-react"
// Import shared components and utilities to eliminate duplication
import { ChatAvatar, formatTime, copyMessage, handleKeyPress } from "./parent-chatbot"
import { ChatHistorySidebar } from "./chat-history-sidebar"
import { FeedbackDialog } from "./feedback-dialog"
import { createConversation, getMessages } from "@/lib/actions/chat-history-actions"

// Type guard for context used
function isContextUsed(contextUsed: unknown): contextUsed is {
  studentsCount: number
  feedbackCount: number
  gradesCount: number
  violationsCount: number
} {
  return contextUsed !== null &&
    typeof contextUsed === 'object' &&
    contextUsed !== undefined &&
    'studentsCount' in contextUsed &&
    'feedbackCount' in contextUsed &&
    'gradesCount' in contextUsed &&
    'violationsCount' in contextUsed
}
import { useChatStreaming } from "./useChatStreaming"

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

interface FullPageChatbotProps {
  readonly className?: string
}

function FullPageChatbot({ className }: FullPageChatbotProps) {
  const { user } = useAuth()
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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  // Get parentId from user context - memoized to prevent reloads
  const parentId = useMemo(() => user?.id || null, [user?.id])

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

  // Use custom hook for chat streaming
  const { sendMessage: sendStreamingMessage } = useChatStreaming({
    messages,
    setMessages,
    setInputMessage,
    setIsLoading,
    setIsStreaming,
    conversationId: currentConversationId,
    parentId: parentId
  })

  // Memoized event handlers for performance
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading || isStreaming) return
    await sendStreamingMessage(inputMessage.trim())
  }, [inputMessage, isLoading, isStreaming, sendStreamingMessage])

  // Handle feedback submission
  const handleFeedbackSubmitted = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, hasFeedback: true } : msg
    ))
  }, [])

  // Removed automatic conversation creation to prevent infinite loop
  // Conversations will be created when user sends first message

  // Chat history handlers with useCallback optimization
  const handleConversationSelect = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId)

    // Load messages for selected conversation
    const result = await getMessages(conversationId)
    if (result.success && result.data) {
      const loadedMessages: Message[] = result.data.map((msg: {
        id: string
        role: 'user' | 'assistant'
        content: string
        created_at: string
        context_used?: Record<string, unknown>
        function_calls: number
        prompt_strength: number
        conversation_id: string
        feedback?: { id: string }[]
      }) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        contextUsed: msg.context_used,
        functionCalls: msg.function_calls,
        promptStrength: msg.prompt_strength,
        conversationId: msg.conversation_id,
        hasFeedback: msg.feedback && msg.feedback.length > 0
      }))
      setMessages(loadedMessages)
    }
  }, [])

  const handleNewConversation = useCallback(async () => {
    if (!user) return

    const result = await createConversation({
      parent_id: user.id,
      title: 'Cuộc trò chuyện mới'
    })

    if (result.success && result.data) {
      setCurrentConversationId(result.data.id)
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn theo dõi tình hình học tập của con em. Hãy hỏi tôi về điểm số, phản hồi từ giáo viên, hoặc bất kỳ thắc mắc nào về việc học của con bạn.',
        timestamp: new Date()
      }])
    }
  }, [user])

  // Memoized suggested prompts for performance
  const suggestedPrompts = useMemo(() => [
    "Điểm số gần đây của con em như thế nào?",
    "Con em có cần cải thiện môn nào không?",
    "Phản hồi từ giáo viên tuần này ra sao?",
    "Con em có tiến bộ gì đáng chú ý không?",
    "Môn nào con em học tốt nhất?",
    "Tôi nên hỗ trợ con em học tập như thế nào?"
  ], [])

  return (
    <div className={`flex h-screen bg-white text-gray-900 ${className}`}>
      {/* Chat History Sidebar - Always visible */}
      {parentId && (
        <div className="w-80 bg-gray-50 flex-shrink-0">
          <ChatHistorySidebar
            parentId={parentId}
            currentConversationId={currentConversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            isOpen={true}
            onClose={() => {}} // Sidebar always visible
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white max-h-[calc(100vh-200px)]">
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
                    {message.role === 'assistant' && isContextUsed(message.contextUsed) && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 text-xs text-blue-700">
                          <Sparkles className="h-3 w-3" />
                          <span>Dựa trên {message.contextUsed.feedbackCount} phản hồi, {message.contextUsed.gradesCount} điểm số</span>
                        </div>
                      </div>
                    )}

                    {/* Prompt strength indicator for assistant messages */}
                    {message.role === 'assistant' && message.promptStrength !== undefined && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 text-xs text-green-700">
                          <Gauge className="h-3 w-3" />
                          <span>Độ mạnh prompt: {(message.promptStrength * 100).toFixed(0)}%</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 ml-2">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${message.promptStrength * 100}%` }}
                            ></div>
                          </div>
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

                      {/* Feedback button for assistant messages */}
                      {message.role === 'assistant' && parentId && !message.hasFeedback && (
                        <FeedbackDialog
                          messageId={message.id}
                          parentId={parentId}
                          userQuestion={messages[messages.findIndex(m => m.id === message.id) - 1]?.content || ''}
                          aiResponse={message.content}
                          onFeedbackSubmitted={() => handleFeedbackSubmitted(message.id)}
                        />
                      )}
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

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">⚠️ LƯU Ý QUAN TRỌNG</h3>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="space-y-2 text-xs text-yellow-800">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Thông tin tham khảo:</p>
                      <p>AI cung cấp thông tin dựa trên dữ liệu có sẵn. Vui lòng liên hệ trực tiếp với giáo viên để có thông tin chính xác nhất.</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-yellow-200">
                    <p className="text-xs">• Dữ liệu được cập nhật định kỳ</p>
                    <p className="text-xs">• Phản hồi của bạn giúp cải thiện AI</p>
                    <p className="text-xs">• Bảo mật thông tin được đảm bảo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export memoized component for performance optimization
export default memo(FullPageChatbot)
