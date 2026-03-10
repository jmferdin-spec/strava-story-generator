import { NextRequest, NextResponse } from 'next/server';
import { getActivities, refreshAccessToken } from '@/lib/strava';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Token expired, please re-authenticate' }, { status: 401 });
    }

    try {
      const newTokenData = await refreshAccessToken(refreshToken);
      accessToken = newTokenData.access_token;

      const activities = await getActivities(accessToken, 1, 20);
      const response = NextResponse.json({ activities });

      // Update tokens in cookies
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
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });

      return response;
    } catch {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
    }
  }

  try {
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const activities = await getActivities(accessToken, page, 20);
    return NextResponse.json({ activities });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching activities:', err);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// Logout endpoint
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('strava_access_token');
  response.cookies.delete('strava_refresh_token');
  response.cookies.delete('strava_expires_at');
  response.cookies.delete('strava_athlete');
  return response;
}
