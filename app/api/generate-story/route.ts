import { NextRequest, NextResponse } from 'next/server';
import type { StoryConfig } from '@/types';
import { generateStoryHtml } from '@/lib/storyTemplates';
import { generateRouteSvg } from '@/lib/routeRenderer';
import {
  formatDistanceValue, formatTime, formatPaceValue,
  formatElevation, formatDateShort,
} from '@/lib/strava';

const STORY_WIDTH  = 1080;
const STORY_HEIGHT = 1920;
export const runtime = 'nodejs';

// ─── Routing logic ─────────────────────────────────────────────────────────────
//
// If EXPORT_SERVICE_URL is set (Railway), proxy the request there.
// Otherwise fall back to rendering locally with @sparticuz/chromium.
// This means local dev always works, and prod uses Railway for reliability.

const EXPORT_SERVICE_URL    = process.env.EXPORT_SERVICE_URL || '';
const EXPORT_SERVICE_SECRET = process.env.EXPORT_SERVICE_SECRET || '';

interface GenerateRequest {
  config: StoryConfig;
  backgroundImageBase64?: string;
}

// ─── POST /api/generate-story ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { config, backgroundImageBase64 } = body;
  if (!config) return NextResponse.json({ error: 'Missing config' }, { status: 400 });

  // ── Proxy to Railway if configured ──────────────────────────────────────────
  if (EXPORT_SERVICE_URL) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (EXPORT_SERVICE_SECRET) headers['x-api-secret'] = EXPORT_SERVICE_SECRET;

      const upstream = await fetch(`${EXPORT_SERVICE_URL}/generate`, {
        method:  'POST',
        headers,
        body:    JSON.stringify({ config, backgroundImageBase64 }),
        // No timeout needed here — Railway handles it on its end.
        // Vercel will pass through whatever Railway returns.
      });

      if (!upstream.ok) {
        const err = await upstream.json().catch(() => ({ error: 'Export service error' }));
        return NextResponse.json(err, { status: upstream.status });
      }

      const png = await upstream.arrayBuffer();
      return new NextResponse(png, {
        status: 200,
        headers: {
          'Content-Type':        'image/png',
          'Content-Disposition': 'attachment; filename="strava-story.png"',
          'Cache-Control':       'no-cache',
        },
      });
    } catch (err) {
      console.error('[proxy] Export service unreachable:', err);
      return NextResponse.json(
        { error: 'Export service is currently unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }
  }

  // ── Local fallback: render with @sparticuz/chromium ─────────────────────────
  // Used in local dev (no EXPORT_SERVICE_URL set).
  return renderLocally(config, backgroundImageBase64);
}

// ─── Local renderer ────────────────────────────────────────────────────────────

async function renderLocally(
  config: StoryConfig,
  backgroundImageBase64?: string
): Promise<NextResponse> {
  const activity = config.activity;
  const stats = activity
    ? {
        distance:  formatDistanceValue(activity.distance),
        time:      formatTime(activity.moving_time),
        pace:      formatPaceValue(activity.average_speed),
        elevation: formatElevation(activity.total_elevation_gain),
        date:      formatDateShort(activity.start_date_local),
      }
    : { distance: '10.00', time: '52:30', pace: '5:15', elevation: '120m', date: 'Jan 1, 2024' };

  let routeSvg: string | undefined;
  if (config.showRoute && activity?.map?.summary_polyline) {
    routeSvg = generateRouteSvg(activity.map.summary_polyline, {
      width:         STORY_WIDTH,
      height:        STORY_HEIGHT * 0.4,
      color:         config.routeColor,
      thickness:     config.routeThickness,
      opacity:       config.routeOpacity,
      padding:       80,
      glowIntensity: config.routeGlowIntensity ?? 1,
    });
  }

  const backgroundImage = backgroundImageBase64 ?? config.backgroundImage;
  const html = generateStoryHtml({
    backgroundImage, routeSvg, stats,
    visibleStats: config.visibleStats,
    config: { ...config, backgroundImage },
  });

  let browser;
  try {
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      const chromium = await import('@sparticuz/chromium');
      const puppeteer = await import('puppeteer-core');
      browser = await puppeteer.default.launch({
        args:              chromium.default.args,
        defaultViewport:   chromium.default.defaultViewport,
        executablePath:    await chromium.default.executablePath(),
        headless:          chromium.default.headless,
      });
    } else {
      // Local dev — find system Chrome
      const puppeteer = await import('puppeteer-core');
      const { existsSync } = await import('fs');
      const paths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
      ];
      const executablePath = paths.find(existsSync);
      if (!executablePath) throw new Error('No Chrome found locally. Install Google Chrome.');
      browser = await puppeteer.default.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: STORY_WIDTH, height: STORY_HEIGHT, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: ['networkidle0', 'domcontentloaded'], timeout: 25000 });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise((r) => setTimeout(r, 350));

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: STORY_WIDTH, height: STORY_HEIGHT },
    });
    await browser.close();

    return new NextResponse(new Uint8Array(screenshot), {
      status: 200,
      headers: {
        'Content-Type':        'image/png',
        'Content-Disposition': 'attachment; filename="strava-story.png"',
        'Cache-Control':       'no-cache',
      },
    });
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Render failed: ${msg}` }, { status: 500 });
  }
}

// ─── GET /api/generate-story?config=... ───────────────────────────────────────
// Returns raw HTML — used by the iframe preview in the editor. Never proxied.

export async function GET(request: NextRequest) {
  const configParam = request.nextUrl.searchParams.get('config');
  if (!configParam) return NextResponse.json({ error: 'Missing config' }, { status: 400 });

  try {
    const config: StoryConfig = JSON.parse(decodeURIComponent(configParam));
    const activity = config.activity;
    const stats = activity
      ? {
          distance:  formatDistanceValue(activity.distance),
          time:      formatTime(activity.moving_time),
          pace:      formatPaceValue(activity.average_speed),
          elevation: formatElevation(activity.total_elevation_gain),
          date:      formatDateShort(activity.start_date_local),
        }
      : { distance: '10.00', time: '52:30', pace: '5:15', elevation: '120m', date: 'Jan 1, 2024' };

    let routeSvg: string | undefined;
    if (config.showRoute && activity?.map?.summary_polyline) {
      routeSvg = generateRouteSvg(activity.map.summary_polyline, {
        width: STORY_WIDTH, height: STORY_HEIGHT * 0.4,
        color: config.routeColor, thickness: config.routeThickness,
        opacity: config.routeOpacity, padding: 80,
        glowIntensity: config.routeGlowIntensity ?? 1,
      });
    }

    const html = generateStoryHtml({
      backgroundImage: config.backgroundImage, routeSvg, stats,
      visibleStats: config.visibleStats, config,
    });

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch {
    return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
  }
}
