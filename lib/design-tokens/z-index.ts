// Z-Index Design System - Context7 Best Practice
// Prevents overlay conflicts and provides consistent layering

export const zIndex = {
  // Base content
  base: 0,
  elevated: 10,
  
  // Navigation
  header: 40,
  sidebar: 50,
  
  // Overlays
  dropdown: 1000,
  popover: 1100,
  tooltip: 1200,
  modal: 1300,
  toast: 1400,
  
  // Critical overlays
  loading: 9998,
  debug: 9999,
} as const

export type ZIndexLevel = keyof typeof zIndex
