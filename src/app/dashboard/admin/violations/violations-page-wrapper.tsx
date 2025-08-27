'use client'

import { useState, createContext, useContext } from 'react'
import { FloatingTabSelector } from '@/features/violations/components/floating-tab-selector'
import { useIsMobile } from '@/shared/hooks/use-mobile'

// Context to share tab state between wrapper and content
const ViolationsTabContext = createContext<{
  activeTab: string
  setActiveTab: (tab: string) => void
}>({
  activeTab: 'overview',
  setActiveTab: () => {}
})

export const useViolationsTab = () => useContext(ViolationsTabContext)

interface ViolationsPageWrapperProps {
  children: React.ReactNode
}

export default function ViolationsPageWrapper({ children }: ViolationsPageWrapperProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const isMobile = useIsMobile()

  return (
    <ViolationsTabContext.Provider value={{ activeTab, setActiveTab }}>
      {/* Floating Tab Selector - Outside all layouts, fixed to viewport */}
      {isMobile && (
        <FloatingTabSelector activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Content with context */}
      {children}
    </ViolationsTabContext.Provider>
  )
}
