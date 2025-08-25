import { Skeleton } from "@/shared/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Responsive skeleton configurations theo Context7 best practices
const responsiveConfigs = {
  // Card/Container loading
  card: 'h-32 w-full rounded-lg md:h-40 lg:h-48',
  // Text content loading  
  text: 'h-3 w-full rounded md:h-4 lg:h-4',
  // Title loading
  title: 'h-4 w-1/2 rounded md:h-5 md:w-2/3 lg:h-6 lg:w-3/4',
  // Avatar/Icon loading
  avatar: 'h-8 w-8 rounded-full md:h-10 lg:h-12',
  // Button loading
  button: 'h-8 w-16 rounded-md md:h-9 md:w-20 lg:h-10 lg:w-24',
  // Input loading
  input: 'h-8 w-full rounded-md md:h-9 lg:h-10',
  // Table row loading
  table: 'h-8 w-full rounded md:h-10 lg:h-12',
  // List item loading
  list: 'h-12 w-full rounded md:h-14 lg:h-16',
  // Grid item loading
  grid: 'h-24 w-full rounded-lg md:h-28 lg:h-32',
  // Sidebar item loading
  sidebar: 'h-6 w-full rounded md:h-7 lg:h-8',
  // Form loading
  form: 'h-16 w-full rounded-lg md:h-18 lg:h-20',
  // Chart loading
  chart: 'h-48 w-full rounded-lg md:h-56 lg:h-64',
  // Modal loading
  modal: 'h-64 w-full rounded-lg md:h-80 lg:h-96',
  // Navigation loading
  navigation: 'h-8 w-full rounded md:h-9 lg:h-10',
  // Footer loading
  footer: 'h-16 w-full rounded md:h-18 lg:h-20',
  // Header loading
  header: 'h-12 w-full rounded md:h-14 lg:h-16',
  // Default fallback
  default: 'h-8 w-full rounded-md md:h-10 lg:h-12'
} as const

type SkeletonType = keyof typeof responsiveConfigs

// Utility function để tạo responsive skeleton class
export function getResponsiveSkeletonClass(type: SkeletonType, customClasses?: string) {
  const baseClass = responsiveConfigs[type] || responsiveConfigs.default
  return customClasses ? cn(baseClass, customClasses) : baseClass
}

// Responsive Skeleton Components theo Context7
export function ResponsiveSkeleton({ 
  type = 'default', 
  ...props
}: React.ComponentProps<typeof Skeleton> & { type?: SkeletonType }) {
  return (
    <Skeleton 
      className={getResponsiveSkeletonClass(type)} 
      {...props} 
    />
  )
}

// Pre-built skeleton components cho common use cases
export function CardSkeleton({ ...props }: React.ComponentProps<typeof Skeleton>) {
  return (
    <div className="space-y-4">
      <Skeleton className={getResponsiveSkeletonClass('title')} {...props} />
      <div className="space-y-2">
        <Skeleton className={getResponsiveSkeletonClass('text')} />
        <Skeleton className={getResponsiveSkeletonClass('text')} />
        <Skeleton className={getResponsiveSkeletonClass('text')} />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className={getResponsiveSkeletonClass('avatar')} />
        <Skeleton className={getResponsiveSkeletonClass('text')} />
      </div>
    </div>
  )
}

export function TableSkeleton({ rowCount = 5, ...props }: React.ComponentProps<typeof Skeleton> & { rowCount?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-4">
        <Skeleton className={getResponsiveSkeletonClass('title')} {...props} />
        <Skeleton className={getResponsiveSkeletonClass('button')} />
        <Skeleton className={getResponsiveSkeletonClass('button')} />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rowCount }).map((_, i) => (
          <Skeleton key={i} className={getResponsiveSkeletonClass('table')} />
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ itemCount = 4 }: React.ComponentProps<typeof Skeleton> & { itemCount?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className={getResponsiveSkeletonClass('avatar')} />
          <div className="flex-1 space-y-2">
            <Skeleton className={getResponsiveSkeletonClass('text')} />
            <Skeleton className={getResponsiveSkeletonClass('text')} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton({ fieldCount = 3, ...props }: React.ComponentProps<typeof Skeleton> & { fieldCount?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className={getResponsiveSkeletonClass('title')} {...props} />
      {Array.from({ length: fieldCount }).map((_, i) => (
        <Skeleton key={i} className={getResponsiveSkeletonClass('input')} />
      ))}
      <div className="flex space-x-2">
        <Skeleton className={getResponsiveSkeletonClass('button')} />
        <Skeleton className={getResponsiveSkeletonClass('button')} />
      </div>
    </div>
  )
}

export function GridSkeleton({ itemCount = 6, ...props }: React.ComponentProps<typeof Skeleton> & { itemCount?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: itemCount }).map((_, i) => (
        <Skeleton key={i} className={getResponsiveSkeletonClass('grid')} {...props} />
      ))}
    </div>
  )
}

// React Suspense compatible skeleton cho dynamic imports
export function SuspenseSkeleton({ ...props }: React.ComponentProps<typeof Skeleton>) {
  return <Skeleton className={getResponsiveSkeletonClass('avatar')} {...props} />
}

// Export types
export type { SkeletonType }
