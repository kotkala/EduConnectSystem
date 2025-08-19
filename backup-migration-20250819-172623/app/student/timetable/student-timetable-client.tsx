'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  Clock
} from 'lucide-react'

export function StudentTimetableClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Thời khóa biểu
          </h1>
          <p className="text-muted-foreground">
            Xem thời khóa biểu lớp học của bạn
          </p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Thời khóa biểu học sinh
          </CardTitle>
          <CardDescription>
            Chức năng xem thời khóa biểu cá nhân
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chức năng đang phát triển</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Chúng tôi đang hoàn thiện chức năng xem thời khóa biểu cá nhân.
              Tính năng này sẽ sớm được cập nhật để bạn có thể xem lịch học của mình một cách dễ dàng.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Sắp có:</strong> Xem thời khóa biểu theo tuần, lọc theo môn học,
                và nhận thông báo về thay đổi lịch học.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
