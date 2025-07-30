import { Metadata } from 'next'
import FullPageChatbot from '@/components/parent-chatbot/full-page-chatbot'

export const metadata: Metadata = {
  title: 'Trợ Lý AI - EduConnect',
  description: 'Trợ lý AI thông minh hỗ trợ phụ huynh theo dõi tình hình học tập của con em',
}

export default function ChatbotPage() {
  return (
    <div className="flex-1 flex flex-col">
      <FullPageChatbot />
    </div>
  )
}
