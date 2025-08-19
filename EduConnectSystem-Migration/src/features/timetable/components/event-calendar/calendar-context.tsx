"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";

interface CalendarContextType {
  // Date management
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Color visibility management
  visibleColors: string[];
  toggleColorVisibility: (color: string) => void;
  isColorVisible: (color: string | undefined) => boolean;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined,
);

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider",
    );
  }
  return context;
}

interface CalendarProviderProps {
  readonly children: ReactNode;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleColors, setVisibleColors] = useState([
    "blue",
    "orange", 
    "violet",
    "rose",
    "emerald"
  ]);

  const toggleColorVisibility = useCallback((color: string) => {
    setVisibleColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  }, []);

  const isColorVisible = useCallback((color: string | undefined) => {
    if (!color) return true;
    return visibleColors.includes(color);
  }, [visibleColors]);

  const contextValue = useMemo(() => ({
    currentDate,
    setCurrentDate,
    visibleColors,
    toggleColorVisibility,
    isColorVisible,
  }), [currentDate, visibleColors, toggleColorVisibility, isColorVisible]);

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}
