'use client';

import { useState } from 'react';
import { useStoryStore } from '@/store/useStoryStore';

export default function ExportButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const { config, selectedActivity } = useStoryStore();
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async () => {
    if (state === 'loading') return;
    setState('loading');
    setErrorMsg(null);

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          backgroundImageBase64: config.backgroundImage,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const activityName = selectedActivity?.name
        ? selectedActivity.name.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
        : 'strava-story';
      const fileName = `${activityName}-story.png`;

      // On mobile, use Web Share API for Instagram etc. On desktop, direct download.
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const file = new File([blob], fileName, { type: 'image/png' });
      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Strava Story',
          text: 'Generated with StoryRun',
        });
      } else {
        // Desktop / browsers without share API: trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      URL.revokeObjectURL(url);
      setState('success');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      // User cancelling the share sheet isn't an error
      if (err instanceof Error && err.name === 'AbortError') {
        setState('idle');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Export failed';
      setErrorMsg(msg);
      setState('error');
      setTimeout(() => setState('idle'), 5000);
    }
  };

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
          {errorMsg.toLowerCase().includes('puppeteer') && (
            <p className="mt-2 text-[10px] text-[#3A3A44]">
              Make sure Puppeteer is installed: npm install puppeteer
            </p>
          )}
        </div>
      )}
    </div>
  );
}
