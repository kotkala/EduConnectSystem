"use client";

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { addMinutes, differenceInMinutes } from "date-fns";

import { EventItem, type CalendarEvent } from "@/features/timetable/components/event-calendar";

// Helper function to calculate time with 15-minute precision
function calculatePreciseTime(time: number): { hours: number; minutes: number } {
  const hours = Math.floor(time);
  const fractionalHour = time - hours;

  // Map to nearest 15 minute interval (0, 0.25, 0.5, 0.75)
  let minutes: number;
  if (fractionalHour < 0.125) minutes = 0;
  else if (fractionalHour < 0.375) minutes = 15;
  else if (fractionalHour < 0.625) minutes = 30;
  else minutes = 45;

  return { hours, minutes };
}

// Helper function to check if time has changed
function hasTimeChanged(newTime: Date, currentTime: Date | null): boolean {
  if (!currentTime) return true;

  return (
    newTime.getHours() !== currentTime.getHours() ||
    newTime.getMinutes() !== currentTime.getMinutes() ||
    newTime.getDate() !== currentTime.getDate() ||
    newTime.getMonth() !== currentTime.getMonth() ||
    newTime.getFullYear() !== currentTime.getFullYear()
  );
}

// Helper function to check if date has changed
function hasDateChanged(newTime: Date, currentTime: Date | null): boolean {
  if (!currentTime) return true;

  return (
    newTime.getDate() !== currentTime.getDate() ||
    newTime.getMonth() !== currentTime.getMonth() ||
    newTime.getFullYear() !== currentTime.getFullYear()
  );
}

// Helper function to reset drag state
interface DragStateSetters {
  setActiveEvent: (event: CalendarEvent | null) => void;
  setActiveId: (id: UniqueIdentifier | null) => void;
  setActiveView: (view: "month" | "week" | "day" | null) => void;
  setCurrentTime: (time: Date | null) => void;
  setEventHeight: (height: number | null) => void;
  setIsMultiDay: (isMultiDay: boolean) => void;
  setMultiDayWidth: (width: number | null) => void;
  setDragHandlePosition: (position: {
    x?: number;
    y?: number;
    data?: {
      isFirstDay?: boolean;
      isLastDay?: boolean;
    };
  } | null) => void;
}

function resetDragState(setters: DragStateSetters) {
  setters.setActiveEvent(null);
  setters.setActiveId(null);
  setters.setActiveView(null);
  setters.setCurrentTime(null);
  setters.setEventHeight(null);
  setters.setIsMultiDay(false);
  setters.setMultiDayWidth(null);
  setters.setDragHandlePosition(null);
}

// Helper function to check if start time has changed
function hasStartTimeChanged(originalStart: Date, newStart: Date): boolean {
  return (
    originalStart.getFullYear() !== newStart.getFullYear() ||
    originalStart.getMonth() !== newStart.getMonth() ||
    originalStart.getDate() !== newStart.getDate() ||
    originalStart.getHours() !== newStart.getHours() ||
    originalStart.getMinutes() !== newStart.getMinutes()
  );
}

// Define the context type
type CalendarDndContextType = {
  activeEvent: CalendarEvent | null;
  activeId: UniqueIdentifier | null;
  activeView: "month" | "week" | "day" | null;
  currentTime: Date | null;
  eventHeight: number | null;
  isMultiDay: boolean;
  multiDayWidth: number | null;
  dragHandlePosition: {
    x?: number;
    y?: number;
    data?: {
      isFirstDay?: boolean;
      isLastDay?: boolean;
    };
  } | null;
};

// Create the context
const CalendarDndContext = createContext<CalendarDndContextType>({
  activeEvent: null,
  activeId: null,
  activeView: null,
  currentTime: null,
  eventHeight: null,
  isMultiDay: false,
  multiDayWidth: null,
  dragHandlePosition: null,
});

// Hook to use the context
export const useCalendarDnd = () => useContext(CalendarDndContext);

// Props for the provider
interface CalendarDndProviderProps {
  children: ReactNode;
  onEventUpdate: (event: CalendarEvent) => void;
}

export function CalendarDndProvider({
  children,
  onEventUpdate,
}: Readonly<CalendarDndProviderProps>) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeView, setActiveView] = useState<"month" | "week" | "day" | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [eventHeight, setEventHeight] = useState<number | null>(null);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [multiDayWidth, setMultiDayWidth] = useState<number | null>(null);
  const [dragHandlePosition, setDragHandlePosition] = useState<{
    x?: number;
    y?: number;
    data?: {
      isFirstDay?: boolean;
      isLastDay?: boolean;
    };
  } | null>(null);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    activeEvent,
    activeId,
    activeView,
    currentTime,
    eventHeight,
    isMultiDay,
    multiDayWidth,
    dragHandlePosition,
  }), [
    activeEvent,
    activeId,
    activeView,
    currentTime,
    eventHeight,
    isMultiDay,
    multiDayWidth,
    dragHandlePosition,
  ]);

  // Store original event dimensions
  const eventDimensions = useRef<{ height: number }>({ height: 0 });

  // Configure sensors for better drag detection
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 5px before activating
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      // Require the pointer to move by 5px before activating
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Generate a stable ID for the DndContext
  const dndContextId = useId();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Add safety check for data.current
    if (!active.data.current) {
      console.error("Missing data in drag start event", event);
      return;
    }

    const {
      event: calendarEvent,
      view,
      height,
      isMultiDay: eventIsMultiDay,
      multiDayWidth: eventMultiDayWidth,
      dragHandlePosition: eventDragHandlePosition,
    } = active.data.current as {
      event: CalendarEvent;
      view: "month" | "week" | "day";
      height?: number;
      isMultiDay?: boolean;
      multiDayWidth?: number;
      dragHandlePosition?: {
        x?: number;
        y?: number;
        data?: {
          isFirstDay?: boolean;
          isLastDay?: boolean;
        };
      };
    };

    setActiveEvent(calendarEvent);
    setActiveId(active.id);
    setActiveView(view);
    setCurrentTime(new Date(calendarEvent.start));
    setIsMultiDay(eventIsMultiDay || false);
    setMultiDayWidth(eventMultiDayWidth || null);
    setDragHandlePosition(eventDragHandlePosition || null);

    // Store event height if provided
    if (height) {
      eventDimensions.current.height = height;
      setEventHeight(height);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (over && activeEvent && over.data.current) {
      const { date, time } = over.data.current as { date: Date; time?: number };

      // Update time for week/day views
      if (time !== undefined && activeView !== "month") {
        const newTime = new Date(date);
        const { hours, minutes } = calculatePreciseTime(time);
        newTime.setHours(hours, minutes, 0, 0);

        // Only update if time has changed
        if (hasTimeChanged(newTime, currentTime)) {
          setCurrentTime(newTime);
        }
      } else if (activeView === "month") {
        // For month view, just update the date but preserve time
        const newTime = new Date(date);
        if (currentTime) {
          newTime.setHours(
            currentTime.getHours(),
            currentTime.getMinutes(),
            currentTime.getSeconds(),
            currentTime.getMilliseconds(),
          );
        }

        // Only update if date has changed
        if (hasDateChanged(newTime, currentTime)) {
          setCurrentTime(newTime);
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Add robust error checking
    if (!over || !activeEvent || !currentTime) {
      // Reset state and exit early
      resetDragState({
        setActiveEvent,
        setActiveId,
        setActiveView,
        setCurrentTime,
        setEventHeight,
        setIsMultiDay,
        setMultiDayWidth,
        setDragHandlePosition
      });
      return;
    }

    try {
      // Safely access data with checks
      if (!active.data.current || !over.data.current) {
        throw new Error("Missing data in drag event");
      }

      const activeData = active.data.current as {
        event?: CalendarEvent;
        view?: string;
      };
      const overData = over.data.current as { date?: Date; time?: number };

      // Verify we have all required data
      if (!activeData.event || !overData.date) {
        throw new Error("Missing required event data");
      }

      const calendarEvent = activeData.event;
      const date = overData.date;
      const time = overData.time;

      // Calculate new start time
      const newStart = new Date(date);

      // If time is provided (for week/day views), set the hours and minutes
      if (time !== undefined) {
        const hours = Math.floor(time);
        const fractionalHour = time - hours;

        // Map to nearest 15 minute interval (0, 0.25, 0.5, 0.75)
        let minutes: number;
        if (fractionalHour < 0.125) minutes = 0;
        else if (fractionalHour < 0.375) minutes = 15;
        else if (fractionalHour < 0.625) minutes = 30;
        else minutes = 45;

        newStart.setHours(hours, minutes, 0, 0);
      } else {
        // For month view, preserve the original time from currentTime
        newStart.setHours(
          currentTime.getHours(),
          currentTime.getMinutes(),
          currentTime.getSeconds(),
          currentTime.getMilliseconds(),
        );
      }

      // Calculate new end time based on the original duration
      const originalStart = new Date(calendarEvent.start);
      const originalEnd = new Date(calendarEvent.end);
      const durationMinutes = differenceInMinutes(originalEnd, originalStart);
      const newEnd = addMinutes(newStart, durationMinutes);

      // Only update if the start time has actually changed
      if (hasStartTimeChanged(originalStart, newStart)) {
        // Update the event only if the time has changed
        onEventUpdate({
          ...calendarEvent,
          start: newStart,
          end: newEnd,
        });
      }
    } catch (error) {
      console.error("Error in drag end handler:", error);
    } finally {
      // Always reset state
      resetDragState({
        setActiveEvent,
        setActiveId,
        setActiveView,
        setCurrentTime,
        setEventHeight,
        setIsMultiDay,
        setMultiDayWidth,
        setDragHandlePosition
      });
    }
  };

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <CalendarDndContext.Provider value={contextValue}>
        {children}

        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeEvent && activeView && (
            <div
              style={{
                height: eventHeight ? `${eventHeight}px` : "auto",
                width:
                  isMultiDay && multiDayWidth ? `${multiDayWidth}%` : "100%",
                // Apply drag handle offset to position overlay under cursor
                transform: dragHandlePosition
                  ? `translate(-${dragHandlePosition.x}px, -${dragHandlePosition.y}px)`
                  : undefined,
              }}
            >
              <EventItem
                event={activeEvent}
                view={activeView}
                isDragging={true}
                showTime={activeView !== "month"}
                currentTime={currentTime || undefined}
                isFirstDay={dragHandlePosition?.data?.isFirstDay !== false}
                isLastDay={dragHandlePosition?.data?.isLastDay !== false}
              />
            </div>
          )}
        </DragOverlay>
      </CalendarDndContext.Provider>
    </DndContext>
  );
}
