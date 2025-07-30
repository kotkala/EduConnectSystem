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
        let url = '/api/exchange-requests'

        if (role === 'teacher') {
          // Teacher sees only their requests
          url += `?teacher_id=${userId}`
        } else if (role !== 'admin') {
          return
        }

        const response = await fetch(url)
        const result = await response.json()

        if (result.success && result.data) {
          const requests = result.data as Record<string, unknown>[]
          const pending = requests.filter(req => req.status === 'pending').length
          setCounts({ pending, total: requests.length })
        }
      } catch (error) {
        console.error('Error fetching exchange requests count:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchCounts, 30000)

    return () => clearInterval(interval)
  }, [role, userId])

  return { counts, loading }
}
