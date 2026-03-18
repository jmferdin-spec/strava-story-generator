'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStoryStore } from '@/store/useStoryStore';

// ─── Crop Modal ──────────────────────────────────────────────────────────────

interface CropModalProps {
  imageSrc: string;
  onCrop: (base64: string) => void;
  onCancel: () => void;
}

function CropModal({ imageSrc, onCrop, onCancel }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Target ratio: 9:16
  const TARGET_RATIO = 9 / 16;

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.width, h: img.height });

      // Calculate initial zoom so image covers the crop area
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cw = rect.width;
        const ch = rect.height;
        setContainerSize({ w: cw, h: ch });

        // Crop frame dimensions within container
        const cropW = cw;
        const cropH = cw / TARGET_RATIO;

        const scaleToFitW = cropW / img.width;
        const scaleToFitH = cropH / img.height;
        const initialZoom = Math.max(scaleToFitW, scaleToFitH);

        setZoom(initialZoom);
        setOffset({ x: 0, y: 0 });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Clamp offset so image always covers crop area
  const clampOffset = useCallback((ox: number, oy: number, z: number) => {
    if (!imgRef.current || containerSize.w === 0) return { x: ox, y: oy };

    const cw = containerSize.w;
    const cropH = cw / TARGET_RATIO;
    const scaledW = imgRef.current.width * z;
    const scaledH = imgRef.current.height * z;

    const maxX = Math.max(0, (scaledW - cw) / 2);
    const maxY = Math.max(0, (scaledH - cropH) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, [containerSize]);

  // Draw preview
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || containerSize.w === 0) return;

    const cw = containerSize.w;
    const cropH = cw / TARGET_RATIO;

    canvas.width = cw * 2;
    canvas.height = cropH * 2;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${cropH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaledW = img.width * zoom;
    const scaledH = img.height * zoom;

    const drawX = (cw - scaledW) / 2 + offset.x;
    const drawY = (cropH - scaledH) / 2 + offset.y;

    ctx.drawImage(img, drawX * 2, drawY * 2, scaledW * 2, scaledH * 2);
  }, [zoom, offset, imgSize, containerSize]);

  // Mouse drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const clamped = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom);
    setOffset(clamped);
  }, [isDragging, zoom, clampOffset]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom change and re-clamp
  const handleZoom = useCallback((newZoom: number) => {
    setZoom(newZoom);
    setOffset(prev => clampOffset(prev.x, prev.y, newZoom));
  }, [clampOffset]);

  // Calculate min zoom so image always covers crop area
  const getMinZoom = () => {
    if (!imgRef.current || containerSize.w === 0) return 0.1;
    const cw = containerSize.w;
    const cropH = cw / TARGET_RATIO;
    return Math.max(cw / imgRef.current.width, cropH / imgRef.current.height);
  };

  // Export crop
  const handleCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img || containerSize.w === 0) return;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = 1080;
    outCanvas.height = 1920;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    const cw = containerSize.w;
    const cropH = cw / TARGET_RATIO;

    const scaledW = img.width * zoom;
    const scaledH = img.height * zoom;

    const drawX = (cw - scaledW) / 2 + offset.x;
    const drawY = (cropH - scaledH) / 2 + offset.y;

    // Map from container coords to output coords
    const scaleOut = 1080 / cw;

    ctx.drawImage(
      img,
      drawX * scaleOut,
      drawY * scaleOut,
      scaledW * scaleOut,
      scaledH * scaleOut,
    );

    const base64 = outCanvas.toDataURL('image/jpeg', 0.92);
    onCrop(base64);
  }, [zoom, offset, containerSize, onCrop]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#0A0A0B' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4"
        style={{
          height: 52,
          background: '#111113',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <button
          onClick={onCancel}
          className="text-sm text-[#6B6B78] hover:text-white transition-colors"
        >
          Cancel
        </button>
        <span className="text-sm font-medium text-white">Adjust Photo</span>
        <button
          onClick={handleCrop}
          className="text-sm font-medium transition-colors"
          style={{ color: '#FC4C02' }}
        >
          Done
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative overflow-hidden h-full"
          style={{ touchAction: 'none', aspectRatio: '9/16', maxHeight: '100%' }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="block"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
          />
          {/* Crop frame overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Rule of thirds grid */}
            <div className="absolute inset-0" style={{ opacity: isDragging ? 0.4 : 0 }}>
              <div className="absolute" style={{ left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
              <div className="absolute" style={{ left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
              <div className="absolute" style={{ top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
              <div className="absolute" style={{ top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Zoom slider */}
      <div
        className="flex-shrink-0 px-6 py-4 flex items-center gap-4"
        style={{
          background: '#111113',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6B6B78" strokeWidth="1.5">
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l3 3" strokeLinecap="round" />
          <path d="M5 7h4" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          min={getMinZoom()}
          max={getMinZoom() * 4}
          step={0.001}
          value={zoom}
          onChange={(e) => handleZoom(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: '#FC4C02' }}
        />
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6B6B78" strokeWidth="1.5">
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l3 3" strokeLinecap="round" />
          <path d="M5 7h4M7 5v4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── Main ImageUploader ─────────────────────────────────────────────────────

export default function ImageUploader() {
  const { config, setBackgroundImage } = useStoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const loadImage = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setIsLoading(false);
      setPendingImage(e.target?.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCrop = useCallback((base64: string) => {
    setBackgroundImage(base64);
    setPendingImage(null);
  }, [setBackgroundImage]);

  const handleCropCancel = useCallback(() => {
    setPendingImage(null);
  }, []);

  // Re-crop: reload the current background into the crop modal
  const handleRecrop = useCallback(() => {
    if (config.backgroundImage) {
      setPendingImage(config.backgroundImage);
    }
  }, [config.backgroundImage]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      loadImage(acceptedFiles[0]);
    },
    [loadImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDropRejected: (fileRejections) => {
      const err = fileRejections[0]?.errors[0];
      if (err?.code === 'file-too-large') {
        setError('File too large. Max 20MB.');
      } else {
        setError('Invalid file type. Please upload an image.');
      }
    },
  });

  return (
    <div className="p-4 space-y-4">
      {/* Crop modal */}
      {pendingImage && (
        <CropModal
          imageSrc={pendingImage}
          onCrop={handleCrop}
          onCancel={handleCropCancel}
        />
      )}

      <div>
        <p className="section-label">Background Photo</p>
        <p className="text-xs text-[#6B6B78] mb-3">
          Upload a photo, then zoom and drag to position.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className="relative flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-200"
        style={{
          height: config.backgroundImage ? 'auto' : 160,
          background: isDragActive
            ? 'rgba(252,76,2,0.08)'
            : 'rgba(255,255,255,0.02)',
          border: `2px dashed ${isDragActive ? '#FC4C02' : 'rgba(255,255,255,0.1)'}`,
          padding: config.backgroundImage ? 0 : undefined,
        }}
      >
        <input {...getInputProps()} />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#FC4C02', borderTopColor: 'transparent' }}
            />
            <p className="text-xs text-[#6B6B78]">Processing…</p>
          </div>
        ) : config.backgroundImage ? (
          <div className="relative w-full rounded-xl overflow-hidden group">
            <img
              src={config.backgroundImage}
              alt="Background preview"
              className="w-full object-cover"
              style={{ height: 200, objectFit: 'cover', objectPosition: 'center' }}
            />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <p className="text-xs text-white font-medium">Click to replace</p>
              <p className="text-[10px] text-white/60">or drag a new photo</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <svg
                width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke={isDragActive ? '#FC4C02' : '#6B6B78'} strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: isDragActive ? '#FC4C02' : '#E8E8EA' }}>
                {isDragActive ? 'Drop your photo here' : 'Drop photo here'}
              </p>
              <p className="text-xs text-[#6B6B78] mt-1">
                or <span style={{ color: '#FC4C02' }}>click to browse</span>
              </p>
              <p className="text-[10px] text-[#3A3A44] mt-1.5">
                JPG, PNG, WebP • Max 20MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-3 rounded-lg text-xs text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          {error}
        </div>
      )}

      {/* Action buttons */}
      {config.backgroundImage && (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRecrop();
            }}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: '#FC4C02',
              background: 'rgba(252,76,2,0.06)',
              border: '1px solid rgba(252,76,2,0.15)',
            }}
          >
            Adjust crop
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setBackgroundImage(null);
            }}
            className="flex-1 py-2 rounded-lg text-xs text-[#6B6B78] hover:text-red-400 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Remove photo
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="space-y-2">
        <p className="section-label">Tips</p>
        {[
          'Portrait photos work best for 9:16 format',
          'Use the zoom slider to find the best framing',
          'Dark or low-contrast areas help text readability',
        ].map((tip) => (
          <div key={tip} className="flex items-start gap-2">
            <span className="text-[#FC4C02] mt-0.5 flex-shrink-0">•</span>
            <p className="text-[11px] text-[#6B6B78]">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
