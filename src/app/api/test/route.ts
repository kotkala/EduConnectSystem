import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API working!', 
    timestamp: new Date().toISOString() 
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST working!', 
    timestamp: new Date().toISOString() 
  });
} 