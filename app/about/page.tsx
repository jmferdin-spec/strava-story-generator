'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://strava-story-generator.vercel.app');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E8E8EA]">
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button onClick={() => router.push('/')} className="flex items-center">
          <img src="/storymiles-logo.png" alt="StoryMiles" style={{ height: 28 }} />
        </button>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#6B6B78] hover:text-white transition-colors"
        >
          Back
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            About StoryMiles
          </h1>
          <p className="text-lg text-[#6B6B78] leading-relaxed">
            Turn your Strava runs into beautiful Instagram Stories. Pick a run,
            customize the look, and export a ready-to-post image in seconds.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Connect with Strava', desc: 'Log in with your Strava account. We only request read-only access to your activity data.' },
              { step: '2', title: 'Pick a Run', desc: 'Select any recent run from your activity list. Your stats, route, and details are pulled automatically.' },
              { step: '3', title: 'Customize Your Story', desc: 'Upload a photo, choose a template, adjust fonts, colors, and position your stats and route exactly how you want.' },
              { step: '4', title: 'Export and Share', desc: 'Download a 1080 x 1920 PNG ready for Instagram Stories, or share directly from your phone.' },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: 'rgba(252,76,2,0.1)', color: '#FC4C02' }}
                >
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#E8E8EA]">{item.title}</p>
                  <p className="text-sm text-[#6B6B78] mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6">Features</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              '5+ Templates',
              '14 Google Fonts',
              'Route Overlay',
              'Drag and Position',
              'Full Stat Control',
              'Metric / Imperial',
              'PWA Install on Phone',
              'Transparent Export',
              'Photo Crop and Zoom',
              'Auto Story Generator',
            ].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2.5 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-sm text-[#FC4C02]">*</span>
                <span className="text-sm text-[#E8E8EA]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="p-6 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-xl font-semibold mb-3">Transparent Overlay Mode</h2>
          <p className="text-sm text-[#6B6B78] leading-relaxed">
            No photo? No problem. Export your stats and route as a transparent PNG and use it
            as a sticker overlay on videos or photos directly in your Instagram Story editor.
            Just skip the photo upload, hit Export, and layer it over anything.
          </p>
        </div>

        <div
          className="p-6 rounded-2xl"
          style={{ background: 'rgba(252,76,2,0.04)', border: '1px solid rgba(252,76,2,0.15)' }}
        >
          <h2 className="text-xl font-semibold mb-3">Install on Your Phone</h2>
          <p className="text-sm text-[#6B6B78] mb-4">
            StoryMiles is a Progressive Web App. You can install it directly to your
            home screen for a native app experience. No app store needed.
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[#E8E8EA]">Android (Chrome)</p>
              <p className="text-sm text-[#6B6B78] mt-1">
                Tap the menu, then select Install app or Add to Home screen
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#E8E8EA]">iPhone (Safari)</p>
              <p className="text-sm text-[#6B6B78] mt-1">
                Tap the share icon, then select Add to Home Screen
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Privacy and Data</h2>
          <div className="space-y-3 text-sm text-[#6B6B78]">
            <p>
              StoryMiles only requests <strong className="text-[#E8E8EA]">read-only access</strong> to
              your Strava activities. We never write, modify, or delete anything on your Strava account.
            </p>
            <p>
              No activity data is stored on our servers. Your Strava tokens are kept in secure,
              HTTP-only session cookies that expire after 2 hours. Photos you upload are processed
              entirely in your browser and never leave your device.
            </p>
            <p>
              You can disconnect your Strava account at any time by clicking Disconnect in the app,
              or by revoking access in your Strava settings.
            </p>
          </div>
        </div>

        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: 'rgba(252,76,2,0.04)', border: '1px solid rgba(252,76,2,0.15)' }}
        >
          <h2 className="text-xl font-semibold mb-3">Share StoryMiles</h2>
          <p className="text-sm text-[#6B6B78] mb-5">
            Know someone who would love this? Share StoryMiles with your running crew!
          </p>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
              border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: copied ? '#22c55e' : '#E8E8EA',
            }}
          >
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
        </div>

        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-xl font-semibold mb-3">Support StoryMiles</h2>
          <p className="text-sm text-[#6B6B78] mb-5">
            StoryMiles is free to use. If you enjoy it and want to help keep it running,
            consider buying me a coffee!
          </p>
          <a
            href="https://venmo.com/joeferdin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #008CFF 0%, #0070CC 100%)',
              boxShadow: '0 4px 16px rgba(0,140,255,0.3)',
            }}
          >
            Donate via Venmo
          </a>
        </div>

        <div className="text-center pb-8">
          <div className="inline-block w-12 h-px bg-[rgba(255,255,255,0.06)] mb-6" />
          <p className="text-sm text-[#6B6B78]">
            Created by <span className="text-[#E8E8EA]">Joe Ferdin</span>
          </p>
          <a
            href="mailto:j_ferdin@hotmail.com"
            className="text-sm transition-colors hover:text-white mt-1 inline-block"
            style={{ color: '#FC4C02' }}
          >
            j_ferdin@hotmail.com
          </a>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a
              href="https://www.strava.com/athletes/13371321"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Strava"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FC4C02">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066M8.379 8.229l2.836 5.598h4.172L10.463 0l-7 13.828h4.169l1.747-5.599z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/jmferdin26.2"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8E8EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1.5"/>
              </svg>
            </a>
          </div>
          <p className="text-[11px] text-[#3A3A44] mt-4">
            StoryMiles is not affiliated with or endorsed by Strava, Inc.
          </p>
        </div>
      </main>
    </div>
  );
}
