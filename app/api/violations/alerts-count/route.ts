import { NextResponse } from 'next/server'
import { getUnseenViolationAlertsCountAction } from '@/lib/actions/violation-actions'

export async function GET() {
  const result = await getUnseenViolationAlertsCountAction()
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error || 'unknown' }, { status: 500 })
  }
  return NextResponse.json({ success: true, count: result.count ?? 0 })
}


