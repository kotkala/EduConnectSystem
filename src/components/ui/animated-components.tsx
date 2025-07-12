"use client"

import React from 'react'
import { motion, AnimatePresence, useAnimation, useInView, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Premium EduConnect Animation Variants
export const educonnectFadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 }
}

export const educonnectSlideUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 60 }
}

export const educonnectSlideDown = {
  initial: { opacity: 0, y: -60 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -60 }
}

export const educonnectSlideLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 }
}

export const educonnectSlideRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 60 }
}

export const educonnectScale = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
}

export const educonnectBounce = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 10,
      stiffness: 100,
      restDelta: 0.001
    }
  },
  exit: { opacity: 0, scale: 0.3 }
}

export const educonnectFloat = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const educonnectGlow = {
  animate: {
    boxShadow: [
      "0 0 5px rgba(20, 184, 166, 0.2)",
      "0 0 20px rgba(20, 184, 166, 0.4)",
      "0 0 5px rgba(20, 184, 166, 0.2)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const educonnectStagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

export const educonnectMorphing = {
  initial: { borderRadius: "0.75rem", scale: 1 },
  animate: { 
    borderRadius: ["0.75rem", "2rem", "0.75rem"],
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const educonnectShimmer = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Premium Container Component
interface EduConnectAnimatedContainerProps {
  children: React.ReactNode
  className?: string
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce'
  delay?: number
  duration?: number
  once?: boolean
  threshold?: number
  springConfig?: {
    damping?: number
    stiffness?: number
    mass?: number
  }
}

export const EduConnectAnimatedContainer: React.FC<EduConnectAnimatedContainerProps> = ({
  children,
  className,
  variant = 'fadeIn',
  delay = 0,
  duration = 0.8,
  once = true,
  threshold = 0.1,
  springConfig = { damping: 20, stiffness: 100, mass: 1 }
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: threshold })
  const controls = useAnimation()

  const variants = {
    fadeIn: educonnectFadeIn,
    slideUp: educonnectSlideUp,
    slideDown: educonnectSlideDown,
    slideLeft: educonnectSlideLeft,
    slideRight: educonnectSlideRight,
    scale: educonnectScale,
    bounce: educonnectBounce
  }

  useEffect(() => {
    if (isInView) {
      controls.start('animate')
    }
  }, [isInView, controls])

  const transition = variant === 'bounce' 
    ? { type: "spring" as const, ...springConfig, delay }
    : { duration, delay, ease: "easeOut" as const }

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={controls}
      variants={variants[variant]}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Premium Card Component
interface EduConnectAnimatedCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'glass' | 'gradient' | 'premium'
  hover?: 'lift' | 'scale' | 'glow' | 'rotate' | 'morph' | 'none'
  glow?: boolean
  float?: boolean
  shimmer?: boolean
  borderAnimation?: boolean
}

export const EduConnectAnimatedCard: React.FC<EduConnectAnimatedCardProps> = ({
  children,
  className,
  variant = 'primary',
  hover = 'lift',
  glow = false,
  float = false,
  shimmer = false,
  borderAnimation = false
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-br from-white to-teal-50/50 border border-teal-200 shadow-educonnect-soft',
    secondary: 'bg-gradient-to-br from-white to-blue-50/50 border border-blue-200 shadow-blue',
    accent: 'bg-gradient-to-br from-white to-amber-50/50 border border-amber-200 shadow-amber',
    glass: 'bg-white/70 backdrop-blur-md border border-white/20 shadow-glass',
    gradient: 'bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-educonnect-large',
    premium: 'bg-gradient-to-br from-white via-teal-50/30 to-blue-50/30 border border-teal-200/50 shadow-educonnect-medium'
  }

  const hoverVariants = {
    lift: {
      scale: 1.02,
      y: -8,
      transition: { type: "spring" as const, damping: 20, stiffness: 300 }
    },
    scale: {
      scale: 1.05,
      transition: { type: "spring" as const, damping: 20, stiffness: 300 }
    },
    glow: {
      boxShadow: "0 20px 40px rgba(20, 184, 166, 0.3)",
      transition: { duration: 0.3 }
    },
    rotate: {
      rotate: [0, 1, -1, 0],
      scale: 1.02,
      transition: { duration: 0.3 }
    },
    morph: {
      borderRadius: "2rem",
      scale: 1.02,
      transition: { duration: 0.3 }
    },
    none: {}
  }

  const animations = {
    ...(float && educonnectFloat),
    ...(glow && educonnectGlow),
    ...(shimmer && educonnectShimmer),
    ...(borderAnimation && educonnectMorphing)
  }

  return (
    <motion.div
      className={cn(
        variantClasses[variant],
        'rounded-2xl cursor-pointer overflow-hidden relative',
        shimmer && 'bg-gradient-to-r bg-[length:200%_200%]',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, ...animations }}
      whileHover={hover !== 'none' ? hoverVariants[hover] : {}}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {shimmer && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
      )}
      {children}
    </motion.div>
  )
}

// Premium Button Component
interface EduConnectAnimatedButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient' | 'premium'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  pulse?: boolean
  glow?: boolean
  magnetic?: boolean
  liquidFill?: boolean
}

export const EduConnectAnimatedButton: React.FC<EduConnectAnimatedButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  icon,
  pulse = false,
  glow = false,
  magnetic = false,
  liquidFill = false
}) => {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { damping: 20, stiffness: 300 })
  const springY = useSpring(y, { damping: 20, stiffness: 300 })

  const baseClasses = {
    primary: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-educonnect-medium hover:shadow-educonnect-large',
    secondary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue hover:shadow-blue',
    accent: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber hover:shadow-amber',
    ghost: 'bg-transparent border-2 border-teal-500 text-teal-600 hover:bg-teal-50',
    gradient: 'bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 text-white shadow-educonnect-large',
    premium: 'bg-gradient-to-r from-teal-500 via-teal-600 to-blue-600 text-white shadow-educonnect-xl'
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!magnetic || !ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    x.set((e.clientX - centerX) * 0.1)
    y.set((e.clientY - centerY) * 0.1)
  }

  const handleMouseLeave = () => {
    if (!magnetic) return
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      className={cn(
        baseClasses[variant],
        sizeClasses[size],
        'relative overflow-hidden rounded-xl font-medium transition-all duration-300 ease-out',
        disabled && 'opacity-50 cursor-not-allowed',
        pulse && 'animate-pulse-glow',
        glow && 'animate-educonnect-glow',
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={magnetic ? { x: springX, y: springY } : {}}
      whileHover={!disabled ? { 
        scale: 1.05,
        transition: { type: "spring", damping: 20, stiffness: 300 }
      } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      {liquidFill && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6 }}
        />
      )}
      
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center"
          >
            <motion.div
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            {icon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", damping: 20, stiffness: 300 }}
              >
                {icon}
              </motion.div>
            )}
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {children}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// Premium Input Component
interface EduConnectAnimatedInputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  label?: string
  error?: string
  icon?: React.ReactNode
  focusGlow?: boolean
  borderAnimation?: boolean
  liquidFocus?: boolean
}

export const EduConnectAnimatedInput: React.FC<EduConnectAnimatedInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className,
  label,
  error,
  icon,
  focusGlow = true,
  borderAnimation = false,
  liquidFocus = false
}) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const borderRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {label && (
        <motion.label
          className="block text-sm font-medium text-foreground mb-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {borderAnimation && (
          <motion.div
            ref={borderRef}
            className="absolute inset-0 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl opacity-0 blur-xs"
            animate={{
              opacity: isFocused ? 1 : 0,
              scale: isFocused ? 1.02 : 1
            }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {icon && (
          <motion.div
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 20, stiffness: 300 }}
          >
            {icon}
          </motion.div>
        )}
        
        <motion.input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cn(
            'w-full px-4 py-3 rounded-xl border border-border bg-input relative z-10',
            'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden',
            'transition-all duration-300 placeholder:text-muted-foreground',
            icon && 'pl-10',
            focusGlow && isFocused && 'shadow-educonnect-medium',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        />
        
        {liquidFocus && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isFocused ? "100%" : 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            className="mt-2 text-sm text-red-500"
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ duration: 0.3, type: "spring", damping: 20, stiffness: 300 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Premium Badge Component
interface EduConnectAnimatedBadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'premium'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  glow?: boolean
  bounce?: boolean
  icon?: React.ReactNode
}

export const EduConnectAnimatedBadge: React.FC<EduConnectAnimatedBadgeProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  pulse = false,
  glow = false,
  bounce = false,
  icon
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border border-teal-300',
    secondary: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
    success: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
    warning: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300',
    error: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300',
    info: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
    premium: 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-educonnect-medium'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        pulse && 'animate-pulse-soft',
        glow && 'animate-educonnect-glow',
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        ...(bounce && {
          y: [0, -2, 0],
          transition: {
            y: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        })
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", damping: 20, stiffness: 300 }}
        >
          {icon}
        </motion.div>
      )}
      {children}
    </motion.span>
  )
}

// Premium Progress Component
interface EduConnectAnimatedProgressProps {
  value: number
  max?: number
  className?: string
  showValue?: boolean
  animated?: boolean
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  gradient?: boolean
  glow?: boolean
  pulse?: boolean
}

export const EduConnectAnimatedProgress: React.FC<EduConnectAnimatedProgressProps> = ({
  value,
  max = 100,
  className,
  showValue = true,
  animated = true,
  color = 'primary',
  gradient = true,
  glow = false,
  pulse = false
}) => {
  const percentage = Math.min((value / max) * 100, 100)

  const colorClasses = {
    primary: gradient ? 'bg-gradient-to-r from-teal-500 to-teal-600' : 'bg-teal-500',
    secondary: gradient ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-blue-500',
    success: gradient ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-green-500',
    warning: gradient ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-amber-500',
    error: gradient ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-red-500'
  }

  return (
    <motion.div
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">Progress</span>
        {showValue && (
          <motion.span
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {Math.round(percentage)}%
          </motion.span>
        )}
      </div>
      
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden shadow-inner">
        <motion.div
          className={cn(
            'h-full rounded-full relative',
            colorClasses[color],
            glow && 'shadow-educonnect-medium',
            pulse && 'animate-pulse-soft'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: animated ? 2 : 0,
            ease: "easeInOut",
            delay: 0.3
          }}
        >
          {gradient && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"
              animate={{
                x: ["-100%", "100%"],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

// Premium Modal Component
interface EduConnectAnimatedModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  blur?: boolean
  glassmorphism?: boolean
}

export const EduConnectAnimatedModal: React.FC<EduConnectAnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className,
  size = 'md',
  blur = true,
  glassmorphism = false
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            className={cn(
              "absolute inset-0",
              blur ? "backdrop-blur-md" : "",
              glassmorphism ? "bg-black/30" : "bg-black/50"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal Content */}
          <motion.div
            className={cn(
              'relative w-full bg-card border border-border rounded-2xl shadow-educonnect-xl max-h-[90vh] overflow-hidden',
              sizeClasses[size],
              glassmorphism && 'bg-white/80 backdrop-blur-md',
              className
            )}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <motion.div
                className="px-6 py-4 border-b border-border"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              </motion.div>
            )}
            
            <motion.div
              className="p-6 overflow-y-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Premium Floating Action Button
interface EduConnectFloatingActionButtonProps {
  onClick: () => void
  icon: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  variant?: 'primary' | 'secondary' | 'accent'
  pulse?: boolean
  magnetic?: boolean
  trail?: boolean
}

export const EduConnectFloatingActionButton: React.FC<EduConnectFloatingActionButtonProps> = ({
  onClick,
  icon,
  className,
  size = 'md',
  position = 'bottom-right',
  variant = 'primary',
  pulse = false,
  magnetic = false,
  trail = false
}) => {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-educonnect-large',
    secondary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue',
    accent: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!magnetic || !ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    x.set((e.clientX - centerX) * 0.1)
    y.set((e.clientY - centerY) * 0.1)
  }

  const handleMouseLeave = () => {
    if (!magnetic) return
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      className={cn(
        'fixed z-50 rounded-full flex items-center justify-center',
        'transition-all duration-300 ease-out',
        sizeClasses[size],
        positionClasses[position],
        variantClasses[variant],
        pulse && 'animate-pulse-glow',
        className
      )}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={magnetic ? { x, y } : {}}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotate: 0,
        ...(trail && {
          boxShadow: [
            "0 0 0 0 rgba(20, 184, 166, 0.4)",
            "0 0 0 20px rgba(20, 184, 166, 0)",
            "0 0 0 0 rgba(20, 184, 166, 0.4)"
          ]
        })
      }}
      transition={{ 
        type: "spring", 
        damping: 20, 
        stiffness: 300,
        ...(trail && {
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        })
      }}
    >
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
          transition: {
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }
        }}
      >
        {icon}
      </motion.div>
    </motion.button>
  )
}

// Premium List Item Component
interface EduConnectAnimatedListItemProps {
  children: React.ReactNode
  className?: string
  index?: number
  onClick?: () => void
  hover?: 'lift' | 'slide' | 'glow' | 'scale'
  icon?: React.ReactNode
  badge?: React.ReactNode
  divider?: boolean
}

export const EduConnectAnimatedListItem: React.FC<EduConnectAnimatedListItemProps> = ({
  children,
  className,
  index = 0,
  onClick,
  hover = 'slide',
  icon,
  badge,
  divider = true
}) => {
  const hoverVariants = {
    lift: { y: -2, scale: 1.01 },
    slide: { x: 8, backgroundColor: "rgba(20, 184, 166, 0.05)" },
    glow: { boxShadow: "0 4px 20px rgba(20, 184, 166, 0.15)" },
    scale: { scale: 1.02 }
  }

  return (
    <motion.div
      className={cn(
        'flex items-center gap-3 p-4 transition-all duration-300',
        onClick && 'cursor-pointer',
        divider && 'border-b border-border last:border-b-0',
        className
      )}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      whileHover={hoverVariants[hover]}
    >
      {icon && (
        <motion.div
                        className="shrink-0 text-teal-500"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: (index * 0.1) + 0.2, type: "spring", damping: 20, stiffness: 300 }}
        >
          {icon}
        </motion.div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {badge && (
        <motion.div
                        className="shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: (index * 0.1) + 0.3, duration: 0.3 }}
        >
          {badge}
        </motion.div>
      )}
    </motion.div>
  )
}

// Premium Text Animation Component
interface EduConnectAnimatedTextProps {
  children: string
  className?: string
  variant?: 'typewriter' | 'fadeIn' | 'slideUp' | 'wave' | 'glow' | 'gradient'
  speed?: number
  delay?: number
  repeat?: boolean
}

export const EduConnectAnimatedText: React.FC<EduConnectAnimatedTextProps> = ({
  children,
  className,
  variant = 'fadeIn',
  speed = 50,
  delay = 0,
  repeat = false
}) => {
  const [displayText, setDisplayText] = React.useState('')
  const [currentIndex, setCurrentIndex] = React.useState(0)

  React.useEffect(() => {
    if (variant === 'typewriter') {
      const timeout = setTimeout(() => {
        if (currentIndex < children.length) {
          setDisplayText(children.slice(0, currentIndex + 1))
          setCurrentIndex(currentIndex + 1)
        } else if (repeat) {
          setCurrentIndex(0)
          setDisplayText('')
        }
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, children, speed, repeat, variant])

  const variants = {
    typewriter: {
      animate: {
        transition: { staggerChildren: 0.1 }
      }
    },
    fadeIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 }
    },
    wave: {
      initial: { y: 0 },
      animate: {
        y: [0, -10, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const
        }
      }
    },
    glow: {
      initial: { textShadow: "0 0 5px rgba(20, 184, 166, 0.3)" },
      animate: {
        textShadow: [
          "0 0 5px rgba(20, 184, 166, 0.3)",
          "0 0 20px rgba(20, 184, 166, 0.6)",
          "0 0 5px rgba(20, 184, 166, 0.3)"
        ],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const
        }
      }
    },
    gradient: {
      initial: { backgroundPosition: "0% 50%" },
      animate: {
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut" as const
        }
      }
    }
  }

  if (variant === 'typewriter') {
    return (
      <motion.span
        className={cn('inline-block', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
      >
        {displayText}
        <motion.span
          className="inline-block w-0.5 h-5 bg-teal-500 ml-1"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.span>
    )
  }

  if (variant === 'gradient') {
    return (
      <motion.span
        className={cn(
          'inline-block bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_200%]',
          className
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
        }}
        transition={{ 
          delay, 
          duration: 0.6, 
          ease: "easeOut" as const,
          backgroundPosition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        }}
      >
        {children}
      </motion.span>
    )
  }

  return (
    <motion.span
      className={cn('inline-block', className)}
      initial={variants[variant].initial}
      animate={variants[variant].animate}
      transition={{ delay, duration: 0.6, ease: "easeOut" as const }}
    >
      {children}
    </motion.span>
  )
}

const EduConnectAnimatedComponents = {
  EduConnectAnimatedContainer,
  EduConnectAnimatedCard,
  EduConnectAnimatedButton,
  EduConnectAnimatedInput,
  EduConnectAnimatedBadge,
  EduConnectAnimatedProgress,
  EduConnectAnimatedModal,
  EduConnectFloatingActionButton,
  EduConnectAnimatedListItem,
  EduConnectAnimatedText
}

export default EduConnectAnimatedComponents