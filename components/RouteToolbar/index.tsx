'use client';

import { useState } from 'react';
import { useStoryStore } from '@/store/useStoryStore';

function MiniSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {icon && <span className="text-[#6B6B78]">{icon}</span>}
          <span className="text-[10px] text-[#6B6B78]">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-[#E8E8EA]">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          e.stopPropagation();
          onChange(parseFloat(e.target.value));
        }}
        className="w-full"
        style={{ accentColor: '#FC4C02', height: 4 }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function RouteToolbar() {
  const {
    config,
    setRouteOffsetX,
    setRouteOffsetY,
    setRouteScale,
    selectedActivity,
  } = useStoryStore();

  const [isOpen, setIsOpen] = useState(false);

  const hasRoute = config.showRoute && Boolean(selectedActivity?.map?.summary_polyline);

  if (!hasRoute) return null;

  const handleReset = () => {
    setRouteOffsetX(0);
    setRouteOffsetY(0);
    setRouteScale(100);
  };

  return (
    <div className="absolute top-3 right-3 z-30">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
        style={{
          background: isOpen ? 'rgba(252,76,2,0.15)' : 'rgba(17,17,19,0.85)',
          border: `1px solid ${isOpen ? 'rgba(252,76,2,0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: isOpen ? '#FC4C02' : '#6B6B78',
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 9 Q5 3 7 5 Q9 7 10 3"/>
          <circle cx="2" cy="9" r="1" fill="currentColor" stroke="none"/>
          <circle cx="10" cy="3" r="1" fill="currentColor" stroke="none"/>
        </svg>
        Route
      </button>

      {/* Floating panel */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 p-3 rounded-xl space-y-3 animate-fade-in"
          style={{
            width: 220,
            background: 'rgba(17,17,19,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-[#E8E8EA]">Route Position</span>
            <button
              onClick={handleReset}
              className="text-[10px] text-[#6B6B78] hover:text-[#FC4C02] transition-colors"
            >
              Reset
            </button>
          </div>

          <MiniSlider
            label="Horizontal"
            value={config.routeOffsetX ?? 0}
            min={-50} max={50} step={1}
            onChange={setRouteOffsetX}
            format={(v) => `${v > 0 ? '+' : ''}${v}%`}
            icon={
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 6h8M9 4l1.5 2-1.5 2M3 4L1.5 6 3 8"/>
              </svg>
            }
          />

          <MiniSlider
            label="Vertical"
            value={config.routeOffsetY ?? 0}
            min={-50} max={50} step={1}
            onChange={setRouteOffsetY}
            format={(v) => `${v > 0 ? '+' : ''}${v}%`}
            icon={
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 2v8M4 9l2 1.5L8 9M4 3l2-1.5L8 3"/>
              </svg>
            }
          />

          <MiniSlider
            label="Scale"
            value={config.routeScale ?? 100}
            min={30} max={250} step={5}
            onChange={setRouteScale}
            format={(v) => `${v}%`}
            icon={
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="5" cy="5" r="3.5"/>
                <path d="M8 8l2.5 2.5"/>
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
}
