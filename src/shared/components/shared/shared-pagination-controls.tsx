'use client'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SharedPaginationControlsProps {
  readonly currentPage: number
  readonly totalPages: number
  readonly totalCount: number
  readonly onPageChange: (page: number) => void
  readonly itemName?: string
}

export function SharedPaginationControls({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  itemName = 'má»¥c'
}: Readonly<SharedPaginationControlsProps>) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages} - Tá»•ng {totalCount} {itemName}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              TrÆ°á»›c
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                if (pageNum > totalPages) return null

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
