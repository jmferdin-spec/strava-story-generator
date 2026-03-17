'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { generateStoryHtml } from '@/lib/storyTemplates';
import { generateRouteSvg } from '@/lib/routeRenderer';
import {
  formatDistanceValue, formatTime, formatPaceValue,
  formatElevation, formatDateShort, formatCalories, formatHeartRate,
} from '@/lib/strava';
import { GRID_SIZE, STORY_WIDTH, STORY_HEIGHT, type StatPosition } from '@/types';
import RouteToolbar from '@/components/RouteToolbar';

const ASPECT = STORY_HEIGHT / STORY_WIDTH;

// ─── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Grid snap helper ──────────────────────────────────────────────────────────
function snapToGrid(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize;
}

// ─── Grid lines overlay ────────────────────────────────────────────────────────
function GridOverlay({ scale, visible }: { scale: number; visible: boolean }) {
  if (!visible) return null;
  const cols = Math.ceil(STORY_WIDTH / GRID_SIZE) + 1;
  const rows = Math.ceil(STORY_HEIGHT / GRID_SIZE) + 1;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-30"
      width={STORY_WIDTH * scale}
      height={STORY_HEIGHT * scale}
      style={{ opacity: 0.35 }}
    >
      {/* Vertical lines */}
      {Array.from({ length: cols }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={i * GRID_SIZE * scale}
          y1={0}
          x2={i * GRID_SIZE * scale}
          y2={STORY_HEIGHT * scale}
          stroke="#FC4C02"
          strokeWidth={0.5}
          strokeDasharray="3,5"
        />
      ))}
      {/* Horizontal lines */}
      {Array.from({ length: rows }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={i * GRID_SIZE * scale}
          x2={STORY_WIDTH * scale}
          y2={i * GRID_SIZE * scale}
          stroke="#FC4C02"
          strokeWidth={0.5}
          strokeDasharray="3,5"
        />
      ))}
    </svg>
  );
}

// ─── Drag handle overlay ───────────────────────────────────────────────────────
interface DragHandleProps {
  position: StatPosition;
  scale: number;
  onDragEnd: (pos: StatPosition) => void;
  snapping: boolean;
  onSnappingChange: (v: boolean) => void;
}

function DragHandle({ position, scale, onDragEnd, snapping, onSnappingChange }: DragHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<StatPosition>(position);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const x = (isDragging ? dragPos.x : position.x) * scale;
  const y = (isDragging ? dragPos.y : position.y) * scale;

  // Shared drag start logic
  const startDrag = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    onSnappingChange(true);
    startRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      posX: position.x,
      posY: position.y,
    };
    setDragPos({ x: position.x, y: position.y });
  }, [position, onSnappingChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startDrag(e.clientX, e.clientY);
  }, [startDrag]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  }, [startDrag]);

  useEffect(() => {
    if (!isDragging) return;

    // Shared move logic
    const moveHandler = (clientX: number, clientY: number) => {
      const dx = (clientX - startRef.current.mouseX) / scale;
      const dy = (clientY - startRef.current.mouseY) / scale;

      let rawX = startRef.current.posX + dx;
      let rawY = startRef.current.posY + dy;

      rawX = Math.max(80, Math.min(STORY_WIDTH - 80, rawX));
      rawY = Math.max(120, Math.min(STORY_HEIGHT - 150, rawY));

      const snappedX = snapToGrid(rawX, GRID_SIZE);
      const snappedY = snapToGrid(rawY, GRID_SIZE);

      setDragPos({ x: snappedX, y: snappedY });
    };

    // Shared end logic
    const endHandler = (clientX: number, clientY: number) => {
      setIsDragging(false);
      onSnappingChange(false);

      const dx = (clientX - startRef.current.mouseX) / scale;
      const dy = (clientY - startRef.current.mouseY) / scale;

      let rawX = Math.max(80, Math.min(STORY_WIDTH - 80, startRef.current.posX + dx));
      let rawY = Math.max(120, Math.min(STORY_HEIGHT - 150, startRef.current.posY + dy));

      const finalX = snapToGrid(rawX, GRID_SIZE);
      const finalY = snapToGrid(rawY, GRID_SIZE);

      onDragEnd({ x: finalX, y: finalY });
    };

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => moveHandler(e.clientX, e.clientY);
    const handleMouseUp = (e: MouseEvent) => endHandler(e.clientX, e.clientY);

    // Touch handlers
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      moveHandler(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      endHandler(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, scale, onDragEnd, onSnappingChange]);

  return (
    <div
      ref={containerRef}
      className="absolute z-40"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Crosshair snapping indicator (shows snap target while dragging) */}
      {isDragging && (
        <>
          <div className="absolute" style={{
            left: '50%', bottom: 0,
            width: 1, background: 'rgba(252,76,2,0.5)',
            transform: 'translateX(-50%)',
            height: STORY_HEIGHT * scale,
            top: -STORY_HEIGHT * scale,
          }} />
          <div className="absolute" style={{
            top: '50%', left: 0, right: 0,
            height: 1, background: 'rgba(252,76,2,0.5)',
            transform: 'translateY(-50%)',
          }} />
        </>
      )}

      {/* Handle ring — larger touch target on mobile */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative flex items-center justify-center transition-all duration-100"
        style={{
          width: isDragging ? 52 : 44,
          height: isDragging ? 52 : 44,
          borderRadius: '50%',
          background: isDragging
            ? 'rgba(252,76,2,0.25)'
            : 'rgba(252,76,2,0.12)',
          border: `2px solid ${isDragging ? '#FC4C02' : 'rgba(252,76,2,0.6)'}`,
          backdropFilter: 'blur(4px)',
          boxShadow: isDragging
            ? '0 0 0 4px rgba(252,76,2,0.15), 0 0 20px rgba(252,76,2,0.3)'
            : '0 0 0 2px rgba(252,76,2,0.1)',
          touchAction: 'none',
        }}
      >
        {/* Crosshair icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="2.5" stroke="#FC4C02" strokeWidth="1.5"/>
          <path d="M8 1v3M8 12v3M1 8h3M12 8h3" stroke="#FC4C02" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Coordinates tooltip while dragging */}
      {isDragging && (
        <div
          className="absolute top-full left-1/2 mt-2 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap"
          style={{
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(252,76,2,0.3)',
            color: '#FC4C02',
          }}
        >
          {dragPos.x} × {dragPos.y}
        </div>
      )}
    </div>
  );
}
// ─── Safe zone overlay ─────────────────────────────────────────────────────────
function SafeZoneIndicators({ scale }: { scale: number }) {
  return (
    <>
      {/* Top safe line */}
      <div className="absolute left-0 right-0 pointer-events-none z-20 flex items-center"
        style={{ top: 120 * scale }}>
        <div className="flex-1 h-px" style={{ background: 'rgba(252,76,2,0.3)' }} />
        <span className="px-2 py-0.5 text-[8px] rounded mx-1 whitespace-nowrap"
          style={{ color: 'rgba(252,76,2,0.7)', background: 'rgba(252,76,2,0.1)' }}>
          Safe ↓
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(252,76,2,0.3)' }} />
      </div>

      {/* Bottom safe line */}
      <div className="absolute left-0 right-0 pointer-events-none z-20 flex items-center"
        style={{ bottom: 150 * scale }}>
        <div className="flex-1 h-px" style={{ background: 'rgba(252,76,2,0.3)' }} />
        <span className="px-2 py-0.5 text-[8px] rounded mx-1 whitespace-nowrap"
          style={{ color: 'rgba(252,76,2,0.7)', background: 'rgba(252,76,2,0.1)' }}>
          Safe ↑
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(252,76,2,0.3)' }} />
      </div>
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function StoryPreview() {
  const {
    config, selectedActivity,
    setStatPosition, setUseAbsolutePosition,
  } = useStoryStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const prevHtmlRef = useRef('');

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Scale calculation
  const { previewWidth, previewHeight, scale } = useMemo(() => {
    const availH = containerSize.height - 80;
    const availW = containerSize.width - 80;
    if (!availW || !availH) return { previewWidth: 270, previewHeight: 480, scale: 0.25 };
    const maxW = Math.min(availW, availH / ASPECT);
    return { previewWidth: maxW, previewHeight: maxW * ASPECT, scale: maxW / STORY_WIDTH };
  }, [containerSize]);

  // Stats
  const stats = useMemo(() => {
    const units = config.units || 'metric';
    if (!selectedActivity) return {
      distance: units === 'imperial' ? '6.54' : '10.52', time: '52:43', pace: units === 'imperial' ? '8:04' : '5:01', elevation: units === 'imperial' ? '407ft' : '124m', heartrate: '–', calories: '–', date: 'Mar 9, 2024', description: '',
    };
    return {
      distance: formatDistanceValue(selectedActivity.distance, units),
      time: formatTime(selectedActivity.moving_time),
      pace: formatPaceValue(selectedActivity.average_speed, units),
      elevation: formatElevation(selectedActivity.total_elevation_gain, units),
      heartrate: selectedActivity.average_heartrate ? formatHeartRate(selectedActivity.average_heartrate) : '–',
      calories: selectedActivity.calories ? formatCalories(selectedActivity.calories) : '–',
      date: formatDateShort(selectedActivity.start_date_local),
      description: selectedActivity.description || '',
    };
  }, [selectedActivity, config.units]);

  // Route SVG (debounced 80ms — fast enough to feel live)
  const routeOptions = useMemo(() => ({
    showRoute: config.showRoute,
    routeColor: config.routeColor,
    routeThickness: config.routeThickness,
    routeOpacity: config.routeOpacity,
    routeGlowIntensity: config.routeGlowIntensity,
    polyline: selectedActivity?.map?.summary_polyline,
  }), [config.showRoute, config.routeColor, config.routeThickness, config.routeOpacity, config.routeGlowIntensity, selectedActivity]);

  const debouncedRouteOptions = useDebounced(routeOptions, 80);

  const routeSvg = useMemo(() => {
    if (!debouncedRouteOptions.showRoute || !debouncedRouteOptions.polyline) return undefined;
    return generateRouteSvg(debouncedRouteOptions.polyline, {
      width: STORY_WIDTH,
      height: STORY_HEIGHT * 0.4,
      color: debouncedRouteOptions.routeColor,
      thickness: debouncedRouteOptions.routeThickness,
      opacity: debouncedRouteOptions.routeOpacity,
      padding: 80,
      glowIntensity: debouncedRouteOptions.routeGlowIntensity,
    });
  }, [debouncedRouteOptions]);

  // Debounce expensive config changes (fonts, complex overlays) — 60ms
  const debouncedConfig = useDebounced(config, 60);

  const previewHtml = useMemo(() => {
    return generateStoryHtml({
      backgroundImage: debouncedConfig.backgroundImage,
      routeSvg,
      stats,
      visibleStats: debouncedConfig.visibleStats,
      config: debouncedConfig,
    });
  }, [debouncedConfig, routeSvg, stats]);

  // Flash subtle indicator when preview updates
  useEffect(() => {
    if (previewHtml !== prevHtmlRef.current) {
      prevHtmlRef.current = previewHtml;
      setIsUpdating(true);
      const id = setTimeout(() => setIsUpdating(false), 300);
      return () => clearTimeout(id);
    }
  }, [previewHtml]);

  // Drag callbacks
  const handleDragEnd = useCallback((pos: StatPosition) => {
    setStatPosition(pos);
    setUseAbsolutePosition(true);
  }, [setStatPosition, setUseAbsolutePosition]);

  const handleResetPosition = useCallback(() => {
    setUseAbsolutePosition(false);
    setStatPosition({ x: 540, y: 1440 });
  }, [setUseAbsolutePosition, setStatPosition]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center relative select-none">
      {/* Top metadata bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        <span className="text-[10px] text-[#3A3A44]">1080 × 1920</span>
        <span className="w-1 h-1 rounded-full bg-[#3A3A44]" />
        <span className="text-[10px] text-[#3A3A44]">Instagram Story</span>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FC4C02]"
            style={{ opacity: isUpdating ? 1 : 0.3, transition: 'opacity 0.2s' }} />
          <span className="text-[10px] text-[#3A3A44]">Live</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          width: previewWidth,
          height: previewHeight,
          borderRadius: 16 * scale,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 40px 80px rgba(0,0,0,0.7)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
      <RouteToolbar />
        {/* Grid overlay (only during drag) */}
        <GridOverlay scale={scale} visible={isGridVisible} />

        {/* Safe zone markers */}
        <SafeZoneIndicators scale={scale} />

        {/* Drag handle for stat block */}
        <DragHandle
          position={config.useAbsolutePosition ? config.statPosition : { x: 540, y: config.statVerticalOffset / 100 * STORY_HEIGHT }}
          scale={scale}
          onDragEnd={handleDragEnd}
          snapping={isGridVisible}
          onSnappingChange={setIsGridVisible}
        />

        {/* iframe preview */}
        <iframe
          key={iframeKey}
          srcDoc={previewHtml}
          className="border-0"
          style={{
            width: STORY_WIDTH,
            height: STORY_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
            opacity: isUpdating ? 0.85 : 1,
            transition: 'opacity 0.25s ease',
          }}
          sandbox="allow-same-origin"
          title="Story Preview"
        />

        {/* Update shimmer overlay */}
        {isUpdating && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(252,76,2,0.03) 50%, transparent 100%)',
              animation: 'shimmer 0.3s ease',
            }}
          />
        )}
      </div>

      {/* Bottom toolbar */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-xl z-10"
        style={{ background: 'rgba(17,17,19,0.9)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
      >
        {/* Scale */}
        <span className="text-[10px] text-[#3A3A44] font-mono">
          {Math.round(scale * 100)}%
        </span>

        <div className="w-px h-3 bg-[rgba(255,255,255,0.08)]" />

        {/* Drag position badge */}
        {config.useAbsolutePosition ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#FC4C02] font-mono">
              {config.statPosition.x} × {config.statPosition.y}
            </span>
            <button
              onClick={handleResetPosition}
              className="text-[10px] text-[#6B6B78] hover:text-white transition-colors"
            >
              reset
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-[#3A3A44]">
            Drag ◎ to reposition stats
          </span>
        )}

        <div className="w-px h-3 bg-[rgba(255,255,255,0.08)]" />

        {/* Grid toggle */}
        <button
          onClick={() => setIsGridVisible((v) => !v)}
          className="text-[10px] transition-colors"
          style={{ color: isGridVisible ? '#FC4C02' : '#3A3A44' }}
        >
          Grid
        </button>
      </div>

      {/* Empty state */}
      {!selectedActivity && (
        <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-none z-10">
          <div className="text-center animate-fade-in">
            <p className="text-xs text-[#3A3A44]">← Select a run to preview your story</p>
          </div>
        </div>
      )}
    </div>
  );
}
