// Z-Index Design System - Context7 Best Practice
// Prevents overlay conflicts and provides consistent layering

export const zIndex = {
  // Base content
  base: 0,
  elevated: 10,

  // Navigation
  header: 40,
  sidebar: 50,

  // Overlays - Fixed hierarchy for dropdowns in modals
  modal: 1300,
  modalOverlay: 1250,
  dropdown: 1400,  // Higher than modal so dropdowns appear above dialogs
  popover: 1500,   // Higher than dropdown for nested popovers
  tooltip: 1600,   // Highest for tooltips
  toast: 1700,     // Toast notifications above everything

  // Critical overlays
  loading: 9998,
  debug: 9999,
} as const

export type ZIndexLevel = keyof typeof zIndex
