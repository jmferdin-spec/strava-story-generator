'use client';

import { useEffect, useState } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { GOOGLE_FONTS_MAP } from '@/lib/storyTemplates';
import type { FontFamily, FontWeight } from '@/types';

// All supported fonts with metadata
const FONT_CATALOG: {
  value: FontFamily;
  category: string;
  sample: string;
  weights: FontWeight[];
  style: string; // for sample text preview
}[] = [
  { value: 'Anton',            category: 'Impact',    sample: '10.52km', weights: ['400'],                                    style: 'condensed bold display' },
  { value: 'Bebas Neue',       category: 'Impact',    sample: 'BEBAS',   weights: ['400'],                                    style: 'all-caps display' },
  { value: 'Staatliches',      category: 'Impact',    sample: 'WIDE',    weights: ['400'],                                    style: 'ultra-wide condensed' },
  { value: 'Black Han Sans',   category: 'Impact',    sample: 'HEAVY',   weights: ['400'],                                    style: 'heavy korean-style' },
  { value: 'Fjalla One',       category: 'Impact',    sample: '52:43',   weights: ['400'],                                    style: 'editorial condensed' },
  { value: 'Russo One',        category: 'Impact',    sample: 'RUN',     weights: ['400'],                                    style: 'techy geometric' },
  { value: 'Oswald',           category: 'Condensed', sample: 'Oswald',  weights: ['300','400','500','600','700'],            style: 'elegant condensed' },
  { value: 'Teko',             category: 'Condensed', sample: 'TEKO',    weights: ['300','400','500','600','700'],            style: 'sporty condensed' },
  { value: 'Barlow Condensed', category: 'Condensed', sample: 'BARLOW',  weights: ['300','400','500','600','700','800','900'], style: 'modern condensed' },
  { value: 'Montserrat',       category: 'Geometric', sample: 'Montserrat', weights: ['300','400','500','600','700','800','900'], style: 'clean geometric' },
  { value: 'Raleway',          category: 'Geometric', sample: 'Raleway',    weights: ['300','400','500','600','700','800','900'], style: 'elegant geometric' },
  { value: 'Inter',            category: 'Sans-Serif', sample: 'Inter',      weights: ['300','400','500','600','700','800','900'], style: 'neutral modern' },
  { value: 'Space Mono',       category: 'Monospace', sample: '05:01/km',   weights: ['400','700'],                             style: 'typewriter mono' },
  { value: 'DM Serif Display', category: 'Serif',     sample: 'Serif',      weights: ['400'],                                    style: 'editorial serif' },
];

const WEIGHT_OPTIONS: { value: FontWeight; label: string }[] = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'SemiBold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra' },
  { value: '900', label: 'Black' },
];

const CATEGORIES = ['Impact', 'Condensed', 'Geometric', 'Sans-Serif', 'Monospace', 'Serif'];

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

// Injects a single Google Fonts link into the document head
function useGoogleFont(fontFamily: FontFamily) {
  useEffect(() => {
    const url = GOOGLE_FONTS_MAP[fontFamily];
    if (!url) return;
    const id = `gf-${fontFamily.replace(/\s+/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }, [fontFamily]);
}

// Load ALL fonts upfront so previews render correctly
function useAllGoogleFonts() {
  useEffect(() => {
    Object.entries(GOOGLE_FONTS_MAP).forEach(([family, url]) => {
      const id = `gf-${family.replace(/\s+/g, '-')}`;
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);
}

export default function FontControls() {
  const { config, setFontFamily, setFontSize, setFontWeight, setLetterSpacing } = useStoryStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useAllGoogleFonts();
  useGoogleFont(config.fontFamily);

  const currentFont = FONT_CATALOG.find((f) => f.value === config.fontFamily);
  const filteredFonts = activeCategory
    ? FONT_CATALOG.filter((f) => f.category === activeCategory)
    : FONT_CATALOG;

  // Available weights for selected font
  const availableWeights = currentFont?.weights ?? WEIGHT_OPTIONS.map((w) => w.value);
  const filteredWeights = WEIGHT_OPTIONS.filter((w) =>
    availableWeights.includes(w.value as FontWeight)
  );

  return (
    <div className="p-4 space-y-5">
      <p className="section-label">Typography</p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory(null)}
          className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
          style={{
            background: activeCategory === null ? 'rgba(252,76,2,0.15)' : 'rgba(255,255,255,0.04)',
            color: activeCategory === null ? '#FC4C02' : '#6B6B78',
            border: `1px solid ${activeCategory === null ? 'rgba(252,76,2,0.3)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
            style={{
              background: activeCategory === cat ? 'rgba(252,76,2,0.15)' : 'rgba(255,255,255,0.04)',
              color: activeCategory === cat ? '#FC4C02' : '#6B6B78',
              border: `1px solid ${activeCategory === cat ? 'rgba(252,76,2,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Font grid */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {filteredFonts.map((font) => {
          const isSelected = config.fontFamily === font.value;
          return (
            <button
              key={font.value}
              onClick={() => setFontFamily(font.value)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group"
              style={{
                background: isSelected ? 'rgba(252,76,2,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? 'rgba(252,76,2,0.25)' : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              {/* Font name */}
              <div className="text-left flex-shrink-0 mr-3">
                <p className="text-[11px]" style={{ color: isSelected ? '#FC4C02' : '#9B9BA8' }}>
                  {font.value}
                </p>
                <p className="text-[9px] text-[#3A3A44] mt-0.5">{font.style}</p>
              </div>

              {/* Live font preview */}
              <span
                className="text-right leading-none"
                style={{
                  fontFamily: `'${font.value}', sans-serif`,
                  fontSize: font.category === 'Serif' ? 15 : 17,
                  color: isSelected ? '#FC4C02' : '#E8E8EA',
                  opacity: isSelected ? 1 : 0.7,
                  fontWeight: font.value === 'Bebas Neue' || font.value === 'Anton' ? 400 : 700,
                  letterSpacing: font.category === 'Condensed' ? '0.02em' : undefined,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'clip',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}
              >
                {font.sample}
              </span>

              {isSelected && (
                <div className="ml-2 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: '#FC4C02' }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Size controls */}
      <div
        className="p-3 rounded-xl space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <SliderControl
          label="Base Size" value={config.fontSize}
          min={32} max={120} step={4}
          onChange={setFontSize} format={(v) => `${v}px`}
        />
        <SliderControl
          label="Letter Spacing" value={config.letterSpacing}
          min={-0.06} max={0.3} step={0.01}
          onChange={setLetterSpacing} format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}em`}
        />
      </div>

      {/* Weight picker */}
      <div>
        <label className="text-[11px] text-[#6B6B78] mb-2 block">Weight</label>
        <div className="grid grid-cols-4 gap-1.5">
          {filteredWeights.map((w) => {
            const isSelected = config.fontWeight === w.value;
            const isAvailable = availableWeights.includes(w.value as FontWeight);
            return (
              <button
                key={w.value}
                onClick={() => isAvailable && setFontWeight(w.value)}
                disabled={!isAvailable}
                className="py-1.5 rounded-lg text-[10px] text-center transition-all disabled:opacity-30"
                style={{
                  background: isSelected ? 'rgba(252,76,2,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? 'rgba(252,76,2,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  color: isSelected ? '#FC4C02' : '#6B6B78',
                  fontFamily: `'${config.fontFamily}', sans-serif`,
                  fontWeight: w.value,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                }}
              >
                {w.label}
              </button>
            );
          })}
        </div>
        {filteredWeights.length < WEIGHT_OPTIONS.length && (
          <p className="text-[10px] text-[#3A3A44] mt-2">
            {WEIGHT_OPTIONS.length - filteredWeights.length} weights not available for this font
          </p>
        )}
      </div>

      {/* Live preview sample */}
      <div
        className="p-4 rounded-xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-[9px] text-[#3A3A44] uppercase tracking-widest mb-3">Preview</p>
        <div
          style={{
            fontFamily: `'${config.fontFamily}', sans-serif`,
            fontSize: Math.max(24, config.fontSize * 0.38),
            fontWeight: config.fontWeight,
            color: '#FFFFFF',
            letterSpacing: `${config.letterSpacing}em`,
            lineHeight: 1.1,
          }}
        >
          10.52<span style={{ fontSize: '0.4em', opacity: 0.6, marginLeft: 4 }}>km</span>
        </div>
        <div
          className="mt-2"
          style={{
            fontFamily: `'${config.fontFamily}', sans-serif`,
            fontSize: Math.max(11, config.fontSize * 0.22),
            fontWeight: 400,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Distance
        </div>
      </div>
    </div>
  );
}
