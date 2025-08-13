import { NextResponse } from 'next/server'
import { getUnreadNotificationCountAction } from '@/lib/actions/notification-actions'

export async function GET() {
  try {
    const result = await getUnreadNotificationCountAction()
    if (result.success && typeof result.data === 'number') {
      return NextResponse.json({ success: true, unread: result.data })
    }
    return NextResponse.json({ success: true, unread: 0 })
  } catch (error) {
    console.error('Unread count API error:', error)
    return NextResponse.json({ success: true, unread: 0 })
  }
}


