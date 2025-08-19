'use client'

import { useState, useEffect, useCallback } from 'react'
// Switched to API route fetch to avoid calling server action inside client hook

export function useViolationAlertCount() {
  const [alertCount, setAlertCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadAlertCount = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/violations/alerts-count', { cache: 'no-store' })
      const json = await res.json()
      if (json?.success) setAlertCount(json.count || 0)
      else setAlertCount(0)
    } catch (error) {
      console.error('Lỗi tải số cảnh báo:', error)
      setAlertCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCount = useCallback(() => {
    loadAlertCount()
  }, [loadAlertCount])

  useEffect(() => {
    loadAlertCount()
  }, [loadAlertCount])

  // Listen for custom event to refresh count
  useEffect(() => {
    const handleViolationAlertUpdate = () => {
      loadAlertCount()
    }

    window.addEventListener('violation-alert-updated', handleViolationAlertUpdate)
    return () => {
      window.removeEventListener('violation-alert-updated', handleViolationAlertUpdate)
    }
  }, [loadAlertCount])

  // Refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadAlertCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadAlertCount])

  return {
    alertCount,
    isLoading,
    refreshCount
  }
}
