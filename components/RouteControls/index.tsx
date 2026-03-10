'use client';

import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useStoryStore } from '@/store/useStoryStore';
import type { RoutePosition } from '@/types';

const POSITION_OPTIONS: { value: RoutePosition; label: string; description: string }[] = [
  { value: 'top',        label: 'Top',        description: 'Upper third' },
  { value: 'middle',     label: 'Middle',     description: 'Centered' },
  { value: 'bottom',     label: 'Bottom',     description: 'Above stats' },
  { value: 'background', label: 'Background', description: 'Full-height' },
];

const ROUTE_PRESETS = [
  '#FC4C02', '#FFFFFF', '#00D4FF', '#00FF88',
  '#FFE500', '#FF006E', '#8B5CF6', '#FF4081',
];

const GLOW_LEVELS = [
  { value: 0,   label: 'Off',    desc: 'No glow' },
  { value: 0.5, label: 'Subtle', desc: 'Soft edges' },
  { value: 1.5, label: 'Glow',   desc: 'Warm halo' },
  { value: 3,   label: 'Neon',   desc: 'Intense bloom' },
];

function SliderControl({
  label, value, min, max, step, onChange, format,
}: {
  label: string; value: number; min: number; max: number;
  step: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-[#6B6B78]">{label}</label>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#E8E8EA]">
          {format ? format(value) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full" style={{ accentColor: '#FC4C02' }} />
    </div>
  );
}

export default function RouteControls() {
  const {
    config,
    setShowRoute, setRouteColor, setRouteThickness,
    setRouteOpacity, setRoutePosition, setRouteGlowIntensity,
    selectedActivity,
  } = useStoryStore();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const hasPolyline = Boolean(selectedActivity?.map?.summary_polyline);

  // Live SVG glow preview
  const glowPreview = (intensity: number) => {
    const blur = 4 * (1 + intensity * 2);
    return (
      <svg width="100%" height="100%" viewBox="0 0 60 24" style={{ overflow: 'visible' }}>
        <defs>
          <filter id={`gp-${intensity}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={blur * 0.5} result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {intensity > 0 && (
          <path d="M4 20 Q20 10 30 12 Q40 14 56 4" fill="none"
            stroke={config.routeColor} strokeWidth={8} strokeLinecap="round"
            opacity={0.15} filter={`url(#gp-${intensity})`}/>
        )}
        <path d="M4 20 Q20 10 30 12 Q40 14 56 4" fill="none"
          stroke={config.routeColor} strokeWidth={2.5} strokeLinecap="round"
          opacity={0.9}/>
      </svg>
    );
  };

  return (
    <div className="p-4 space-y-5">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label" style={{ marginBottom: 2 }}>Route Map</p>
          <p className="text-[11px] text-[#6B6B78]">
            {hasPolyline ? 'Render GPS route on story' : 'Select a run with GPS data'}
          </p>
        </div>
        <button
          onClick={() => setShowRoute(!config.showRoute)}
          disabled={!hasPolyline}
          className="relative w-11 h-6 rounded-full transition-all disabled:opacity-40 flex-shrink-0"
          style={{ background: config.showRoute && hasPolyline ? '#FC4C02' : 'rgba(255,255,255,0.1)' }}
        >
          <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
            style={{ left: config.showRoute && hasPolyline ? '26px' : '4px' }} />
        </button>
      </div>

      {!hasPolyline && (
        <div className="p-3 rounded-xl text-xs text-[#6B6B78]"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="font-medium text-[#E8E8EA] mb-1">No GPS data</p>
          <p>This activity has no route polyline. Select a different run.</p>
        </div>
      )}

      {config.showRoute && hasPolyline && (
        <>
          {/* ─── Glow intensity ─── */}
          <div>
            <p className="text-[11px] text-[#6B6B78] mb-2">Glow Effect</p>
            <div className="grid grid-cols-4 gap-2">
              {GLOW_LEVELS.map((g) => {
                const isSelected = Math.abs(config.routeGlowIntensity - g.value) < 0.1;
                return (
                  <button
                    key={g.value}
                    onClick={() => setRouteGlowIntensity(g.value)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                    style={{
                      background: isSelected ? 'rgba(252,76,2,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${isSelected ? '#FC4C02' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="w-full rounded overflow-hidden" style={{ height: 28, background: '#0A0A0B' }}>
                      {glowPreview(g.value)}
                    </div>
                    <p className="text-[9px] font-medium" style={{ color: isSelected ? '#FC4C02' : '#E8E8EA' }}>
                      {g.label}
                    </p>
                    <p className="text-[8px] text-[#3A3A44]">{g.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Color ─── */}
          <div>
            <p className="text-[11px] text-[#6B6B78] mb-2">Route Color</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {ROUTE_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setRouteColor(p)}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex-shrink-0"
                  style={{
                    background: p,
                    boxShadow: config.routeColor === p
                      ? '0 0 0 2px #FC4C02, 0 0 0 4px rgba(252,76,2,0.3)'
                      : '0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs w-full transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#E8E8EA',
                }}
              >
                <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: config.routeColor }} />
                <span className="font-mono text-[11px]">{config.routeColor}</span>
                <span className="ml-auto text-[#6B6B78] text-[10px]">Custom</span>
              </button>
              {showColorPicker && (
                <div
                  className="absolute right-0 z-50 p-4 rounded-2xl shadow-2xl mt-2 animate-fade-in"
                  style={{ background: '#1E1E22', border: '1px solid rgba(255,255,255,0.1)', width: 220 }}
                >
                  <HexColorPicker color={config.routeColor} onChange={setRouteColor} style={{ width: '100%' }} />
                  <button onClick={() => setShowColorPicker(false)}
                    className="mt-3 w-full py-1.5 text-xs text-[#6B6B78] hover:text-white transition-colors">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Line controls ─── */}
          <div
            className="p-3 rounded-xl space-y-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <SliderControl
              label="Thickness" value={config.routeThickness}
              min={1} max={12} step={1}
              onChange={setRouteThickness} format={(v) => `${v}px`}
            />
            <SliderControl
              label="Opacity" value={config.routeOpacity}
              min={0.1} max={1} step={0.05}
              onChange={setRouteOpacity} format={(v) => `${Math.round(v * 100)}%`}
            />
          </div>

          {/* ─── Position ─── */}
          <div>
            <p className="text-[11px] text-[#6B6B78] mb-2">Placement</p>
            <div className="grid grid-cols-2 gap-2">
              {POSITION_OPTIONS.map((pos) => {
                const isSel = config.routePosition === pos.value;
                return (
                  <button
                    key={pos.value}
                    onClick={() => setRoutePosition(pos.value)}
                    className="flex flex-col items-start p-3 rounded-xl transition-all text-left"
                    style={{
                      background: isSel ? 'rgba(252,76,2,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSel ? 'rgba(252,76,2,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: isSel ? '#FC4C02' : '#E8E8EA' }}>
                      {pos.label}
                    </p>
                    <p className="text-[10px] text-[#6B6B78] mt-0.5">{pos.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
