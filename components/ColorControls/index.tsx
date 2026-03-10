'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useStoryStore } from '@/store/useStoryStore';
import type { OverlayType } from '@/types';

// ─── Color Picker Popover ──────────────────────────────────────────────────────

interface ColorPickerProps {
  color: string;
  onChange: (c: string) => void;
  onClose: () => void;
  label: string;
}

const PRESETS = [
  '#FFFFFF', '#000000', '#FC4C02', '#FF8C00', '#FFE500',
  '#00D4FF', '#00FF88', '#FF006E', '#8B5CF6', '#0A0A1A',
  '#1a2744', '#16213e', '#0f1923', '#2D1B69', '#1a0533',
];

function ColorPickerPopover({ color, onChange, onClose, label }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hexInput, setHexInput] = useState(color.replace('#', ''));

  useEffect(() => setHexInput(color.replace('#', '')), [color]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 z-50 p-4 rounded-2xl shadow-2xl animate-fade-in"
      style={{
        top: '100%', marginTop: 8,
        background: '#1E1E22',
        border: '1px solid rgba(255,255,255,0.1)',
        width: 240,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}
    >
      <p className="text-[10px] text-[#6B6B78] mb-3 uppercase tracking-wider">{label}</p>
      <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[#6B6B78] text-sm">#</span>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
            setHexInput(v);
            if (v.length === 6) onChange('#' + v);
          }}
          maxLength={6}
          className="flex-1 rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="aspect-square rounded-md transition-transform hover:scale-110"
            style={{
              background: p,
              boxShadow: color === p
                ? '0 0 0 2px #FC4C02, 0 0 0 4px rgba(252,76,2,0.25)'
                : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
            title={p}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Color row ─────────────────────────────────────────────────────────────────

function ColorRow({
  label, color, onChange,
}: {
  label: string; color: string; onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const displayColor = color.startsWith('rgba') ? '#888888' : color;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(255,255,255,0.03)]"
        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-6 h-6 rounded-lg flex-shrink-0 ring-1 ring-white/10"
          style={{ background: color }}
        />
        <div className="flex-1 text-left">
          <p className="text-[11px] text-[#E8E8EA]">{label}</p>
          <p className="text-[10px] text-[#6B6B78] font-mono">{displayColor}</p>
        </div>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 4l3 3 3-3" stroke="#6B6B78" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <ColorPickerPopover
          color={displayColor} onChange={onChange}
          onClose={() => setOpen(false)} label={label}
        />
      )}
    </div>
  );
}

// ─── Overlay type picker ───────────────────────────────────────────────────────

const OVERLAY_TYPES: {
  value: OverlayType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'solid',
    label: 'Solid',
    description: 'Uniform opacity',
    icon: (
      <div className="w-full h-full rounded-md" style={{ background: 'rgba(0,0,0,0.6)' }} />
    ),
  },
  {
    value: 'gradient-bottom',
    label: 'Fade Up',
    description: 'Dark at bottom',
    icon: (
      <div className="w-full h-full rounded-md" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }} />
    ),
  },
  {
    value: 'gradient-top',
    label: 'Fade Down',
    description: 'Dark at top',
    icon: (
      <div className="w-full h-full rounded-md" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)' }} />
    ),
  },
  {
    value: 'vignette',
    label: 'Vignette',
    description: 'Dark edges',
    icon: (
      <div className="w-full h-full rounded-md" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
    ),
  },
  {
    value: 'cinematic',
    label: 'Cinema',
    description: 'Dark bars',
    icon: (
      <div className="w-full h-full rounded-md overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 15%, transparent 30%, transparent 70%, rgba(0,0,0,0.9) 85%)' }} />
    ),
  },
  {
    value: 'duotone',
    label: 'Duotone',
    description: 'Color blend',
    icon: (
      <div className="w-full h-full rounded-md" style={{ background: 'linear-gradient(135deg, rgba(252,76,2,0.7) 0%, rgba(26,5,51,0.9) 100%)' }} />
    ),
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────

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

export default function ColorControls() {
  const {
    config,
    setStatColor, setLabelColor, setOverlayColor, setOverlayOpacity,
    setOverlayType, setAccentColor, setGradientStartColor, setGradientEndColor,
  } = useStoryStore();

  const isDuotone = config.overlayType === 'duotone';

  return (
    <div className="p-4 space-y-5">
      <p className="section-label">Overlay Style</p>

      {/* Overlay type grid */}
      <div className="grid grid-cols-3 gap-2">
        {OVERLAY_TYPES.map((ot) => {
          const isSelected = config.overlayType === ot.value;
          return (
            <button
              key={ot.value}
              onClick={() => setOverlayType(ot.value)}
              className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all"
              style={{
                background: isSelected ? 'rgba(252,76,2,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${isSelected ? '#FC4C02' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="w-full rounded-lg overflow-hidden relative" style={{ height: 36, background: 'linear-gradient(135deg, #1a2744 0%, #0d1520 100%)' }}>
                {ot.icon}
              </div>
              <div>
                <p className="text-[10px] font-medium" style={{ color: isSelected ? '#FC4C02' : '#E8E8EA' }}>
                  {ot.label}
                </p>
                <p className="text-[9px] text-[#3A3A44]">{ot.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Overlay controls */}
      <div
        className="p-3 rounded-xl space-y-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <ColorRow label="Overlay Color" color={config.overlayColor} onChange={setOverlayColor} />
        <SliderControl
          label="Opacity" value={config.overlayOpacity}
          min={0} max={1} step={0.05}
          onChange={setOverlayOpacity} format={(v) => `${Math.round(v * 100)}%`}
        />

        {/* Duotone extra colors */}
        {isDuotone && (
          <>
            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <p className="text-[10px] text-[#6B6B78] mb-2">Duotone Colors</p>
              <div className="space-y-2">
                <ColorRow label="Highlight" color={config.gradientStartColor} onChange={setGradientStartColor} />
                <ColorRow label="Shadow"    color={config.gradientEndColor}   onChange={setGradientEndColor} />
              </div>
            </div>
          </>
        )}
      </div>

      <p className="section-label">Colors</p>

      {/* Stat & accent colors */}
      <div className="space-y-2">
        {[
          { label: 'Stat Text',   color: config.statColor,   set: setStatColor },
          { label: 'Label Text',  color: config.labelColor,  set: setLabelColor },
          { label: 'Accent',      color: config.accentColor, set: setAccentColor },
        ].map(({ label, color, set }) => (
          <ColorRow key={label} label={label} color={color} onChange={set} />
        ))}
      </div>
    </div>
  );
}
