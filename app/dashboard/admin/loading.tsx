export default function Loading() {
  return (
    <div className="container-modern spacing-desktop">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-orange-100 rounded-2xl animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
        
        {/* Cards skeleton */}
        <div className="grid-responsive">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card-modern p-6 space-y-4">
              <div className="h-6 w-32 bg-orange-100 rounded-xl animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-4 w-full bg-gray-50 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Table skeleton */}
        <div className="card-modern p-6 space-y-4">
          <div className="h-6 w-48 bg-orange-100 rounded-xl animate-pulse"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 w-1/6 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
