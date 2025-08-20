"use client"

import { CalendarNavigationProps } from "@/features/timetable/hooks/use-calendar-navigation"

export function CalendarNavigationButtons({
  onPrevious,
  onNext,
  onToday,
  disabled = false
}: CalendarNavigationProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onPrevious}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
      >
        â†
      </button>
      <button
        type="button"
        onClick={onToday}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
      >
        Hôm nay
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
      >
        â†’
      </button>
    </div>
  )
}
