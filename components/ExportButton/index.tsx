'use client';

import { useState, useCallback } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { generateStoryHtml } from '@/lib/storyTemplates';
import { generateRouteSvg } from '@/lib/routeRenderer';
import {
  formatDistanceValue, formatTime, formatPaceValue,
  formatElevation, formatDateShort,
} from '@/lib/strava';
import type { UnitSystem } from '@/types';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

// Render story HTML to PNG blob in the browser
async function renderStoryToPng(html: string): Promise<Blob> {
  
  // Create hidden container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = `${STORY_WIDTH}px`;
  container.style.height = `${STORY_HEIGHT}px`;
  container.style.overflow = 'hidden';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  // Parse the HTML and extract body content + styles
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Copy all style tags from the generated HTML
  const styles = doc.querySelectorAll('style');
  styles.forEach((style) => {
    const cloned = document.createElement('style');
    cloned.textContent = style.textContent;
    container.appendChild(cloned);
  });

  // Add a reset style for the container itself
  const resetStyle = document.createElement('style');
  resetStyle.textContent = `
    .story-render-root {
      width: ${STORY_WIDTH}px;
      height: ${STORY_HEIGHT}px;
      overflow: hidden;
      position: relative;
      font-family: '${fontFamily}', 'Helvetica Neue', sans-serif;
    }
    .story-render-root * { margin: 0; padding: 0; box-sizing: border-box; }
  `;
  container.appendChild(resetStyle);

  // Create wrapper and inject body content
  const wrapper = document.createElement('div');
  wrapper.className = 'story-render-root';
  wrapper.innerHTML = doc.body.innerHTML;
  container.appendChild(wrapper);

  // Wait for fonts to load
  await document.fonts.ready;
  // Extra delay for rendering
  await new Promise((r) => setTimeout(r, 500));

  try {
    // Use html-to-image
    const htmlToImage = await import('html-to-image');
    const fontEmbedCSS = await htmlToImage.getFontEmbedCSS(wrapper);
    const dataUrl = await htmlToImage.toPng(wrapper, {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      pixelRatio: 1,
      cacheBust: true,
      fontEmbedCSS,
      style: {
        transform: 'none',
      },
    });

    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

export default function ExportButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const { config, selectedActivity } = useStoryStore();
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    if (state === 'loading') return;
    setState('loading');
    setErrorMsg(null);

    try {
      const units = (config.units || 'metric') as UnitSystem;
      const activity = config.activity || selectedActivity;

      // Generate stats
      const stats = activity
        ? {
            distance: formatDistanceValue(activity.distance, units),
            time: formatTime(activity.moving_time),
            pace: formatPaceValue(activity.average_speed, units),
            elevation: formatElevation(activity.total_elevation_gain, units),
            date: formatDateShort(activity.start_date_local),
          }
        : {
            distance: units === 'imperial' ? '6.54' : '10.52',
            time: '52:43',
            pace: units === 'imperial' ? '8:04' : '5:01',
            elevation: units === 'imperial' ? '407ft' : '124m',
            date: 'Mar 9, 2024',
          };

      // Generate route SVG
      let routeSvg: string | undefined;
      if (config.showRoute && activity?.map?.summary_polyline) {
        routeSvg = generateRouteSvg(activity.map.summary_polyline, {
          width: STORY_WIDTH,
          height: STORY_HEIGHT * 0.4,
          color: config.routeColor,
          thickness: config.routeThickness,
          opacity: config.routeOpacity,
          padding: 80,
          glowIntensity: config.routeGlowIntensity ?? 1,
        });
      }

      // Generate HTML
      const html = generateStoryHtml({
        backgroundImage: config.backgroundImage,
        routeSvg,
        stats,
        visibleStats: config.visibleStats,
        config,
      });

      // Render to PNG in the browser
      const blob = await renderStoryToPng(html);

      // Create download
      const url = URL.createObjectURL(blob);
      const activityName = selectedActivity?.name
        ? selectedActivity.name.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
        : 'strava-story';
      const fileName = `${activityName}-story.png`;

      // Always download first
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // On mobile, also offer share
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const file = new File([blob], fileName, { type: 'image/png' });
      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'My Strava Story',
            text: 'Generated with StoryRun',
          });
        } catch {
          // User cancelled share — file already saved
        }
      }

      URL.revokeObjectURL(url);
      setState('success');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState('idle');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Export failed';
      console.error('Browser export error:', err);
      setErrorMsg(msg);
      setState('error');
      setTimeout(() => setState('idle'), 5000);
    }
  }, [state, config, selectedActivity]);

  const buttonStyles = {
    idle: {
      background: 'linear-gradient(135deg, #FC4C02 0%, #E63E00 100%)',
      color: 'white',
    },
    loading: {
      background: 'rgba(252,76,2,0.3)',
      color: '#FC4C02',
    },
    success: {
      background: 'rgba(0,200,100,0.15)',
      color: '#00C864',
      border: '1px solid rgba(0,200,100,0.25)',
    },
    error: {
      background: 'rgba(239,68,68,0.15)',
      color: '#EF4444',
      border: '1px solid rgba(239,68,68,0.25)',
    },
  };

  const isMobileShare = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <button
        onClick={handleExport}
        disabled={state === 'loading'}
        className={`flex items-center justify-center gap-2 px-4 rounded-lg text-sm font-medium transition-all ${fullWidth ? 'w-full py-3' : 'py-2'}`}
        style={{
          ...buttonStyles[state],
          boxShadow: state === 'idle'
            ? '0 2px 12px rgba(252,76,2,0.3)'
            : 'none',
        }}
        title={state === 'error' ? errorMsg || 'Export failed' : undefined}
      >
        {state === 'loading' ? (
          <>
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
              style={{ borderColor: '#FC4C02', borderTopColor: 'transparent' }}
            />
            <span>Generating…</span>
          </>
        ) : state === 'success' ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Downloaded!</span>
          </>
        ) : state === 'error' ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v4M8 11v0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Failed</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{isMobileShare ? 'Export & Share' : 'Export PNG'}</span>
          </>
        )}
      </button>

      {/* Error tooltip */}
      {state === 'error' && errorMsg && (
        <div
          className="absolute right-0 top-full mt-2 p-3 rounded-xl text-xs text-red-400 z-50 w-64 animate-fade-in"
          style={{
            background: '#1E1E22',
            border: '1px solid rgba(239,68,68,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <p className="font-medium mb-1">Export failed</p>
          <p className="text-[#6B6B78]">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
