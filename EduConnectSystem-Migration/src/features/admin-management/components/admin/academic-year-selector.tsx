'use client'

import React, { useState, memo, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { Calendar, ChevronDown, Plus, Settings, Loader2 } from 'lucide-react'
import { useAcademicYear } from '@/providers/academic-year-context'
import { AcademicYearForm } from '@/features/admin-management/components/admin/academic-year-form'
import { AcademicYearManagementDialog } from '@/features/admin-management/components/admin/academic-year-management-dialog'
import { cn } from '@/lib/utils'

interface AcademicYearSelectorProps {
  className?: string
}

function AcademicYearSelectorComponent({ className }: Readonly<AcademicYearSelectorProps>) {
  const {
    selectedAcademicYear,
    setSelectedAcademicYear,
    academicYears,
    loading,
    refreshAcademicYears,
    isCurrentYear
  } = useAcademicYear()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showManagementDialog, setShowManagementDialog] = useState(false)

  // Memoized callbacks to prevent unnecessary re-renders
  const handleYearSelect = useCallback((yearId: string) => {
    const year = academicYears.find(y => y.id === yearId)
    if (year) {
      setSelectedAcademicYear(year)
    }
  }, [academicYears, setSelectedAcademicYear])

  const handleCreateSuccess = useCallback(() => {
    setShowCreateDialog(false)
    refreshAcademicYears()
  }, [refreshAcademicYears])

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Äang tải...</span>
      </div>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex items-center gap-2 min-w-[200px] justify-between",
              className
            )}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="truncate">
                {selectedAcademicYear?.name || 'Chồn năm hồc'}
              </span>
              {selectedAcademicYear && isCurrentYear(selectedAcademicYear.id) && (
                <Badge variant="secondary" className="text-xs">
                  Hiá»‡n táº¡i
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-[250px]">
          <DropdownMenuLabel>Chồn năm hồc quản lý</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {academicYears.length > 0 ? (
            academicYears.map((year) => (
              <DropdownMenuItem
                key={year.id}
                onClick={() => handleYearSelect(year.id)}
                className="flex items-center justify-between"
              >
                <span>{year.name}</span>
                <div className="flex items-center gap-1">
                  {isCurrentYear(year.id) && (
                    <Badge variant="secondary" className="text-xs">
                      Hiá»‡n táº¡i
                    </Badge>
                  )}
                  {selectedAcademicYear?.id === year.id && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              Không có năm hồc nÃ o
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tạo năm hồc mới
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => setShowManagementDialog(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Quản lý năm hồc
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Academic Year Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo năm hồc mới</DialogTitle>
          </DialogHeader>
          <AcademicYearForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Academic Year Management Dialog */}
      <AcademicYearManagementDialog
        open={showManagementDialog}
        onOpenChange={setShowManagementDialog}
        onRefresh={refreshAcademicYears}
      />
    </>
  )
}

// Export memoized component to prevent unnecessary re-renders
export const AcademicYearSelector = memo(AcademicYearSelectorComponent)
