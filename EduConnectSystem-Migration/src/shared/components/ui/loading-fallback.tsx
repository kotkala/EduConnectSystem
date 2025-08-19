import { cn } from "@/lib/utils"

interface LoadingFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export function LoadingFallback({ size = 'md', className, ...props }: LoadingFallbackProps) {
  const height = size === 'lg' ? 'h-96' : size === 'md' ? 'h-40' : size === 'sm' ? 'h-24' : 'h-12'
  return (
    <div
      className={cn("bg-accent animate-pulse rounded-md", height, className)}
      {...props}
    />
  )
}

