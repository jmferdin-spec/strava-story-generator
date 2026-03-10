import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/strava';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent('Strava authorization denied')}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent('No authorization code received')}`, request.url)
    );
  }

  try {
    const tokenData = await exchangeCodeForToken(code);

    // Store tokens in secure HTTP-only cookies
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    response.cookies.set('strava_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/',
    });

    response.cookies.set('strava_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    response.cookies.set('strava_expires_at', String(tokenData.expires_at), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    // Store athlete info in a readable cookie for the client
    response.cookies.set(
      'strava_athlete',
      JSON.stringify({
        id: tokenData.athlete.id,
        firstname: tokenData.athlete.firstname,
        lastname: tokenData.athlete.lastname,
        profile: tokenData.athlete.profile,
        city: tokenData.athlete.city,
        country: tokenData.athlete.country,
      }),
      {
        httpOnly: false, // Client-readable
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      }
    );

    return response;
  } catch (err) {
    console.error('Strava OAuth error:', err);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent('Failed to authenticate with Strava')}`, request.url)
    );
  }
}
