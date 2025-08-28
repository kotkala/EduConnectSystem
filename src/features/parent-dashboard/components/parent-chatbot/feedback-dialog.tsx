'use client'

import { Loader2 } from 'lucide-react'
import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group"
import { Switch } from "@/shared/components/ui/switch"
import { 
  ThumbsUp, 
  ThumbsDown, 
  Star,
  MessageSquare,
  Send,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { submitFeedback } from "@/lib/actions/chat-history-actions"


interface FeedbackDialogProps {
  messageId: string
  parentId: string
  userQuestion: string
  aiResponse: string
  onFeedbackSubmitted?: () => void
  disabled?: boolean
}

const ratingOptions = [
  { value: 'excellent', label: 'Tuyệt vời', icon: '⭐⭐⭐⭐⭐', color: 'text-green-600' },
  { value: 'good', label: 'Tốt', icon: '⭐⭐⭐⭐', color: 'text-blue-600' },
  { value: 'average', label: 'Trung bình', icon: '⭐⭐⭐', color: 'text-yellow-600' },
  { value: 'poor', label: 'Kém', icon: '⭐⭐', color: 'text-orange-600' },
  { value: 'very_poor', label: 'Rất kém', icon: '⭐', color: 'text-red-600' }
] as const

export function FeedbackDialog({
  messageId,
  parentId,
  userQuestion,
  aiResponse,
  onFeedbackSubmitted,
  disabled = false
}: Readonly<FeedbackDialogProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHelpful, setIsHelpful] = useState<boolean>(true)
  const [rating, setRating] = useState<string>('good')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Vui lòng chọn mức độ đánh giá')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitFeedback({
        message_id: messageId,
        parent_id: parentId,
        is_helpful: isHelpful,
        rating: rating as 'excellent' | 'good' | 'average' | 'poor' | 'very_poor',
        comment: comment.trim() || undefined,
        user_question: userQuestion,
        ai_response: aiResponse
      })

      if (result.success) {
        toast.success('Cảm ơn bạn đã đánh giá! Phản hồi của bạn giúp chúng tôi cải thiện AI.')
        setIsOpen(false)
        onFeedbackSubmitted?.()
        
        // Reset form
        setIsHelpful(true)
        setRating('good')
        setComment('')
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi gửi đánh giá')
      }
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast.error('Có lỗi xảy ra khi gửi đánh giá')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 md:h-9 lg:h-10 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title={disabled ? "Đang lưu tin nhắn..." : "Đánh giá câu trả lời"}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Đánh giá
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Đánh giá câu trả lời của AI</span>
          </DialogTitle>
          <DialogDescription>
            Phản hồi của bạn giúp chúng tôi cải thiện chất lượng trợ lý AI để phục vụ bạn tốt hơn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Helpful Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Câu trả lời có hữu ích không?</Label>
              <p className="text-xs text-gray-500">
                Thông tin có giúp ích cho việc theo dõi con em của bạn?
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <ThumbsDown className={`h-4 w-4 ${!isHelpful ? 'text-red-500' : 'text-gray-400'}`} />
              <Switch
                checked={isHelpful}
                onCheckedChange={setIsHelpful}
              />
              <ThumbsUp className={`h-4 w-4 ${isHelpful ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
          </div>

          {/* Rating Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mức độ đánh giá</Label>
            <RadioGroup value={rating} onValueChange={setRating} className="grid grid-cols-1 gap-2">
              {ratingOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className={`flex items-center space-x-2 cursor-pointer flex-1 ${option.color}`}
                  >
                    <span className="text-base">{option.icon}</span>
                    <span className="font-medium text-sm">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Nhận xét thêm (tùy chọn)
            </Label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ thêm về trải nghiệm của bạn với trợ lý AI..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[60px] max-h-[120px] resize-none text-sm"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/500 ký tự
            </p>
          </div>

          {/* Preview Section - Compact */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Xem trước đánh giá</span>
            </div>
            <div className="text-xs space-y-1">
              <p><span className="font-medium">Hữu ích:</span> {isHelpful ? 'Có' : 'Không'}</p>
              <p><span className="font-medium">Đánh giá:</span> {ratingOptions.find(r => r.value === rating)?.label}</p>
              {comment.trim() && (
                <p className="break-words"><span className="font-medium">Nhận xét:</span> {comment.trim().length > 50 ? `${comment.trim().substring(0, 50)}...` : comment.trim()}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !rating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Gửi đánh giá
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
