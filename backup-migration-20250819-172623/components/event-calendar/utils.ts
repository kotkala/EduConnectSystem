import { isSameDay } from "date-fns";

import type { CalendarEvent, EventColor } from "@/components/event-calendar";

/**
 * Event position types for multi-day events
 */
export type EventPosition = 'single' | 'first' | 'middle' | 'last';

/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-blue-200/50 hover:bg-blue-200/40 text-blue-900/90 dark:bg-blue-400/25 dark:hover:bg-blue-400/20 dark:text-blue-200 shadow-blue-700/8";
    case "violet":
      return "bg-violet-200/50 hover:bg-violet-200/40 text-violet-900/90 dark:bg-violet-400/25 dark:hover:bg-violet-400/20 dark:text-violet-200 shadow-violet-700/8";
    case "rose":
      return "bg-rose-200/50 hover:bg-rose-200/40 text-rose-900/90 dark:bg-rose-400/25 dark:hover:bg-rose-400/20 dark:text-rose-200 shadow-rose-700/8";
    case "emerald":
      return "bg-emerald-200/50 hover:bg-emerald-200/40 text-emerald-900/90 dark:bg-emerald-400/25 dark:hover:bg-emerald-400/20 dark:text-emerald-200 shadow-emerald-700/8";
    case "orange":
      return "bg-orange-200/50 hover:bg-orange-200/40 text-orange-900/90 dark:bg-orange-400/25 dark:hover:bg-orange-400/20 dark:text-orange-200 shadow-orange-700/8";
    default:
      return "bg-blue-200/50 hover:bg-blue-200/40 text-blue-900/90 dark:bg-blue-400/25 dark:hover:bg-blue-400/20 dark:text-blue-200 shadow-blue-700/8";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(position: EventPosition): string {
  switch (position) {
    case 'single':
      return getBorderRadiusForSingleDay();
    case 'first':
      return getBorderRadiusForFirstDay();
    case 'last':
      return getBorderRadiusForLastDay();
    case 'middle':
      return getBorderRadiusForMiddleDay();
    default:
      return getBorderRadiusForSingleDay();
  }
}

/**
 * Get event position for single day events
 */
export function getSingleDayEventPosition(): EventPosition {
  return 'single';
}

/**
 * Get event position for first day of multi-day events
 */
export function getFirstDayEventPosition(): EventPosition {
  return 'first';
}

/**
 * Get event position for last day of multi-day events
 */
export function getLastDayEventPosition(): EventPosition {
  return 'last';
}

/**
 * Get event position for middle day of multi-day events
 */
export function getMiddleDayEventPosition(): EventPosition {
  return 'middle';
}

/**
 * Determine event position based on day flags
 */
export function getEventPosition(isFirstDay: boolean, isLastDay: boolean): EventPosition {
  if (isFirstDay && isLastDay) {
    return getSingleDayEventPosition();
  } else if (isFirstDay) {
    return getFirstDayEventPosition();
  } else if (isLastDay) {
    return getLastDayEventPosition();
  } else {
    return getMiddleDayEventPosition();
  }
}

/**
 * Get CSS classes for border radius when event is both first and last day (single day)
 */
export function getBorderRadiusForSingleDayEvent(): string {
  return getBorderRadiusForSingleDay();
}

/**
 * Get CSS classes for border radius when event is first day of multi-day event
 */
export function getBorderRadiusForFirstDayEvent(): string {
  return getBorderRadiusForFirstDay();
}

/**
 * Get CSS classes for border radius when event is last day of multi-day event
 */
export function getBorderRadiusForLastDayEvent(): string {
  return getBorderRadiusForLastDay();
}

/**
 * Get CSS classes for border radius when event is middle day of multi-day event
 */
export function getBorderRadiusForMiddleDayEvent(): string {
  return getBorderRadiusForMiddleDay();
}

/**
 * Get border radius classes for single day events
 */
export function getBorderRadiusForSingleDay(): string {
  return "rounded"; // Both ends rounded
}

/**
 * Get border radius classes for first day of multi-day events
 */
export function getBorderRadiusForFirstDay(): string {
  return "rounded-l rounded-r-none not-in-data-[slot=popover-content]:w-[calc(100%+5px)]"; // Only left end rounded
}

/**
 * Get border radius classes for last day of multi-day events
 */
export function getBorderRadiusForLastDay(): string {
  return "rounded-r rounded-l-none not-in-data-[slot=popover-content]:w-[calc(100%+4px)] not-in-data-[slot=popover-content]:-translate-x-[4px]"; // Only right end rounded
}

/**
 * Get border radius classes for middle days of multi-day events
 */
export function getBorderRadiusForMiddleDay(): string {
  return "rounded-none not-in-data-[slot=popover-content]:w-[calc(100%+9px)] not-in-data-[slot=popover-content]:-translate-x-[4px]"; // No rounded corners
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}


