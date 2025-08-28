"use client"
import { Loader2 } from 'lucide-react'


import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"

import { Badge } from "@/shared/components/ui/badge"

import {
  Search,
  History,
  MessageCircle,
  Clock,
  Archive,
  Plus,
  X
} from "lucide-react"
import { toast } from "sonner"
import { 
  getConversations, 
  searchMessages, 
  archiveConversation,
  type ChatConversation 
} from "@/lib/actions/chat-history-actions"

interface ChatHistorySidebarProps {
  readonly parentId: string
  readonly currentConversationId?: string | null
  readonly onConversationSelect: (conversationId: string) => void
  readonly onNewConversation: () => void
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function ChatHistorySidebar({
  parentId,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  isOpen,
  onClose
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    id: string
    conversation_id: string
    role: string
    content: string
    created_at: string
    conversation?: { id: string; title: string; created_at: string }
  }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadConversations = useCallback(async () => {
    if (hasLoaded) return // Prevent multiple loads
    setIsLoading(true)
    try {
      const result = await getConversations(parentId, 50)
      if (result.success && result.data) {
        setConversations(result.data)
        setHasLoaded(true)
      } else {
        toast.error('Không thể tải lịch sử chat')
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Có lỗi xảy ra khi tải lịch sử')
    } finally {
      setIsLoading(false)
    }
  }, [parentId, hasLoaded])

  // Load conversations - fixed to prevent infinite reload loop
  useEffect(() => {
    if (isOpen && parentId && !hasLoaded) {
      loadConversations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, parentId, hasLoaded]) // Load only once when conditions are met

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const result = await searchMessages({
        query: searchQuery.trim(),
        parent_id: parentId,
        limit: 20
      })

      if (result.success && result.data) {
        // Transform the data to match our expected type
        const transformedResults = result.data.map((item: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at: string
          conversation: { id: string; title: string; created_at: string } | { id: string; title: string; created_at: string }[]
        }) => ({
          id: item.id,
          conversation_id: item.conversation_id,
          role: item.role,
          content: item.content,
          created_at: item.created_at,
          conversation: Array.isArray(item.conversation) ? item.conversation[0] : item.conversation
        }))
        setSearchResults(transformedResults)
      } else {
        toast.error('Không thể tìm kiếm tin nhắn')
      }
    } catch (error) {
      console.error('Error searching messages:', error)
      toast.error('Có lỗi xảy ra khi tìm kiếm')
    } finally {
      setIsSearching(false)
    }
  }, [parentId, searchQuery])

  const handleArchive = async (conversationId: string) => {
    try {
      const result = await archiveConversation(conversationId)
      if (result.success) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        toast.success('Đã lưu trữ cuộc trò chuyện')
      } else {
        toast.error('Không thể lưu trữ cuộc trò chuyện')
      }
    } catch (error) {
      console.error('Error archiving conversation:', error)
      toast.error('Có lỗi xảy ra')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
    }
  }

  // Render conversation content to avoid nested ternary
  const renderConversationContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )
    }

    if (conversations.length > 0) {
      return (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative p-3 rounded-lg transition-colors ${
                conversation.id === currentConversationId
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <button
                type="button"
                className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {conversation.title || 'Cuộc trò chuyện'}
                    </div>
                    {conversation.last_message && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {conversation.last_message}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <MessageCircle className="h-3 w-3" />
                        <span>{conversation.message_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(conversation.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleArchive(conversation.id)
                }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Archive className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="h-8 md:h-9 lg:h-10 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
        <p className="text-xs mt-1">Bắt đầu chat để tạo lịch sử</p>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">Lịch sử chat</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="flex space-x-2">
          <Input
            placeholder="Tìm kiếm tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4 border-b">
        <Button 
          onClick={onNewConversation}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cuộc trò chuyện mới
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 h-[calc(100vh-200px)] overflow-y-auto">
        <div className="p-4">
          {searchQuery.trim() && searchResults.length > 0 && (
            /* Search Results */
            <>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Kết quả tìm kiếm ({searchResults.length})
              </h3>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="w-full text-left p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => onConversationSelect(result.conversation_id)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {result.conversation?.title || 'Cuộc trò chuyện'}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {result.content}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {result.role === 'user' ? 'Bạn' : 'AI'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(result.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
            /* No Search Results */
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 md:h-9 lg:h-10 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Không tìm thấy kết quả</p>
              <p className="text-xs mt-1">Thử từ khóa khác</p>
            </div>
          )}

          {!searchQuery.trim() && (
            /* Conversation List */
            renderConversationContent()
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Lịch sử chat được lưu trữ an toàn
        </div>
      </div>
    </div>
  )
}
