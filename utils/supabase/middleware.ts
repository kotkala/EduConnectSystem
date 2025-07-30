import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Skip Supabase auth in Edge Runtime to avoid Node.js API conflicts
  // This is a temporary workaround for Edge Runtime compatibility

  // For now, just pass through all requests without auth checks
  // TODO: Implement Edge Runtime compatible auth solution
  return NextResponse.next({
    request,
  })


}
