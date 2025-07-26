"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

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
  children: ReactNode;
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

  const toggleColorVisibility = (color: string) => {
    setVisibleColors(prev => 
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const isColorVisible = (color: string | undefined) => {
    if (!color) return true;
    return visibleColors.includes(color);
  };

  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        visibleColors,
        toggleColorVisibility,
        isColorVisible,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}
