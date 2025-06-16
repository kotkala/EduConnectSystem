'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'

/**
 * Analytics component for tracking Web Vitals and user behavior
 * Based on Next.js Context7 best practices
 */
export function Analytics() {
  useReportWebVitals((metric) => {
    // Log metrics for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric)
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to your analytics service
      // gtag('event', metric.name, {
      //   value: Math.round(metric.value),
      //   event_label: metric.id,
      //   non_interaction: true,
      // })
      
      // Example: Send to Vercel Analytics
      // if (window.va) {
      //   window.va('track', metric.name, { value: metric.value })
      // }
    }
  })

  useEffect(() => {
    // Initialize other analytics services here
    // Example: Google Analytics, Mixpanel, etc.
    
    if (process.env.NODE_ENV === 'production') {
      // Track page views, user events, etc.
    }
  }, [])

  return null
} 