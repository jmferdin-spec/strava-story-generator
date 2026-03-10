'use client';

import { useStoryStore } from '@/store/useStoryStore';
import type { StatAlignment, StoryConfig, UnitSystem } from '@/types';

type StatKey = keyof StoryConfig['visibleStats'];

const STATS: { key: StatKey; label: string; icon: string; descriptions: Record<UnitSystem, string> }[] = [
  { key: 'distance', label: 'Distance', icon: '📏', descriptions: { metric: 'Total km run', imperial: 'Total miles run' } },
  { key: 'time', label: 'Moving Time', icon: '⏱️', descriptions: { metric: 'Active duration', imperial: 'Active duration' } },
  { key: 'pace', label: 'Average Pace', icon: '⚡', descriptions: { metric: 'Min per kilometer', imperial: 'Min per mile' } },
  { key: 'elevation', label: 'Elevation Gain', icon: '⛰️', descriptions: { metric: 'Total meters climbed', imperial: 'Total feet climbed' } },
  { key: 'date', label: 'Date', icon: '📅', descriptions: { metric: 'Activity date', imperial: 'Activity date' } },
];

const ALIGNMENTS: { value: StatAlignment; icon: React.ReactNode; label: string }[] = [
  {
    value: 'left',
    label: 'Left',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="3" width="10" height="2" rx="1"/>
        <rect x="2" y="7" width="7" height="2" rx="1"/>
        <rect x="2" y="11" width="9" height="2" rx="1"/>
      </svg>
    ),
  },
  {
    value: 'center',
    label: 'Center',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="3" y="3" width="10" height="2" rx="1"/>
        <rect x="4.5" y="7" width="7" height="2" rx="1"/>
        <rect x="3.5" y="11" width="9" height="2" rx="1"/>
      </svg>
    ),
  },
  {
    value: 'right',
    label: 'Right',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="4" y="3" width="10" height="2" rx="1"/>
        <rect x="7" y="7" width="7" height="2" rx="1"/>
        <rect x="5" y="11" width="9" height="2" rx="1"/>
      </svg>
    ),
  },
];

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-[#6B6B78]">{label}</label>
        <span className="text-[11px] font-mono text-[#E8E8EA] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)]">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: '#FC4C02' }}
      />
    </div>
  );
}

export default function StatControls() {
  const {
    config,
    toggleStat,
    setStatAlignment,
    setStatVerticalOffset,
    setUnits,
  } = useStoryStore();

  const units = config.units || 'metric';

  return (
    <div className="p-4 space-y-5">
      {/* Unit system toggle */}
      <div>
        <p className="section-label">Unit System</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'metric' as UnitSystem, label: 'Metric', sub: 'km, /km, m' },
            { value: 'imperial' as UnitSystem, label: 'Imperial', sub: 'mi, /mi, ft' },
          ]).map((option) => {
            const isSelected = units === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setUnits(option.value)}
                className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
                style={{
                  background: isSelected ? 'rgba(252,76,2,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(252,76,2,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  color: isSelected ? '#FC4C02' : '#6B6B78',
                }}
              >
                <span className="text-xs font-medium">{option.label}</span>
                <span className="text-[10px] opacity-60">{option.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visible stats */}
      <div>
        <p className="section-label">Visible Stats</p>
        <div className="space-y-2">
          {STATS.map((stat) => {
            const isVisible = config.visibleStats[stat.key];
            return (
              <button
                key={stat.key}
                onClick={() => toggleStat(stat.key)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: isVisible
                    ? 'rgba(252,76,2,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isVisible ? 'rgba(252,76,2,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{stat.icon}</span>
                  <div className="text-left">
                    <p
                      className="text-xs font-medium"
                      style={{ color: isVisible ? '#E8E8EA' : '#6B6B78' }}
                    >
                      {stat.label}
                    </p>
                    <p className="text-[10px] text-[#3A3A44]">{stat.descriptions[units]}</p>
                  </div>
                </div>

                {/* Toggle */}
                <div
                  className="w-9 h-5 rounded-full relative transition-all flex-shrink-0"
                  style={{
                    background: isVisible ? '#FC4C02' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{
                      left: isVisible ? '18px' : '2px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alignment */}
      <div>
        <p className="section-label">Text Alignment</p>
        <div className="grid grid-cols-3 gap-2">
          {ALIGNMENTS.map((align) => {
            const isSelected = config.statAlignment === align.value;
            return (
              <button
                key={align.value}
                onClick={() => setStatAlignment(align.value)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                style={{
                  background: isSelected ? 'rgba(252,76,2,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(252,76,2,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  color: isSelected ? '#FC4C02' : '#6B6B78',
                }}
              >
                {align.icon}
                <span className="text-[10px]">{align.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vertical position */}
      <div
        className="p-3 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <SliderControl
          label="Vertical Position"
          value={config.statVerticalOffset}
          min={10}
          max={95}
          step={5}
          onChange={setStatVerticalOffset}
          format={(v) => `${v}%`}
        />
        <p className="text-[10px] text-[#3A3A44] mt-2">
          Controls where the stat block appears vertically on the story.
        </p>
      </div>
    </div>
  );
}
