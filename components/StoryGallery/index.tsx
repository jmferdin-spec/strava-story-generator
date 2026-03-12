'use client';

import { useMemo, useState, useCallback } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { generateStoryHtml } from '@/lib/storyTemplates';
import { generateRouteSvg } from '@/lib/routeRenderer';
import {
  formatDistanceValue, formatTime, formatPaceValue,
  formatElevation, formatDateShort,
} from '@/lib/strava';
import type { StoryConfig, TemplateId, FontFamily, FontWeight, OverlayType, RoutePosition, UnitSystem } from '@/types';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

// ─── 6 Gallery Presets ──────────────────────────────────────────────────────

interface GalleryPreset {
  name: string;
  description: string;
  overrides: Partial<StoryConfig>;
}

const GALLERY_PRESETS: GalleryPreset[] = [
  {
    name: 'Clean Minimal',
    description: 'Airy layout, subtle overlay',
    overrides: {
      templateId: 'minimal-bottom' as TemplateId,
      fontFamily: 'Inter' as FontFamily,
      fontSize: 64,
      fontWeight: '600' as FontWeight,
      letterSpacing: -0.02,
      statColor: '#FFFFFF',
      labelColor: 'rgba(255,255,255,0.5)',
      overlayColor: '#000000',
      overlayOpacity: 0.55,
      overlayType: 'gradient-bottom' as OverlayType,
      accentColor: '#FFFFFF',
      statAlignment: 'left' as const,
      statVerticalOffset: 82,
      showRoute: false,
      routePosition: 'middle' as RoutePosition,
    },
  },
  {
    name: 'Route Neon',
    description: 'Glowing route, cinematic feel',
    overrides: {
      templateId: 'route-focus' as TemplateId,
      fontFamily: 'Space Mono' as FontFamily,
      fontSize: 48,
      fontWeight: '400' as FontWeight,
      letterSpacing: 0.06,
      statColor: '#FFFFFF',
      labelColor: 'rgba(255,255,255,0.55)',
      overlayColor: '#080810',
      overlayOpacity: 0.7,
      overlayType: 'cinematic' as OverlayType,
      accentColor: '#00D4FF',
      routeColor: '#00D4FF',
      statAlignment: 'left' as const,
      statVerticalOffset: 86,
      showRoute: true,
      routePosition: 'middle' as RoutePosition,
      routeGlowIntensity: 3.5,
      routeThickness: 4,
      routeOpacity: 0.95,
    },
  },
  {
    name: 'Bold Type',
    description: 'Massive stats, dramatic vignette',
    overrides: {
      templateId: 'large-center' as TemplateId,
      fontFamily: 'Anton' as FontFamily,
      fontSize: 110,
      fontWeight: '400' as FontWeight,
      letterSpacing: 0.01,
      statColor: '#FFFFFF',
      labelColor: 'rgba(255,255,255,0.45)',
      overlayColor: '#000000',
      overlayOpacity: 0.55,
      overlayType: 'vignette' as OverlayType,
      accentColor: '#FC4C02',
      statAlignment: 'center' as const,
      statVerticalOffset: 45,
      showRoute: false,
      routePosition: 'bottom' as RoutePosition,
      routeGlowIntensity: 1.5,
    },
  },
  {
    name: 'Gradient Bar',
    description: 'Stats in a bold orange bar',
    overrides: {
      templateId: 'gradient-bar' as TemplateId,
      fontFamily: 'Montserrat' as FontFamily,
      fontSize: 56,
      fontWeight: '800' as FontWeight,
      letterSpacing: -0.01,
      statColor: '#FFFFFF',
      labelColor: 'rgba(255,255,255,0.65)',
      overlayColor: '#FC4C02',
      overlayOpacity: 0.92,
      overlayType: 'gradient-bottom' as OverlayType,
      accentColor: '#FFFFFF',
      statAlignment: 'center' as const,
      statVerticalOffset: 78,
      showRoute: true,
      routeColor: 'rgba(255,255,255,0.5)',
      routePosition: 'middle' as RoutePosition,
      routeGlowIntensity: 0.5,
      routeThickness: 3,
      routeOpacity: 0.4,
    },
  },
  {
    name: 'Athlete Poster',
    description: 'Magazine style, duotone overlay',
    overrides: {
      templateId: 'athlete-poster' as TemplateId,
      fontFamily: 'Oswald' as FontFamily,
      fontSize: 80,
      fontWeight: '600' as FontWeight,
      letterSpacing: 0.01,
      statColor: '#FFFFFF',
      labelColor: 'rgba(255,255,255,0.5)',
      overlayColor: '#000000',
      overlayOpacity: 0.6,
      overlayType: 'duotone' as OverlayType,
      accentColor: '#FFE500',
      gradientStartColor: '#FC4C02',
      gradientEndColor: '#1a0533',
      statAlignment: 'left' as const,
      statVerticalOffset: 70,
      showRoute: true,
      routeColor: 'rgba(255,255,255,0.25)',
      routePosition: 'background' as RoutePosition,
      routeGlowIntensity: 0.3,
      routeOpacity: 0.3,
    },
  },
  {
    name: 'Dark Mode',
    description: 'Deep black, neon green accents',
    overrides: {
      templateId: 'minimal-bottom' as TemplateId,
      fontFamily: 'Bebas Neue' as FontFamily,
      fontSize: 76,
      fontWeight: '400' as FontWeight,
      letterSpacing: 0.04,
      statColor: '#E0FFE0',
      labelColor: 'rgba(0,255,136,0.45)',
      overlayColor: '#000000',
      overlayOpacity: 0.85,
      overlayType: 'solid' as OverlayType,
      accentColor: '#00FF88',
      statAlignment: 'left' as const,
      statVerticalOffset: 80,
      showRoute: true,
      routeColor: '#00FF88',
      routePosition: 'middle' as RoutePosition,
      routeGlowIntensity: 2.5,
      routeThickness: 3,
      routeOpacity: 0.7,
    },
  },
];

// ─── Gallery Card ───────────────────────────────────────────────────────────

function GalleryCard({
  preset,
  html,
  onDownload,
  onApply,
  isExporting,
}: {
  preset: GalleryPreset;
  html: string;
  onDownload: () => void;
  onApply: () => void;
  isExporting: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}>
      {/* Preview */}
      <div className="relative overflow-hidden w-full" style={{ aspectRatio: '9/16' }}>
        <iframe
          srcDoc={html}
          className="border-0 pointer-events-none absolute top-0 left-0"
          style={{
            width: STORY_WIDTH,
            height: STORY_HEIGHT,
            transform: 'scale(var(--preview-scale))',
            transformOrigin: 'top left',
          }}
          sandbox="allow-same-origin"
          title={preset.name}
          ref={(el) => {
            if (el) {
              const parent = el.parentElement;
              if (parent) {
                const s = parent.clientWidth / STORY_WIDTH;
                el.style.setProperty('--preview-scale', String(s));
              }
            }
          }}
        />
      </div>

      {/* Info + actions */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-xs font-medium text-[#E8E8EA]">{preset.name}</p>
          <p className="text-[10px] text-[#6B6B78]">{preset.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onApply}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              color: '#FC4C02',
              background: 'rgba(252,76,2,0.06)',
              border: '1px solid rgba(252,76,2,0.15)',
            }}
          >
            Use this
          </button>
          <button
            onClick={onDownload}
            disabled={isExporting}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
            style={{
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #FC4C02 0%, #E63E00 100%)',
            }}
          >
            {isExporting ? 'Exporting…' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Gallery ───────────────────────────────────────────────────────────

export default function StoryGallery() {
  const { config, selectedActivity, setTemplate, applyTemplateDefaults } = useStoryStore();
  const store = useStoryStore();
  const [exportingIdx, setExportingIdx] = useState<number | null>(null);

  const units = (config.units || 'imperial') as UnitSystem;

  // Stats for the selected activity
  const stats = useMemo(() => {
    if (!selectedActivity) return {
      distance: units === 'imperial' ? '6.54' : '10.52',
      time: '52:43',
      pace: units === 'imperial' ? '8:04' : '5:01',
      elevation: units === 'imperial' ? '407ft' : '124m',
      date: 'Mar 9, 2024',
    };
    return {
      distance: formatDistanceValue(selectedActivity.distance, units),
      time: formatTime(selectedActivity.moving_time),
      pace: formatPaceValue(selectedActivity.average_speed, units),
      elevation: formatElevation(selectedActivity.total_elevation_gain, units),
      date: formatDateShort(selectedActivity.start_date_local),
    };
  }, [selectedActivity, units]);

  // Generate HTML for each preset
  const presetHtmls = useMemo(() => {
    return GALLERY_PRESETS.map((preset) => {
      const presetConfig: StoryConfig = {
        ...config,
        ...preset.overrides,
        units,
        activity: selectedActivity || config.activity,
      };

      let routeSvg: string | undefined;
      if (presetConfig.showRoute && selectedActivity?.map?.summary_polyline) {
        routeSvg = generateRouteSvg(selectedActivity.map.summary_polyline, {
          width: STORY_WIDTH,
          height: STORY_HEIGHT * 0.4,
          color: presetConfig.routeColor,
          thickness: presetConfig.routeThickness,
          opacity: presetConfig.routeOpacity,
          padding: 80,
          glowIntensity: presetConfig.routeGlowIntensity ?? 1,
        });
      }

      return generateStoryHtml({
        backgroundImage: config.backgroundImage,
        routeSvg,
        stats,
        visibleStats: presetConfig.visibleStats,
        config: presetConfig,
      });
    });
  }, [config, selectedActivity, stats, units]);

  // Browser-based render to PNG
  const renderToPng = useCallback(async (html: string): Promise<Blob> => {
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

    const styles = doc.querySelectorAll('style');
    styles.forEach((style) => {
      const cloned = document.createElement('style');
      cloned.textContent = style.textContent;
      container.appendChild(cloned);
    });

    container.innerHTML += doc.body.innerHTML;

    const storyEl = container.querySelector('.story') as HTMLElement;
    if (!storyEl) throw new Error('Story element not found');

    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 500));

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
  }, []);

  // Download a specific preset
  const handleDownload = useCallback(async (idx: number) => {
    if (exportingIdx !== null) return;
    setExportingIdx(idx);

    try {
      const preset = GALLERY_PRESETS[idx];
      const presetConfig: StoryConfig = {
        ...config,
        ...preset.overrides,
        units,
        activity: selectedActivity || config.activity,
      };

      const pStats = selectedActivity ? {
        distance: formatDistanceValue(selectedActivity.distance, units),
        time: formatTime(selectedActivity.moving_time),
        pace: formatPaceValue(selectedActivity.average_speed, units),
        elevation: formatElevation(selectedActivity.total_elevation_gain, units),
        date: formatDateShort(selectedActivity.start_date_local),
      } : stats;

      let routeSvg: string | undefined;
      if (presetConfig.showRoute && selectedActivity?.map?.summary_polyline) {
        routeSvg = generateRouteSvg(selectedActivity.map.summary_polyline, {
          width: STORY_WIDTH,
          height: STORY_HEIGHT * 0.4,
          color: presetConfig.routeColor,
          thickness: presetConfig.routeThickness,
          opacity: presetConfig.routeOpacity,
          padding: 80,
          glowIntensity: presetConfig.routeGlowIntensity ?? 1,
        });
      }

      const html = generateStoryHtml({
        backgroundImage: config.backgroundImage,
        routeSvg,
        stats: pStats,
        visibleStats: presetConfig.visibleStats,
        config: presetConfig,
      });

      const blob = await renderToPng(html);
      const url = URL.createObjectURL(blob);

      const activityName = selectedActivity?.name
        ? selectedActivity.name.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 30)
        : 'strava-story';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `${activityName}-${preset.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.png`;

      // Download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gallery export failed:', err);
    } finally {
      setExportingIdx(null);
    }
  }, [config, selectedActivity, units, exportingIdx, stats, renderToPng]);

  // Apply preset to main editor
  const handleApply = useCallback((idx: number) => {
    const preset = GALLERY_PRESETS[idx];
    const overrides = preset.overrides;

    // Apply each override to the store
    if (overrides.templateId) store.setTemplate(overrides.templateId);
    if (overrides.fontFamily) store.setFontFamily(overrides.fontFamily);
    if (overrides.fontSize) store.setFontSize(overrides.fontSize);
    if (overrides.fontWeight) store.setFontWeight(overrides.fontWeight);
    if (overrides.letterSpacing !== undefined) store.setLetterSpacing(overrides.letterSpacing);
    if (overrides.statColor) store.setStatColor(overrides.statColor);
    if (overrides.labelColor) store.setLabelColor(overrides.labelColor);
    if (overrides.overlayColor) store.setOverlayColor(overrides.overlayColor);
    if (overrides.overlayOpacity !== undefined) store.setOverlayOpacity(overrides.overlayOpacity);
    if (overrides.overlayType) store.setOverlayType(overrides.overlayType);
    if (overrides.accentColor) store.setAccentColor(overrides.accentColor);
    if (overrides.statAlignment) store.setStatAlignment(overrides.statAlignment);
    if (overrides.statVerticalOffset !== undefined) store.setStatVerticalOffset(overrides.statVerticalOffset);
    if (overrides.showRoute !== undefined) store.setShowRoute(overrides.showRoute);
    if (overrides.routeColor) store.setRouteColor(overrides.routeColor);
    if (overrides.routePosition) store.setRoutePosition(overrides.routePosition);
    if (overrides.routeGlowIntensity !== undefined) store.setRouteGlowIntensity(overrides.routeGlowIntensity);
    if (overrides.routeThickness !== undefined) store.setRouteThickness(overrides.routeThickness);
    if (overrides.routeOpacity !== undefined) store.setRouteOpacity(overrides.routeOpacity);
    if (overrides.gradientStartColor) store.setGradientStartColor(overrides.gradientStartColor);
    if (overrides.gradientEndColor) store.setGradientEndColor(overrides.gradientEndColor);
  }, [store]);

  if (!selectedActivity) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-3" style={{ minHeight: 300 }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B6B78" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
        <p className="text-sm text-[#6B6B78]">Select a run first to generate story variations</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="section-label">Story Variations</p>
        <p className="text-xs text-[#6B6B78] mb-3">
          6 auto-generated layouts using your run stats{config.backgroundImage ? ' and photo' : ''}. Tap "Use this" to load it into the editor, or download directly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GALLERY_PRESETS.map((preset, idx) => (
          <GalleryCard
            key={preset.name}
            preset={preset}
            html={presetHtmls[idx]}
            onDownload={() => handleDownload(idx)}
            onApply={() => handleApply(idx)}
            isExporting={exportingIdx === idx}
          />
        ))}
      </div>
    </div>
  );
}
