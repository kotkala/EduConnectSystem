import { cn } from "@/lib/utils"
import { memo } from "react"

interface SkeletonProps extends React.ComponentProps<"div"> {
  readonly className?: string
}

const Skeleton = memo<SkeletonProps>(({ className, ...props }) => {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
})

Skeleton.displayName = "Skeleton"

export { Skeleton }
