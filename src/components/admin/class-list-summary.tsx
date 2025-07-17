'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, Layers } from 'lucide-react'

interface Class {
  id: string
  name: string
  code: string
  is_combined: boolean
  capacity: number
  grade_level: {
    name: string
    level: number
  }
  metadata?: {
    subject_group_name?: string
    subject_group_code?: string
  }
}

interface ClassListSummaryProps {
  classes: Class[]
}

export function ClassListSummary({ classes }: ClassListSummaryProps) {
  const baseClasses = classes.filter(c => !c.is_combined)
  const combinedClasses = classes.filter(c => c.is_combined)
  
  // Group by grade level
  const classesByGrade = classes.reduce((acc, cls) => {
    const gradeLevel = cls.grade_level.level
    if (!acc[gradeLevel]) {
      acc[gradeLevel] = []
    }
    acc[gradeLevel].push(cls)
    return acc
  }, {} as Record<number, Class[]>)

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{classes.length}</div>
                <div className="text-sm text-gray-600">Tổng số lớp</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{baseClasses.length}</div>
                <div className="text-sm text-gray-600">Lớp tách</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{combinedClasses.length}</div>
                <div className="text-sm text-gray-600">Lớp ghép</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes by Grade */}
      <div className="space-y-4">
        {Object.entries(classesByGrade)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([gradeLevel, gradeClasses]) => (
            <Card key={gradeLevel}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lớp {gradeLevel} ({gradeClasses.length} lớp)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {gradeClasses.map(cls => (
                    <div
                      key={cls.id}
                      className={`p-3 rounded-lg border ${
                        cls.is_combined 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{cls.name}</h4>
                        <Badge variant={cls.is_combined ? 'secondary' : 'default'}>
                          {cls.is_combined ? 'Lớp ghép' : 'Lớp tách'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Mã: {cls.code}</div>
                        <div>Sĩ số: {cls.capacity}</div>
                        {cls.is_combined && cls.metadata?.subject_group_name && (
                          <div className="text-purple-600 font-medium">
                            {cls.metadata.subject_group_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Combined Classes Detail */}
      {combinedClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              Chi tiết lớp ghép
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-3">
              Các lớp ghép được tạo để học sinh từ nhiều lớp tách tập trung học các môn tự chọn theo cụm.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combinedClasses.map(cls => (
                <div key={cls.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-purple-900">{cls.name}</h4>
                    <Badge variant="secondary">
                      {cls.metadata?.subject_group_code || 'N/A'}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Cụm môn:</span> {cls.metadata?.subject_group_name || 'Chưa xác định'}</div>
                    <div><span className="font-medium">Sĩ số:</span> {cls.capacity}</div>
                    <div><span className="font-medium">Khối:</span> {cls.grade_level.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 