"use client";

import { useMemo } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { differenceInMinutes, format, getMinutes } from "date-fns";

import {
  getBorderRadiusClasses,
  getEventColorClasses,
  getSingleDayEventPosition,
  getFirstDayEventPosition,
  getLastDayEventPosition,
  getMiddleDayEventPosition,
  type CalendarEvent,
} from "@/features/timetable/components/event-calendar";
import { cn } from "@/lib/utils";

// Using date-fns format with custom formatting:
// 'h' - hours (1-12)
// 'a' - am/pm
// ':mm' - minutes with leading zero (only if the token 'mm' is present)
const formatTimeWithOptionalMinutes = (date: Date) => {
  return format(date, getMinutes(date) === 0 ? "ha" : "h:mma").toLowerCase();
};

interface EventWrapperProps {
  readonly event: CalendarEvent;
  readonly isFirstDay?: boolean;
  readonly isLastDay?: boolean;
  readonly isDragging?: boolean;
  readonly onClick?: (e: React.MouseEvent) => void;
  readonly className?: string;
  readonly children: React.ReactNode;
  readonly currentTime?: Date;
  readonly dndListeners?: SyntheticListenerMap;
  readonly dndAttributes?: DraggableAttributes;
  readonly onMouseDown?: (e: React.MouseEvent) => void;
  readonly onTouchStart?: (e: React.TouchEvent) => void;
}

// Helper function to determine event position
function determineEventPosition(isFirstDay: boolean, isLastDay: boolean) {
  if (isFirstDay && isLastDay) {
    return getSingleDayEventPosition();
  }
  if (isFirstDay) {
    return getFirstDayEventPosition();
  }
  if (isLastDay) {
    return getLastDayEventPosition();
  }
  return getMiddleDayEventPosition();
}

// Shared wrapper component for event styling
function EventWrapper({
  event,
  isFirstDay = true,
  isLastDay = true,
  isDragging,
  onClick,
  className,
  children,
  dndListeners,
  dndAttributes,
  onMouseDown,
  onTouchStart,
}: EventWrapperProps) {
  // Remove unused displayEnd variable

  return (
    <div
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex h-full w-full overflow-hidden px-2 text-left font-medium backdrop-blur-md transition outline-none select-none focus-visible:ring-[3px] data-dragging:cursor-grabbing data-dragging:shadow-lg sm:px-3 flex-col cursor-pointer",
        getEventColorClasses(event.color),
        getBorderRadiusClasses(determineEventPosition(isFirstDay, isLastDay)),
        // Add status background color
        event.statusBgColor,
        className,
      )}
      data-dragging={isDragging || undefined}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Simulate a click by calling the handler directly
          if (onClick) {
            const target = e.currentTarget;
            const rect = target.getBoundingClientRect();
            const syntheticEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            });
            target.dispatchEvent(syntheticEvent);
          }
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={undefined}
      aria-roledescription="draggable"
      {...dndListeners}
      {...dndAttributes}
    >
      {children}
    </div>
  );
}

interface EventItemProps {
  readonly event: CalendarEvent;
  readonly view: "month" | "week" | "day" | "agenda";
  readonly isDragging?: boolean;
  readonly onClick?: (e: React.MouseEvent) => void;
  readonly showTime?: boolean;
  readonly currentTime?: Date; // For updating time during drag
  readonly isFirstDay?: boolean;
  readonly isLastDay?: boolean;
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly dndListeners?: SyntheticListenerMap;
  readonly dndAttributes?: DraggableAttributes;
  readonly onMouseDown?: (e: React.MouseEvent) => void;
  readonly onTouchStart?: (e: React.TouchEvent) => void;
}

export function EventItem({
  event,
  view,
  isDragging,
  onClick,
  showTime,
  currentTime,
  isFirstDay = true,
  isLastDay = true,
  children,
  className,
  dndListeners,
  dndAttributes,
  onMouseDown,
  onTouchStart,
}: EventItemProps) {
  const eventColor = event.color;

  // Use the provided currentTime (for dragging) or the event's actual time
  const displayStart = useMemo(() => {
    return currentTime || new Date(event.start);
  }, [currentTime, event.start]);

  const displayEnd = useMemo(() => {
    return currentTime
      ? new Date(
          new Date(currentTime).getTime() +
            (new Date(event.end).getTime() - new Date(event.start).getTime()),
        )
      : new Date(event.end);
  }, [currentTime, event.start, event.end]);

  // Calculate event duration in minutes
  const durationMinutes = useMemo(() => {
    return differenceInMinutes(displayEnd, displayStart);
  }, [displayStart, displayEnd]);

  const getEventTime = () => {
    if (event.allDay) return "All day";

    // For short events (less than 45 minutes), only show start time
    if (durationMinutes < 45) {
      return formatTimeWithOptionalMinutes(displayStart);
    }

    // For longer events, show both start and end time with duration
    let durationText = ` (${durationMinutes}min)`;
    if (durationMinutes === 45) {
      durationText = " • 45min";
    } else if (durationMinutes === 60) {
      durationText = " • 1h";
    }
    return `${formatTimeWithOptionalMinutes(displayStart)} - ${formatTimeWithOptionalMinutes(displayEnd)}${durationText}`;
  };

  if (view === "month") {
    return (
      <EventWrapper
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isDragging={isDragging}
        onClick={onClick}
        className={cn(
          "mt-[var(--event-gap)] min-h-[var(--event-height)] items-start flex-col py-1 text-[10px] sm:text-[13px]",
          className,
        )}
        currentTime={currentTime}
        dndListeners={dndListeners}
        dndAttributes={dndAttributes}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {children || (
          <>
            <div className="truncate font-semibold mb-1">
              {!event.allDay && (
                <span className="truncate sm:text-xs font-normal opacity-70 uppercase">
                  {formatTimeWithOptionalMinutes(displayStart)}{" "}
                </span>
              )}
              {event.title}
            </div>

            {/* Show full status text in month view */}
            {event.status && (
              <div className={cn(
                "text-[8px] sm:text-[10px] font-medium px-1 py-0.5 rounded text-center",
                event.statusColor,
                event.statusBgColor,
                "border border-white/20"
              )}>
                {event.status}
              </div>
            )}
          </>
        )}
      </EventWrapper>
    );
  }

  if (view === "week" || view === "day") {
    return (
      <EventWrapper
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isDragging={isDragging}
        onClick={onClick}
        className={cn(
          "py-2 flex-col justify-start",
          view === "week" ? "text-[12px] sm:text-[14px]" : "text-[14px]",
          // Add visual indicator for 45-minute slots
          durationMinutes === 45 && "border-l-4 border-l-blue-500/70 bg-blue-50/30",
          className,
        )}
        currentTime={currentTime}
        dndListeners={dndListeners}
        dndAttributes={dndAttributes}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Always use expanded layout for better status display */}
        {(
          <>
            <div className={cn(
              "font-semibold text-sm mb-1",
              // Don't truncate titles
              "break-words"
            )}>
              {event.title}
            </div>

            {/* Always show full status text */}
            {event.status && (
              <div className={cn(
                "text-xs font-medium px-2 py-1 rounded-md mb-1 text-center",
                event.statusColor,
                event.statusBgColor,
                "border border-white/20"
              )}>
                {event.status}
              </div>
            )}
            {event.location && event.location !== 'Chưa xác định' && (
              <div className="truncate font-medium opacity-80 text-xs mt-0.5">
                ðŸ“ Phòng {event.location}
              </div>
            )}
            {showTime && (
              <div className="truncate font-medium opacity-70 text-xs mt-0.5">
                 {getEventTime()}
              </div>
            )}
          </>
        )}
      </EventWrapper>
    );
  }

  // Agenda view - kept separate since it's significantly different
  return (
    <div
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex w-full flex-col gap-1 rounded p-2 text-left transition outline-none focus-visible:ring-[3px] cursor-pointer",
        getEventColorClasses(eventColor),
        className,
      )}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Simulate a click by calling the handler directly
          if (onClick) {
            const target = e.currentTarget;
            const rect = target.getBoundingClientRect();
            const syntheticEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            });
            target.dispatchEvent(syntheticEvent);
          }
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={undefined}
      {...dndListeners}
      {...dndAttributes}
    >
      <div className="text-sm font-medium">{event.title}</div>

      {/* Show full status text in agenda view */}
      {event.status && (
        <div className={cn(
          "text-xs font-medium px-2 py-1 rounded-md my-1 text-center",
          event.statusColor,
          event.statusBgColor,
          "border border-white/20"
        )}>
          {event.status}
        </div>
      )}

      <div className="text-xs opacity-70">
        {event.allDay ? (
          <span>All day</span>
        ) : (
          <span className="uppercase">
            {formatTimeWithOptionalMinutes(displayStart)} -{" "}
            {formatTimeWithOptionalMinutes(displayEnd)}
          </span>
        )}
        {event.location && (
          <>
            <span className="px-1 opacity-35"> Â· </span>
            <span>{event.location}</span>
          </>
        )}
      </div>
      {event.description && (
        <div className="my-1 text-xs opacity-90">{event.description}</div>
      )}
    </div>
  );
}
