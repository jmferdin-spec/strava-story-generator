import type { StravaAthlete, StravaActivity, StravaLap, UnitSystem } from '@/types';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

// ─── OAuth URLs ────────────────────────────────────────────────────────────────

export function getStravaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: process.env.STRAVA_REDIRECT_URI!,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

// ─── Token Exchange ────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: StravaAthlete;
  token_type: string;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Strava token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Strava token');
  }

  return response.json();
}

// ─── API Helpers ───────────────────────────────────────────────────────────────

async function stravaFetch<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Strava API error ${response.status}: ${error}`);
  }

  return response.json();
}

// ─── API Methods ───────────────────────────────────────────────────────────────

export async function getAthlete(accessToken: string): Promise<StravaAthlete> {
  return stravaFetch<StravaAthlete>('/athlete', accessToken);
}

export async function getActivities(
  accessToken: string,
  page: number = 1,
  perPage: number = 30
): Promise<StravaActivity[]> {
  const activities = await stravaFetch<StravaActivity[]>(
    `/athlete/activities?page=${page}&per_page=${perPage}`,
    accessToken
  );

  // Filter to running activities only
  return activities.filter(
    (activity) =>
      activity.type === 'Run' ||
      activity.sport_type === 'Run' ||
      activity.sport_type === 'TrailRun' ||
      activity.sport_type === 'VirtualRun'
  );
}

export async function getActivityById(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  return stravaFetch<StravaActivity>(`/activities/${activityId}`, accessToken);
}

export async function getActivityLaps(
  accessToken: string,
  activityId: number
): Promise<StravaLap[]> {
  return stravaFetch<StravaLap[]>(`/activities/${activityId}/laps`, accessToken);
}

// ─── Unit Conversion Constants ────────────────────────────────────────────────

const METERS_PER_MILE = 1609.344;
const METERS_PER_FOOT = 0.3048;

// ─── Formatting Utilities ──────────────────────────────────────────────────────

export function formatDistance(meters: number, units: UnitSystem = 'metric'): string {
  if (units === 'imperial') {
    const miles = meters / METERS_PER_MILE;
    if (miles < 10) return `${miles.toFixed(2)} mi`;
    return `${miles.toFixed(1)} mi`;
  }
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(2)} km`;
  return `${km.toFixed(1)} km`;
}

export function formatDistanceValue(meters: number, units: UnitSystem = 'metric'): string {
  if (units === 'imperial') {
    return (meters / METERS_PER_MILE).toFixed(2);
  }
  return (meters / 1000).toFixed(2);
}

export function formatDistanceUnit(units: UnitSystem = 'metric'): string {
  return units === 'imperial' ? 'mi' : 'km';
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatPace(metersPerSecond: number, units: UnitSystem = 'metric'): string {
  if (metersPerSecond === 0) return '–';
  if (units === 'imperial') {
    const secondsPerMile = METERS_PER_MILE / metersPerSecond;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.round(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /mi`;
  }
  const secondsPerKm = 1000 / metersPerSecond;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

export function formatPaceValue(metersPerSecond: number, units: UnitSystem = 'metric'): string {
  if (metersPerSecond === 0) return '–';
  if (units === 'imperial') {
    const secondsPerMile = METERS_PER_MILE / metersPerSecond;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.round(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  const secondsPerKm = 1000 / metersPerSecond;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatPaceUnit(units: UnitSystem = 'metric'): string {
  return units === 'imperial' ? '/mi' : '/km';
}

export function formatElevation(meters: number, units: UnitSystem = 'metric'): string {
  if (units === 'imperial') {
    return `${Math.round(meters / METERS_PER_FOOT)}ft`;
  }
  return `${Math.round(meters)}m`;
}

export function formatElevationUnit(units: UnitSystem = 'metric'): string {
  return units === 'imperial' ? 'ft' : 'm';
}

export function formatCalories(calories: number): string {
  if (calories >= 1000) return `${(calories / 1000).toFixed(1)}k`;
  return `${Math.round(calories)}`;
}

export function formatHeartRate(bpm: number): string {
  return `${Math.round(bpm)}`;
}

export interface FormattedLap {
  index: number;
  distance: string;
  pace: string;
  time: string;
}

export function formatLaps(laps: StravaLap[], units: UnitSystem = 'imperial'): FormattedLap[] {
  if (laps.length === 0) return [];
  // Filter out rest laps: anything slower than ~18:00/mi (1.5 m/s) is walking/standing
  const runLaps = laps.filter((lap) => lap.average_speed >= 1.5);
  return runLaps.map((lap, i) => ({
    index: i + 1,
    distance: units === 'imperial'
      ? (lap.distance / METERS_PER_MILE).toFixed(2)
      : (lap.distance / 1000).toFixed(2),
    pace: formatPaceValue(lap.average_speed, units),
    time: formatTime(lap.moving_time),
  }));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
