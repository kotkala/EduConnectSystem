"use client"

import { useState, useEffect } from "react"

interface ExchangeRequestsCount {
  pending: number
  total: number
}

export function useExchangeRequestsCount(role: string, userId?: string) {
  const [counts, setCounts] = useState<ExchangeRequestsCount>({ pending: 0, total: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    const fetchCounts = async () => {
      setLoading(true)
      try {
        // Use lightweight count on primary endpoint with query params
        const url = new URL('/api/exchange-requests', window.location.origin)
        url.searchParams.set('count', 'true')
        if (role === 'teacher') {
          url.searchParams.set('teacher_id', userId)
        } else if (role !== 'admin') {
          setLoading(false)
          return
        }

        const response = await fetch(url.toString(), { cache: 'no-store' })
        const result = await response.json()

        if (result.success && typeof result.data?.total === 'number') {
          const total: number = result.data.total
          const pending: number = result.data.pending ?? 0
          setCounts({ pending, total })
        }
      } catch (error) {
        console.error('Error fetching exchange requests count:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()

    // Back off polling further to reduce network usage
    const interval = setInterval(fetchCounts, 180000)

    return () => clearInterval(interval)
  }, [role, userId])

  return { counts, loading }
}
