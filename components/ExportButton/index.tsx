'use client';

import { useState, useCallback } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { generateStoryHtml } from '@/lib/storyTemplates';
import { generateRouteSvg } from '@/lib/routeRenderer';
import {
  formatDistanceValue, formatTime, formatPaceValue,
  formatElevation, formatDateShort, formatCalories, formatHeartRate,
} from '@/lib/strava';
import type { UnitSystem } from '@/types';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

// Render story HTML to PNG blob in the browser
async function renderStoryToPng(html: string): Promise<Blob> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = `${STORY_WIDTH}px`;
  container.style.height = `${STORY_HEIGHT}px`;
  container.style.overflow = 'hidden';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-9999';
  document.body.appendChild(container);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Copy all styles from generated HTML
  const styles = doc.querySelectorAll('style');
  styles.forEach((style) => {
    const cloned = document.createElement('style');
    cloned.textContent = style.textContent;
    container.appendChild(cloned);
  });

  // Copy body content directly (the .story div and everything inside)
  container.innerHTML += doc.body.innerHTML;

  // Find the .story element — this is what we render
  const storyEl = container.querySelector('.story') as HTMLElement;
  if (!storyEl) throw new Error('Story element not found');

  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 500));

 // If no background image, make export transparent
    const computedBg = window.getComputedStyle(storyEl).backgroundImage;
    if (!computedBg || computedBg === 'none') {
      storyEl.style.background = 'transparent';
      const overlay = storyEl.querySelector('.overlay') as HTMLElement;
      if (overlay) overlay.style.background = 'transparent';
    }

  try {
    const htmlToImage = await import('html-to-image');
    const fontEmbedCSS = await htmlToImage.getFontEmbedCSS(storyEl);
    const dataUrl = await htmlToImage.toPng(storyEl, {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      pixelRatio: 1,
      cacheBust: true,
      fontEmbedCSS,
    });

    const res = await fetch(dataUrl);
    return await res.blob();
  } finally {
    document.body.removeChild(container);
  }
}

// Shared function to generate story blob
function useStoryExport() {
  const { config, selectedActivity } = useStoryStore();

  const generateBlob = useCallback(async (): Promise<{ blob: Blob; fileName: string }> => {
    const units = (config.units || 'imperial') as UnitSystem;
    const activity = config.activity || selectedActivity;

    const stats = activity
      ? {
          distance: formatDistanceValue(activity.distance, units),
          time: formatTime(activity.moving_time),
          pace: formatPaceValue(activity.average_speed, units),
          elevation: formatElevation(activity.total_elevation_gain, units),
          heartrate: activity.average_heartrate ? formatHeartRate(activity.average_heartrate) : '–',
          calories: activity.calories ? formatCalories(activity.calories) : '–',
          date: formatDateShort(activity.start_date_local),
          description: activity.name || '',
        }
      : {
          distance: units === 'imperial' ? '6.54' : '10.52',
          time: '52:43',
          pace: units === 'imperial' ? '8:04' : '5:01',
          elevation: units === 'imperial' ? '407ft' : '124m',
          heartrate: '–',
          calories: '–',
          date: 'Mar 9, 2024',
          description: '',
        };

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

    const html = generateStoryHtml({
      backgroundImage: config.backgroundImage,
      routeSvg,
      stats,
      visibleStats: config.visibleStats,
      config,
    });

    const blob = await renderStoryToPng(html);

    const activityName = selectedActivity?.name
      ? selectedActivity.name.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
      : 'strava-story';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${activityName}-${timestamp}.png`;

    return { blob, fileName };
  }, [config, selectedActivity]);

  return generateBlob;
}

export default function ExportButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [shareState, setShareState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const generateBlob = useStoryExport();

  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator;

  // Export (download only)
  const handleExport = useCallback(async () => {
    if (exportState === 'loading') return;
    setExportState('loading');
    setErrorMsg(null);

    try {
      const { blob, fileName } = await generateBlob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportState('success');
      setTimeout(() => setExportState('idle'), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      console.error('Export error:', err);
      setErrorMsg(msg);
      setExportState('error');
      setTimeout(() => setExportState('idle'), 5000);
    }
  }, [exportState, generateBlob]);

  // Share (share dialog)
  const handleShare = useCallback(async () => {
    if (shareState === 'loading') return;
    setShareState('loading');
    setErrorMsg(null);

    try {
      const { blob, fileName } = await generateBlob();
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Strava Story',
          text: 'Generated with StoryRun',
        });
        setShareState('success');
        setTimeout(() => setShareState('idle'), 3000);
      } else {
        // Fallback: just download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShareState('success');
        setTimeout(() => setShareState('idle'), 3000);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setShareState('idle');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Share failed';
      console.error('Share error:', err);
      setErrorMsg(msg);
      setShareState('error');
      setTimeout(() => setShareState('idle'), 5000);
    }
  }, [shareState, generateBlob]);

  const getButtonStyle = (state: string) => {
    switch (state) {
      case 'loading':
        return { background: 'rgba(252,76,2,0.3)', color: '#FC4C02' };
      case 'success':
        return { background: 'rgba(0,200,100,0.15)', color: '#00C864', border: '1px solid rgba(0,200,100,0.25)' };
      case 'error':
        return { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' };
      default:
        return {};
    }
  };

  const renderButtonContent = (state: string, loadingText: string, idleText: string, idleIcon: React.ReactNode) => {
    if (state === 'loading') return (
      <>
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
          style={{ borderColor: '#FC4C02', borderTopColor: 'transparent' }} />
        <span>{loadingText}</span>
      </>
    );
    if (state === 'success') return (
      <>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Done!</span>
      </>
    );
    if (state === 'error') return (
      <>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 5v4M8 11v0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>Failed</span>
      </>
    );
    return (
      <>
        {idleIcon}
        <span>{idleText}</span>
      </>
    );
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
        {/* Export / Download button */}
        <button
          onClick={handleExport}
          disabled={exportState === 'loading'}
          className={`flex items-center justify-center gap-2 px-4 rounded-lg text-sm font-medium transition-all ${fullWidth ? 'flex-1 py-3' : 'py-2'}`}
          style={{
            background: exportState === 'idle'
              ? 'linear-gradient(135deg, #FC4C02 0%, #E63E00 100%)'
              : undefined,
            color: exportState === 'idle' ? 'white' : undefined,
            boxShadow: exportState === 'idle' ? '0 2px 12px rgba(252,76,2,0.3)' : 'none',
            ...getButtonStyle(exportState),
          }}
        >
          {renderButtonContent(
            exportState,
            'Saving…',
            'Export',
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        {/* Share button — only show on mobile or if share API available */}
        {(isMobile || canShare) && (
          <button
            onClick={handleShare}
            disabled={shareState === 'loading'}
            className={`flex items-center justify-center gap-2 px-4 rounded-lg text-sm font-medium transition-all ${fullWidth ? 'flex-1 py-3' : 'py-2'}`}
            style={{
              background: shareState === 'idle'
                ? 'rgba(255,255,255,0.06)'
                : undefined,
              color: shareState === 'idle' ? '#E8E8EA' : undefined,
              border: shareState === 'idle' ? '1px solid rgba(255,255,255,0.1)' : undefined,
              ...getButtonStyle(shareState),
            }}
          >
            {renderButtonContent(
              shareState,
              'Sharing…',
              'Share',
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 7l4-2M6 9l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Error tooltip */}
      {(exportState === 'error' || shareState === 'error') && errorMsg && (
        <div
          className="absolute right-0 top-full mt-2 p-3 rounded-xl text-xs text-red-400 z-50 w-64 animate-fade-in"
          style={{
            background: '#1E1E22',
            border: '1px solid rgba(239,68,68,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <p className="font-medium mb-1">Something went wrong</p>
          <p className="text-[#6B6B78]">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
