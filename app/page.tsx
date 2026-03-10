'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const athleteCookie = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('strava_athlete='));

    if (athleteCookie) {
      router.push('/dashboard');
      return;
    }

    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [router, searchParams]);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/strava/auth';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #FC4C02, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-60 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #FC4C02, transparent 70%)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#FC4C02' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L10.5 7H14L9.5 10.5L11 14L8 11.5L5 14L6.5 10.5L2 7H5.5L8 2Z" fill="white" />
            </svg>
          </div>
          <span className="text-white font-semibold tracking-tight">StoryRun</span>
        </div>
        <a
          href="https://github.com"
          className="text-sm text-[#6B6B78] hover:text-white transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub →
        </a>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{
            background: 'rgba(252, 76, 2, 0.12)',
            border: '1px solid rgba(252, 76, 2, 0.25)',
            color: '#FC4C02',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FC4C02] animate-pulse" />
          Connected to Strava API
        </div>

        {/* Hero heading */}
        <h1
          className="text-6xl sm:text-7xl font-bold text-white tracking-tight leading-none mb-6 max-w-4xl"
          style={{ letterSpacing: '-0.03em' }}
        >
          Turn Your Runs Into
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #FC4C02, #FF8C00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Instagram Stories
          </span>
        </h1>

        <p className="text-[#6B6B78] text-lg max-w-xl mb-12 leading-relaxed">
          Connect your Strava account, pick a run, and design a beautiful
          9:16 story with your stats, route, and custom overlays — ready to post.
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-6 justify-center mb-12">
          {[
            { icon: '⚡', label: 'Live preview' },
            { icon: '🗺️', label: 'Route rendering' },
            { icon: '🎨', label: '5 templates' },
            { icon: '📤', label: '1080×1920 export' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 text-sm text-[#6B6B78]"
            >
              <span>{feature.icon}</span>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm text-red-400 max-w-md w-full"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="group relative flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-70"
          style={{
            background: isLoading
              ? '#FC4C02'
              : 'linear-gradient(135deg, #FC4C02 0%, #E63E00 100%)',
            boxShadow: '0 0 0 1px rgba(252,76,2,0.5), 0 8px 32px rgba(252,76,2,0.25)',
          }}
        >
          {/* Strava logo */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          {isLoading ? 'Connecting…' : 'Connect with Strava'}
          {!isLoading && (
            <span
              className="text-[#FC4C02] bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold
                group-hover:scale-110 transition-transform"
            >
              →
            </span>
          )}
        </button>

        <p className="mt-4 text-xs text-[#3A3A44]">
          We only read your activity data — never write or post on your behalf.
        </p>
      </main>

      {/* Footer preview mockup */}
      <div className="relative z-10 pb-12 flex justify-center gap-4 mt-8">
        {['minimal-bottom', 'large-center', 'athlete-poster'].map((template, i) => (
          <div
            key={template}
            className="relative overflow-hidden rounded-2xl opacity-60"
            style={{
              width: 70,
              height: 124,
              background: `linear-gradient(135deg, #${['1a1a2e', '0f1423', '16213e'][i]} 0%, #${['16213e', '0a1628', '0d1f3c'][i]} 100%)`,
              border: '1px solid rgba(255,255,255,0.06)',
              transform: `rotate(${[-3, 0, 3][i]}deg)`,
              transition: 'opacity 0.2s',
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-16"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              }}
            />
            <div className="absolute bottom-3 left-2 right-2 space-y-1">
              <div className="h-1.5 w-10 rounded-full" style={{ background: '#FC4C02' }} />
              <div className="h-2 w-14 rounded-sm bg-white/70" />
              <div className="h-1 w-8 rounded-sm bg-white/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
