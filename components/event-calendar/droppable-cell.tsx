"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { useCalendarDnd } from "@/components/event-calendar";

interface DroppableCellProps {
  readonly id: string;
  readonly date: Date;
  readonly time?: number; // For week/day views, represents hours (e.g., 9.25 for 9:15)
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
}

export function DroppableCell({
  id,
  date,
  time,
  children,
  className,
  onClick,
}: DroppableCellProps) {
  const { activeEvent } = useCalendarDnd();

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      date,
      time,
    },
  });

  // Format time for display in tooltip (only for debugging)
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, "0")}`
      : null;

  if (onClick) {
    return (
      <button
        ref={setNodeRef}
        onClick={onClick}
        type="button"
        className={cn(
          "data-dragging:bg-accent flex h-full w-full flex-col px-0.5 py-1 sm:px-1 border-0 bg-transparent text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          className,
        )}
        title={formattedTime ? `${formattedTime}` : undefined}
        data-dragging={isOver && activeEvent ? true : undefined}
        aria-label={(() => {
          const baseLabel = 'Calendar cell'
          const timeLabel = formattedTime ? ` at ${formattedTime}` : ''
          return `${baseLabel}${timeLabel}`
        })()}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "data-dragging:bg-accent flex h-full flex-col px-0.5 py-1 sm:px-1",
        className,
      )}
      title={formattedTime ? `${formattedTime}` : undefined}
      data-dragging={isOver && activeEvent ? true : undefined}
    >
      {children}
    </div>
  );
}
