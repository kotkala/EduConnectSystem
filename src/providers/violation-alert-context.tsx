'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useViolationAlertCount } from '@/shared/hooks/use-violation-alert-count'

interface ViolationAlertContextType {
  alertCount: number
  isLoading: boolean
  refreshCount: () => void
}

const ViolationAlertContext = createContext<ViolationAlertContextType | undefined>(undefined)

interface ViolationAlertProviderProps {
  children: ReactNode
}

export function ViolationAlertProvider({ children }: ViolationAlertProviderProps) {
  const violationAlert = useViolationAlertCount()

  return (
    <ViolationAlertContext.Provider value={violationAlert}>
      {children}
    </ViolationAlertContext.Provider>
  )
}

export function useViolationAlert() {
  const context = useContext(ViolationAlertContext)
  if (context === undefined) {
    throw new Error('useViolationAlert must be used within a ViolationAlertProvider')
  }
  return context
}
