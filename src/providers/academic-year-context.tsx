'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { getAcademicYearsLightAction } from '@/features/admin-management/actions/academic-actions'
import { toast } from 'sonner'

// Types
export interface AcademicYearOption {
  id: string
  name: string
  is_current?: boolean
}

interface AcademicYearContextType {
  // Current selected academic year
  selectedAcademicYear: AcademicYearOption | null
  setSelectedAcademicYear: (year: AcademicYearOption | null) => void
  
  // Available academic years
  academicYears: AcademicYearOption[]
  
  // Loading states
  loading: boolean
  
  // Actions
  refreshAcademicYears: () => Promise<void>
  
  // Helper functions
  getCurrentAcademicYear: () => AcademicYearOption | null
  isCurrentYear: (yearId: string) => boolean
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined)

interface AcademicYearProviderProps {
  children: React.ReactNode
}

export function AcademicYearProvider({ children }: Readonly<AcademicYearProviderProps>) {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYearOption | null>(null)
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([])
  const [loading, setLoading] = useState(true)

  // Load academic years from server with caching
  const loadAcademicYears = useCallback(async () => {
    try {
      setLoading(true)

      // Check if we already have data to avoid unnecessary requests
      if (academicYears.length > 0) {
        setLoading(false)
        return
      }

      const result = await getAcademicYearsLightAction()

      if (result.success && result.data) {
        const years = result.data.map(year => ({
          id: year.id,
          name: year.name,
          is_current: year.is_current
        }))

        setAcademicYears(years)

        // Auto-select current academic year if none selected
        // Use functional update to avoid dependency on selectedAcademicYear
        setSelectedAcademicYear(prev => {
          if (!prev) {
            const currentYear = years.find(year => year.is_current)
            if (currentYear) {
              return currentYear
            } else if (years.length > 0) {
              // If no current year, select the first one
              return years[0]
            }
          }
          return prev
        })
      } else {
        toast.error('Không thể tải danh sách năm học')
      }
    } catch (error) {
      console.error('Error loading academic years:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách năm học')
    } finally {
      setLoading(false)
    }
  }, [academicYears.length]) // Add dependency to prevent unnecessary loads

  // Refresh academic years
  const refreshAcademicYears = useCallback(async () => {
    await loadAcademicYears()
  }, [loadAcademicYears])

  // Get current academic year
  const getCurrentAcademicYear = useCallback(() => {
    return academicYears.find(year => year.is_current) || null
  }, [academicYears])

  // Check if a year is current
  const isCurrentYear = useCallback((yearId: string) => {
    const year = academicYears.find(y => y.id === yearId)
    return year?.is_current || false
  }, [academicYears])

  // Load academic years on mount
  useEffect(() => {
    loadAcademicYears()
  }, [loadAcademicYears])

  // Context value - Memoized to prevent unnecessary re-renders
  const contextValue: AcademicYearContextType = useMemo(() => ({
    selectedAcademicYear,
    setSelectedAcademicYear,
    academicYears,
    loading,
    refreshAcademicYears,
    getCurrentAcademicYear,
    isCurrentYear
  }), [
    selectedAcademicYear,
    // setSelectedAcademicYear is omitted - setState functions are always stable
    academicYears,
    loading,
    refreshAcademicYears,
    getCurrentAcademicYear,
    isCurrentYear
  ])

  return (
    <AcademicYearContext.Provider value={contextValue}>
      {children}
    </AcademicYearContext.Provider>
  )
}

// Hook to use academic year context
export function useAcademicYear() {
  const context = useContext(AcademicYearContext)
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider')
  }
  return context
}

// Hook to get selected academic year ID (convenience)
export function useSelectedAcademicYearId(): string | null {
  const { selectedAcademicYear } = useAcademicYear()
  return selectedAcademicYear?.id || null
}
