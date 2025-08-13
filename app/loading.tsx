"use client"

import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Top brand */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/edu_connect_dashboard.png" alt="EduConnect" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="text-sm text-muted-foreground hidden sm:inline">Đang tải dữ liệu...</span>
        </div>
        <Skeleton className="h-6 w-20" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={`loading-card-${i}`} className="animate-in fade-in zoom-in-95 duration-300">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Bottom pulse indicator */}
      <div className="flex justify-center pt-6">
        <div className="h-2 w-24 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse" aria-hidden />
      </div>
    </div>
  )
}
