export default function Loading() {
  return (
    <div className="container-modern spacing-desktop">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-80 bg-orange-100 rounded-2xl animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
        
        {/* Student info skeleton */}
        <div className="card-modern p-6 space-y-4">
          <div className="h-6 w-48 bg-orange-100 rounded-xl animate-pulse"></div>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-100 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-50 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card-modern p-4 space-y-3">
              <div className="h-8 w-8 bg-orange-100 rounded-lg animate-pulse"></div>
              <div className="h-5 w-28 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-4 w-full bg-gray-50 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
