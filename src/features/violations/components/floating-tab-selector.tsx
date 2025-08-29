'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  FolderOpen,
  PlusCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Gavel,
  Menu,
  X
} from 'lucide-react'

interface ViolationsTab {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const violationsTabs: ViolationsTab[] = [
  { value: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { value: 'categories', label: 'Danh mục', icon: FolderOpen },
  { value: 'record', label: 'Ghi nhận', icon: PlusCircle },
  { value: 'violations', label: 'Vi phạm', icon: AlertTriangle },
  { value: 'weekly', label: 'Tuần', icon: Calendar },
  { value: 'monthly', label: 'Tháng', icon: FileText },
  { value: 'discipline', label: 'Kỷ luật', icon: Gavel }
]

interface FloatingTabSelectorProps {
  activeTab: string
  onTabChange: (value: string) => void
}

export function FloatingTabSelector({ activeTab, onTabChange }: FloatingTabSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTabSelect = (value: string) => {
    onTabChange(value)
    setIsOpen(false)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Menu - Always Visible, Sticky */}
      <div className="fixed bottom-6 right-6 pointer-events-auto" style={{ zIndex: 9999 }}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-16 right-0 w-56 bg-background border rounded-lg shadow-lg p-1 space-y-1"
            >
              {violationsTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = tab.value === activeTab

                return (
                  <button
                    key={tab.value}
                    onClick={() => handleTabSelect(tab.value)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors
                      ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button - Always Visible */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors
            ${isOpen
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-primary hover:bg-primary/90'
            }
          `}
        >
          {isOpen ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <Menu className="h-5 w-5 text-white" />
          )}
        </motion.button>
      </div>
    </>
  )
}
