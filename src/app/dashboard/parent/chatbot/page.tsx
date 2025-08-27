import { Metadata } from 'next'
import FullPageChatbot from '@/features/parent-dashboard/components/parent-chatbot/full-page-chatbot'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Bot } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Trợ Lý AI - EduConnect',
  description: 'Trợ lý AI thông minh hỗ trợ phụ huynh theo dõi tình hình học tập của con em',
}

export default function ChatbotPage() {
  return (
    <ContentLayout title="Trợ lý AI" role="parent">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Trợ lý AI</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="space-y-8">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Trợ Lý AI
              </h1>
              <p className="text-gray-600 mt-1">
                Trợ lý AI thông minh hỗ trợ phụ huynh theo dõi tình hình học tập của con em
              </p>
            </div>
          </div>
        </div>

            {/* Chatbot Content */}
            <div className="overflow-hidden">
              <FullPageChatbot />
            </div>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
