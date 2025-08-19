export default function Loading() {
  return (
    <div className="container-modern spacing-desktop">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-orange-100 rounded-2xl animate-pulse"></div>
          <div className="h-4 w-72 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
        
        {/* Student dashboard skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Schedule card */}
            <div className="card-modern p-6 space-y-4">
              <div className="h-6 w-40 bg-orange-100 rounded-xl animate-pulse"></div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 25 }, (_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Assignments card */}
            <div className="card-modern p-6 space-y-4">
              <div className="h-6 w-32 bg-orange-100 rounded-xl animate-pulse"></div>
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-50 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="card-modern p-4 space-y-4">
              <div className="h-5 w-24 bg-orange-100 rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-8 bg-gray-50 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Notifications */}
            <div className="card-modern p-4 space-y-3">
              <div className="h-5 w-28 bg-orange-100 rounded-lg animate-pulse"></div>
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-4 w-full bg-gray-50 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
