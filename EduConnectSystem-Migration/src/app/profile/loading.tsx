export default function Loading() {
  return (
    <div className="container-modern spacing-desktop">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-orange-100 rounded-2xl animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
        
        {/* Profile content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile info */}
          <div className="lg:col-span-1">
            <div className="card-modern p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="h-24 w-24 bg-gray-100 rounded-full animate-pulse"></div>
                <div className="space-y-2 text-center">
                  <div className="h-6 w-32 bg-gray-100 rounded-lg animate-pulse mx-auto"></div>
                  <div className="h-4 w-24 bg-gray-50 rounded-lg animate-pulse mx-auto"></div>
                </div>
              </div>
              
              {/* Quick info */}
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-50 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Profile details */}
          <div className="lg:col-span-2">
            <div className="card-modern p-6 space-y-6">
              {/* Tabs skeleton */}
              <div className="flex space-x-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
              
              {/* Form skeleton */}
              <div className="space-y-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-50 rounded-xl animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              {/* Action buttons */}
              <div className="flex space-x-3">
                <div className="h-10 w-24 bg-orange-100 rounded-xl animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-100 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
