'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, Award, Calendar } from 'lucide-react'

type IconKey = 'book' | 'clock' | 'award' | 'calendar'

const iconMap: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  clock: Clock,
  award: Award,
  calendar: Calendar,
}

export interface StatItem {
  icon: IconKey
  label: string
  value: string
}

export function AnimatedStatsGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {items.map(({ icon, label, value }, idx) => {
        const Icon = iconMap[icon]
        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
          >
            <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm border border-border/60 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">{label}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl sm:text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}


