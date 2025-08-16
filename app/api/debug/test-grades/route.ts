import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 DEBUG: Test grades API endpoint called')
  
  return NextResponse.json({
    success: true,
    message: 'Test API endpoint working',
    timestamp: new Date().toISOString()
  })
}
