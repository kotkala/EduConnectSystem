"use client"

import { useCallback } from "react"

export type CalendarView = "day" | "week" | "month"

interface UseCalendarNavigationProps {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  view: CalendarView
}

export function useCalendarNavigation({
  currentDate,
  setCurrentDate,
  view
}: UseCalendarNavigationProps) {
  
  // Navigate to previous period based on current view
  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }, [currentDate, view, setCurrentDate])

  // Navigate to next period based on current view
  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }, [currentDate, view, setCurrentDate])

  // Navigate to today
  const navigateToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [setCurrentDate])

  return {
    navigatePrevious,
    navigateNext,
    navigateToday
  }
}

// Navigation button props interface for external components
export interface CalendarNavigationProps {
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  disabled?: boolean
}
