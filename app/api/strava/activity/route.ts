import { NextRequest, NextResponse } from 'next/server';
import { getActivityById, refreshAccessToken } from '@/lib/strava';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing activity id' }, { status: 400 });
  }

  let accessToken = request.cookies.get('strava_access_token')?.value;
  const refreshToken = request.cookies.get('strava_refresh_token')?.value;
  const expiresAt = request.cookies.get('strava_expires_at')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if token needs refresh
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt && parseInt(expiresAt) < now + 300) {
    if (!refreshToken) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    try {
      const newTokenData = await refreshAccessToken(refreshToken);
      accessToken = newTokenData.access_token;

      const activity = await getActivityById(accessToken, parseInt(id));
      const response = NextResponse.json({ activity });

      response.cookies.set('strava_access_token', newTokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: newTokenData.expires_in,
        path: '/',
      });

      response.cookies.set('strava_expires_at', String(newTokenData.expires_at), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 4,
        path: '/',
      });

      return response;
    } catch {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
    }
  }

  try {
    const activity = await getActivityById(accessToken, parseInt(id));
    return NextResponse.json({ activity });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching activity:', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
