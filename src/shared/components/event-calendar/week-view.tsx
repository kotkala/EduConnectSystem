"use client";

import React, { useMemo } from "react";
import {
  differenceInMinutes,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";

import {
  DraggableEvent,
  DroppableCell,
  useCurrentTimeIndicator,
  WeekCellsHeight,
  type CalendarEvent,
} from "@/shared/components/event-calendar";
import { StartHour, EndHour } from "@/shared/components/event-calendar/constants";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  readonly currentDate: Date;
  readonly events: CalendarEvent[];
  readonly onEventSelect: (event: CalendarEvent) => void;
  readonly onEventCreate: (startTime: Date) => void;
}

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

export function WeekView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: WeekViewProps) {
  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    "week",
  );
  
  // Get week boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Get days of the week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Get hours for the time column
  const hours = eachHourOfInterval({
    start: new Date().setHours(StartHour, 0, 0, 0),
    end: new Date().setHours(EndHour - 1, 0, 0, 0),
  });

  // Filter events for this week
  const weekEvents = useMemo(() => {
    return events.filter((event) =>
      weekDays.some((day) => isSameDay(event.start, day))
    );
  }, [events, weekDays]);

  // Position events for each day
  const positionedEvents = useMemo(() => {
    const positioned: PositionedEvent[] = [];

    weekDays.forEach((day, dayIndex) => {
      const dayEvents = weekEvents.filter((event) =>
        isSameDay(event.start, day)
      );

      // Sort events by start time
      dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Calculate positions
      dayEvents.forEach((event) => {
        const startHour = getHours(event.start);
        const startMinute = getMinutes(event.start);

        // Calculate top position
        const startOffset = (startHour - StartHour) * WeekCellsHeight + 
                           (startMinute / 60) * WeekCellsHeight;
        
        // Calculate height
        const duration = differenceInMinutes(event.end, event.start);
        const height = (duration / 60) * WeekCellsHeight;

        // Calculate left position and width (14.28% per day)
        const left = (dayIndex / 7) * 100;
        const width = 14.28; // 100% / 7 days

        positioned.push({
          event,
          top: startOffset,
          height,
          left,
          width,
          zIndex: 1,
        });
      });
    });

    return positioned;
  }, [weekEvents, weekDays]);

  const handleCellClick = (date: Date, hour: number) => {
    const clickTime = new Date(date);
    clickTime.setHours(hour, 0, 0, 0);
    onEventCreate(clickTime);
  };



  return (
    <div className="flex flex-col h-full">
      {/* Header with days */}
      <div className="flex border-b bg-muted/50">
        <div className="w-16 flex-shrink-0 border-r"></div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "flex-1 p-2 text-center border-r",
              isToday(day) && "bg-primary/10"
            )}
          >
            <div className="text-sm font-medium">
              {format(day, "EEE")}
            </div>
            <div className={cn(
              "text-lg",
              isToday(day) && "text-primary font-bold"
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 relative overflow-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r">
            {hours.map((hour) => (
              <div
                key={hour.getTime()}
                className="border-b text-xs text-muted-foreground p-1 text-right"
                style={{ height: WeekCellsHeight }}
              >
                {format(hour, "HH:mm")}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="flex-1 relative">
            {/* Grid lines */}
            <div className="absolute inset-0">
              {hours.map((hour) => (
                <div
                  key={hour.getTime()}
                  className="border-b border-border/50"
                  style={{ height: WeekCellsHeight }}
                />
              ))}
              {weekDays.map((day, index) => (
                <div
                  key={`divider-${day.toISOString()}`}
                  className="absolute top-0 bottom-0 border-r border-border/50"
                  style={{ left: `${(index / 7) * 100}%` }}
                />
              ))}
            </div>

            {/* Clickable cells */}
            <div className="absolute inset-0">
              {weekDays.flatMap((day, dayIndex) =>
                hours.map((hour) => (
                  <div
                    key={`${day.toISOString()}-${hour.getTime()}`}
                    className="absolute border border-transparent"
                    style={{
                      left: `${(dayIndex / 7) * 100}%`,
                      top: (getHours(hour) - StartHour) * WeekCellsHeight,
                      width: `${100 / 7}%`,
                      height: WeekCellsHeight,
                    }}
                  >
                    <DroppableCell
                      id={`${day.toISOString()}-${hour.getTime()}`}
                      date={new Date(day.getFullYear(), day.getMonth(), day.getDate(), getHours(hour))}
                      time={getHours(hour) + getMinutes(hour) / 60}
                      className="h-full w-full hover:bg-muted/50"
                      onClick={() => handleCellClick(new Date(day.getFullYear(), day.getMonth(), day.getDate(), getHours(hour)), getHours(hour))}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Events */}
            <div className="absolute inset-0">
              {positionedEvents.map(({ event, top, height, left, width }) => (
                <div
                  key={event.id}
                  className="absolute px-1"
                  style={{
                    top,
                    height,
                    left: `${left}%`,
                    width: `${width}%`,
                    zIndex: 10,
                  }}
                >
                  <DraggableEvent
                    event={event}
                    view="week"
                    onClick={() => onEventSelect(event)}
                    showTime={true}
                  />
                </div>
              ))}
            </div>

            {/* Current time indicator */}
            {currentTimeVisible && (
              <div
                className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
