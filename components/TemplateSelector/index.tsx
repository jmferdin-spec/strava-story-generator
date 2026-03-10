'use client';

import { useStoryStore } from '@/store/useStoryStore';
import { STORY_TEMPLATES } from '@/lib/storyTemplates';
import type { TemplateId } from '@/types';

const TEMPLATE_PREVIEWS: Record<TemplateId, React.ReactNode> = {
  'minimal-bottom': (
    <div className="w-full h-full flex flex-col justify-end p-2" style={{ background: 'linear-gradient(to bottom, #1a2744 0%, #0d1520 100%)' }}>
      <div className="space-y-0.5">
        <div className="w-4 h-0.5 rounded-full bg-[#FC4C02]" />
        <div className="text-white font-bold text-[8px] leading-none">12.34</div>
        <div className="text-white/40 text-[5px]">km</div>
        <div className="flex gap-1.5">
          <div className="text-white/60 text-[5px]">58:12</div>
          <div className="text-white/60 text-[5px]">5:15/km</div>
        </div>
      </div>
    </div>
  ),
  'large-center': (
    <div className="w-full h-full flex flex-col items-center justify-center p-2" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="text-[#FC4C02] text-[5px] uppercase tracking-widest mb-0.5">Distance</div>
      <div className="text-white font-black text-[14px] leading-none">12.3</div>
      <div className="text-white/40 text-[5px]">km</div>
      <div className="w-4 h-0.5 bg-[#FC4C02] my-1" />
      <div className="flex gap-2">
        <div className="text-center"><div className="text-white/40 text-[4px]">TIME</div><div className="text-white text-[6px]">58:12</div></div>
        <div className="text-center"><div className="text-white/40 text-[4px]">PACE</div><div className="text-white text-[6px]">5:15</div></div>
      </div>
    </div>
  ),
  'route-focus': (
    <div className="w-full h-full flex flex-col justify-end p-2" style={{ background: '#0A0A1A' }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 70" preserveAspectRatio="none">
        <path d="M5 60 Q15 40 20 35 Q25 30 35 15" stroke="#00D4FF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      </svg>
      <div className="relative space-y-0.5">
        <div className="text-white/40 text-[5px] font-mono uppercase">Route</div>
        <div className="text-white font-bold text-[8px]">12.34 km</div>
      </div>
    </div>
  ),
  'gradient-bar': (
    <div className="w-full h-full flex flex-col justify-end" style={{ background: 'linear-gradient(to bottom, #1a2744 0%, #0d1520 100%)' }}>
      <div className="p-2" style={{ background: 'linear-gradient(135deg, #FC4C02 0%, #E63E00 100%)', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="flex justify-around">
          {['12.3', '58:12', '5:15'].map((v, i) => (
            <div key={i} className="text-center">
              <div className="text-white font-bold text-[7px]">{v}</div>
              <div className="text-white/60 text-[4px]">{['km', 'time', 'pace'][i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  'athlete-poster': (
    <div className="w-full h-full flex flex-col justify-end p-2" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
      <div className="w-8 h-1 rounded-full bg-[#FFE500] mb-1" />
      <div className="text-white font-black text-[12px] leading-none">12.3</div>
      <div className="text-white/40 text-[5px] uppercase tracking-widest">Total Distance</div>
      <div className="flex gap-2 mt-1">
        <div className="text-white text-[6px]">58:12</div>
        <div className="text-white text-[6px]">5:15/km</div>
      </div>
    </div>
  ),
};

export default function TemplateSelector() {
  const { config, setTemplate, applyTemplateDefaults } = useStoryStore();

  const handleSelectTemplate = (templateId: TemplateId) => {
    applyTemplateDefaults(templateId);
    setTemplate(templateId);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="section-label">Choose a Template</p>
        <p className="text-xs text-[#6B6B78] mb-3">
          Start with a pre-designed layout, then customize everything.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STORY_TEMPLATES.map((template) => {
          const isSelected = config.templateId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template.id as TemplateId)}
              className="relative flex flex-col overflow-hidden rounded-xl transition-all duration-200"
              style={{
                border: `1.5px solid ${isSelected ? '#FC4C02' : 'rgba(255,255,255,0.07)'}`,
                background: isSelected
                  ? 'rgba(252,76,2,0.05)'
                  : 'rgba(255,255,255,0.02)',
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative w-full overflow-hidden"
                style={{ height: 80, background: 'linear-gradient(135deg, #1a2744 0%, #0d1520 100%)' }}
              >
                {TEMPLATE_PREVIEWS[template.id as TemplateId]}
                {isSelected && (
                  <div
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#FC4C02' }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="p-2.5">
                <p
                  className="text-xs font-medium leading-tight"
                  style={{ color: isSelected ? '#FC4C02' : '#E8E8EA' }}
                >
                  {template.name}
                </p>
                <p className="text-[10px] text-[#6B6B78] mt-0.5 line-clamp-1">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current template info */}
      <div
        className="p-3 rounded-xl"
        style={{
          background: 'rgba(252,76,2,0.06)',
          border: '1px solid rgba(252,76,2,0.15)',
        }}
      >
        <p className="text-[10px] font-medium text-[#FC4C02] mb-1">
          {STORY_TEMPLATES.find((t) => t.id === config.templateId)?.name}
        </p>
        <p className="text-[10px] text-[#6B6B78]">
          {STORY_TEMPLATES.find((t) => t.id === config.templateId)?.description}
        </p>
      </div>
    </div>
  );
}
