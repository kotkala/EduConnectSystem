export default function Loading() {
  return (
    <div className="container-modern spacing-desktop">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-72 bg-orange-100 rounded-2xl animate-pulse"></div>
          <div className="h-4 w-80 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
        
        {/* Quick stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card-modern p-4 space-y-3">
              <div className="h-5 w-24 bg-orange-100 rounded-lg animate-pulse"></div>
              <div className="h-7 w-16 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Schedule skeleton */}
        <div className="card-modern p-6 space-y-4">
          <div className="h-6 w-40 bg-orange-100 rounded-xl animate-pulse"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
