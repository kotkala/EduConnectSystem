export default function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600"></div>
        <p className="text-sm text-muted-foreground">Đang tải dashboard...</p>
      </div>
    </div>
  )
}
