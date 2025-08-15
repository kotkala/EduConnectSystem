'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { debugGradesAction } from '@/lib/actions/detailed-grade-actions'

export default function DebugGradesPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleDebug = async () => {
    setLoading(true)
    try {
      const result = await debugGradesAction()
      setDebugData(result)
    } catch (error) {
      console.error('Debug error:', error)
      setDebugData({ error: 'Failed to debug' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug Grades</h1>
      
      <Button onClick={handleDebug} disabled={loading}>
        {loading ? 'Loading...' : 'Debug Grades Data'}
      </Button>

      {debugData && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
