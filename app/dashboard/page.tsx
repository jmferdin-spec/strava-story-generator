'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoryStore } from '@/store/useStoryStore';
import ActivitySelector from '@/components/ActivitySelector';
import StoryPreview from '@/components/StoryPreview';
import TemplateSelector from '@/components/TemplateSelector';
import FontControls from '@/components/FontControls';
import ColorControls from '@/components/ColorControls';
import StatControls from '@/components/StatControls';
import RouteControls from '@/components/RouteControls';
import ImageUploader from '@/components/ImageUploader';
import ExportButton from '@/components/ExportButton';

// ─── Types ────────────────────────────────────────────────────────────────────
type MobileScreen = 'runs' | 'preview' | 'edit';
type EditTab = 'template' | 'photo' | 'style' | 'stats' | 'route';
type DesktopTab = EditTab;

// ─── Mobile bottom nav icon ───────────────────────────────────────────────────
function NavIcon({ screen }: { screen: MobileScreen }) {
  if (screen === 'runs') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (screen === 'preview') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="6" y="2" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2v4M10 14v4M2 10h4M14 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

// ─── Shared edit tabs content ─────────────────────────────────────────────────
function EditTabContent({ tab }: { tab: EditTab }) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      {tab === 'template' && <TemplateSelector />}
      {tab === 'photo'    && <ImageUploader />}
      {tab === 'style'    && (
        <div>
          <FontControls />
          <div className="mx-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
          <ColorControls />
        </div>
      )}
      {tab === 'stats' && <StatControls />}
      {tab === 'route' && <RouteControls />}
    </div>
  );
}

// ─── Edit tab bar ─────────────────────────────────────────────────────────────
const EDIT_TABS: { id: EditTab; label: string }[] = [
  { id: 'template', label: 'Templates' },
  { id: 'photo',    label: 'Photo' },
  { id: 'style',    label: 'Style' },
  { id: 'stats',    label: 'Stats' },
  { id: 'route',    label: 'Route' },
];

function EditTabBar({
  active, onChange,
}: { active: EditTab; onChange: (t: EditTab) => void }) {
  return (
    <div
      className="flex-shrink-0 flex border-b overflow-x-auto scrollbar-none"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {EDIT_TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 py-3 text-xs font-medium transition-colors whitespace-nowrap px-2 min-w-[60px]"
          style={{
            color: active === t.id ? '#FC4C02' : '#6B6B78',
            borderBottom: active === t.id
              ? '2px solid #FC4C02'
              : '2px solid transparent',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Top header (shared) ──────────────────────────────────────────────────────
function Header({
  athlete, onLogout, mobileScreen, onScreenChange,
}: {
  athlete: { firstname: string; lastname: string; profile: string } | null;
  onLogout: () => void;
  mobileScreen: MobileScreen;
  onScreenChange: (s: MobileScreen) => void;
}) {
  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 z-50"
      style={{
        background: '#111113',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: 52,
        // Safe area for notch/cutout
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#FC4C02' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L10.5 7H14L9.5 10.5L11 14L8 11.5L5 14L6.5 10.5L2 7H5.5L8 2Z" fill="white"/>
          </svg>
        </div>
        <span className="text-white text-sm font-semibold tracking-tight">StoryRun</span>
      </div>

      {/* Desktop workflow steps */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-[#3A3A44]">
        {['Select Run', 'Upload Photo', 'Customize', 'Export'].map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            {i > 0 && <span>›</span>}
            <span>{step}</span>
          </span>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {athlete && (
          <div className="flex items-center gap-2">
            {athlete.profile && (
              <img src={athlete.profile} alt="" className="w-6 h-6 rounded-full object-cover"/>
            )}
            <span className="text-xs text-[#6B6B78] hidden sm:block">
              {athlete.firstname}
            </span>
          </div>
        )}
        <div className="w-px h-4 bg-[rgba(255,255,255,0.08)]" />
        <button
          onClick={onLogout}
          className="text-xs text-[#6B6B78] hover:text-white transition-colors"
        >
          Disconnect
        </button>
        <div className="hidden sm:block">
          <ExportButton />
        </div>
      </div>
    </header>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { setActivities, setActivitiesLoading, setActivitiesError, setAthlete, athlete } = useStoryStore();

  const [mobileScreen, setMobileScreen] = useState<MobileScreen>('runs');
  const [editTab, setEditTab] = useState<EditTab>('template');
  const [desktopTab, setDesktopTab] = useState<DesktopTab>('template');

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const res = await fetch('/api/strava/activities');
      if (res.status === 401) { router.push('/'); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setActivities(data.activities);
    } catch {
      setActivitiesError('Could not load activities. Please try again.');
    } finally {
      setActivitiesLoading(false);
    }
  }, [router, setActivities, setActivitiesError, setActivitiesLoading]);

  useEffect(() => {
    const athleteCookie = document.cookie.split(';').find((c) => c.trim().startsWith('strava_athlete='));
    if (!athleteCookie) { router.push('/'); return; }
    try {
      const json = decodeURIComponent(athleteCookie.split('=').slice(1).join('='));
      setAthlete(JSON.parse(json));
    } catch {}
    fetchActivities();
  }, [fetchActivities, router, setAthlete]);

  const handleLogout = async () => {
    await fetch('/api/strava/activities', { method: 'DELETE' });
    router.push('/');
  };

  // When user selects a run on mobile, auto-navigate to preview
  const { selectActivity: originalSelectActivity } = useStoryStore();
  const handleActivitySelect = useCallback(() => {
    setMobileScreen('preview');
  }, []);

  return (
    <div
      className="flex flex-col bg-[#0A0A0B] overflow-hidden"
      style={{
        height: '100dvh', // dynamic viewport height (handles mobile browser chrome)
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <Header
        athlete={athlete}
        onLogout={handleLogout}
        mobileScreen={mobileScreen}
        onScreenChange={setMobileScreen}
      />

      {/* ── DESKTOP layout (lg+): 3 columns ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left: Activity list */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: 300, borderRight: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}
        >
          <ActivitySelector />
        </aside>

        {/* Center: Preview */}
        <main className="flex-1 flex flex-col items-center justify-center overflow-hidden bg-[#0D0D0F] relative">
          <StoryPreview />
        </main>

        {/* Right: Controls */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: 320, borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}
        >
          <EditTabBar active={desktopTab} onChange={setDesktopTab} />
          <EditTabContent tab={desktopTab} />
        </aside>
      </div>

      {/* ── TABLET layout (md–lg): 2 columns with bottom export ── */}
      <div className="hidden md:flex lg:hidden flex-1 overflow-hidden">
        {/* Left: Activity + Preview stacked */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Preview takes most space */}
          <div className="flex-1 overflow-hidden bg-[#0D0D0F] relative">
            <StoryPreview />
          </div>
          {/* Activity selector below preview */}
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{ height: 200, borderTop: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}
          >
            <ActivitySelector />
          </div>
        </div>

        {/* Right: Full controls panel */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: 300, borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}
        >
          <EditTabBar active={desktopTab} onChange={setDesktopTab} />
          <EditTabContent tab={desktopTab} />
          {/* Export at bottom of right panel */}
          <div
            className="flex-shrink-0 p-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <ExportButton fullWidth />
          </div>
        </aside>
      </div>

      {/* ── MOBILE layout (<md): Full-screen cards with bottom nav ── */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        {/* Screen: Runs */}
        {mobileScreen === 'runs' && (
          <div className="flex-1 overflow-hidden bg-[#111113]">
            <MobileActivitySelector onSelect={() => setMobileScreen('preview')} />
          </div>
        )}

        {/* Screen: Preview */}
        {mobileScreen === 'preview' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0D0D0F]">
            <StoryPreview />
            {/* Floating export button */}
            <div
              className="flex-shrink-0 px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}
            >
              <ExportButton fullWidth />
            </div>
          </div>
        )}

        {/* Screen: Edit */}
        {mobileScreen === 'edit' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#111113]">
            <EditTabBar active={editTab} onChange={setEditTab} />
            <EditTabContent tab={editTab} />
          </div>
        )}

        {/* Bottom navigation bar */}
        <nav
          className="flex-shrink-0 flex items-stretch"
          style={{
            background: '#111113',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            height: 56,
          }}
        >
          {([
            { id: 'runs' as MobileScreen, label: 'Runs' },
            { id: 'preview' as MobileScreen, label: 'Preview' },
            { id: 'edit' as MobileScreen, label: 'Edit' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMobileScreen(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ color: mobileScreen === id ? '#FC4C02' : '#6B6B78' }}
            >
              <NavIcon screen={id} />
              <span className="text-[10px] font-medium">{label}</span>
              {mobileScreen === id && (
                <div
                  className="absolute bottom-0 rounded-full"
                  style={{ width: 24, height: 2, background: '#FC4C02' }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ─── Mobile activity selector wrapper ────────────────────────────────────────
// Wraps ActivitySelector and fires callback when an activity is tapped
function MobileActivitySelector({ onSelect }: { onSelect: () => void }) {
  const { selectActivity } = useStoryStore();

  // Override selectActivity to also navigate
  const wrappedSelect = useCallback((activity: Parameters<typeof selectActivity>[0]) => {
    selectActivity(activity);
    onSelect();
  }, [selectActivity, onSelect]);

  // Temporarily patch the store
  useEffect(() => {
    const originalFn = useStoryStore.getState().selectActivity;
    useStoryStore.setState({ selectActivity: wrappedSelect });
    return () => useStoryStore.setState({ selectActivity: originalFn });
  }, [wrappedSelect]);

  return <ActivitySelector />;
}
