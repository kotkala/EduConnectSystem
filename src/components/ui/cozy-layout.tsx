"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CozyLayoutProps {
  children: React.ReactNode
  className?: string
  showFloatingElements?: boolean
  variant?: 'default' | 'warm' | 'solarized'
}

export const CozyLayout: React.FC<CozyLayoutProps> = ({
  children,
  className,
  showFloatingElements = true,
  variant = 'default'
}) => {
  const backgroundVariants = {
    default: 'solarized-bg-gradient',
    warm: 'warm-bg-gradient',
    solarized: 'bg-base-03'
  }

  return (
    <div className={cn(
      'min-h-screen relative overflow-hidden',
      backgroundVariants[variant],
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(239,68,68,0.1)_1px,_transparent_0)] bg-[length:20px_20px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(245,158,11,0.05)_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>

      {/* Floating Elements */}
      {showFloatingElements && (
        <>
          <motion.div
            className="absolute top-20 left-10 text-pink-300/40"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Heart size={24} />
          </motion.div>

          <motion.div
            className="absolute top-40 right-20 text-warm-300/40"
            animate={{
              y: [0, -15, 0],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <Sparkles size={20} />
          </motion.div>

          <motion.div
            className="absolute bottom-40 left-20 text-pink-400/30"
            animate={{
              y: [0, -8, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          >
            <Star size={18} />
          </motion.div>

          <motion.div
            className="absolute top-60 left-1/2 text-warm-400/30"
            animate={{
              y: [0, -12, 0],
              x: [0, 5, -5, 0],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          >
            <Heart size={16} />
          </motion.div>

          <motion.div
            className="absolute bottom-20 right-10 text-pink-300/40"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          >
            <Sparkles size={22} />
          </motion.div>
        </>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
    </div>
  )
}

// Cozy Container Component
interface CozyContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  animate?: boolean
}

export const CozyContainer: React.FC<CozyContainerProps> = ({
  children,
  className,
  size = 'lg',
  animate = true
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  }

  const containerContent = (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )

  if (!animate) {
    return containerContent
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {containerContent}
    </motion.div>
  )
}

// Cozy Section Component
interface CozySectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  centered?: boolean
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
}

export const CozySection: React.FC<CozySectionProps> = ({
  children,
  className,
  title,
  subtitle,
  centered = false,
  spacing = 'lg'
}) => {
  const spacingClasses = {
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-20',
    xl: 'py-20 sm:py-24'
  }

  return (
    <section className={cn(
      spacingClasses[spacing],
      className
    )}>
      <CozyContainer>
        {(title || subtitle) && (
          <motion.div
            className={cn(
              'mb-12',
              centered && 'text-center'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {title && (
              <h2 className="cozy-gradient-text text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </CozyContainer>
    </section>
  )
}

// Cozy Grid Component
interface CozyGridProps {
  children: React.ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4 | 6
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
}

export const CozyGrid: React.FC<CozyGridProps> = ({
  children,
  className,
  columns = 3,
  gap = 'lg',
  animate = true
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  }

  const gridContent = (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )

  if (!animate) {
    return gridContent
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {gridContent}
    </motion.div>
  )
}

// Cozy Hero Component
interface CozyHeroProps {
  title: string
  subtitle?: string
  description?: string | React.ReactNode
  actions?: React.ReactNode
  image?: React.ReactNode
  className?: string
  variant?: 'default' | 'centered' | 'split'
}

export const CozyHero: React.FC<CozyHeroProps> = ({
  title,
  subtitle,
  description,
  actions,
  image,
  className,
  variant = 'default'
}) => {
  const variants = {
    default: 'text-left',
    centered: 'text-center',
    split: 'grid lg:grid-cols-2 gap-12 items-center'
  }

  return (
    <CozySection spacing="xl" className={className}>
      <div className={cn(variants[variant])}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={variant === 'split' ? 'lg:order-1' : ''}
        >
          {subtitle && (
            <motion.p
              className="text-primary font-medium mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
          
          <motion.h1
            className="cozy-gradient-text text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {title}
          </motion.h1>
          
          {description && (
            <motion.div
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {typeof description === 'string' ? (
                <p>{description}</p>
              ) : (
                description
              )}
            </motion.div>
          )}
          
          {actions && (
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {actions}
            </motion.div>
          )}
        </motion.div>
        
        {image && variant === 'split' && (
          <motion.div
            className="lg:order-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {image}
          </motion.div>
        )}
      </div>
    </CozySection>
  )
}

const CozyLayoutComponents = {
  CozyLayout,
  CozyContainer,
  CozySection,
  CozyGrid,
  CozyHero
} 

export default CozyLayoutComponents