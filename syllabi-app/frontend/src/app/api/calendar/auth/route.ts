import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/googleCalendar';

export async function GET(request: NextRequest) {
  try {
    const authUrl = await getAuthUrl();
    
    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate authorization URL',
      },
      { status: 500 }
    );
  }
}
