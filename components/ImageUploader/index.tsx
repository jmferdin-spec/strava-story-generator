'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStoryStore } from '@/store/useStoryStore';

export default function ImageUploader() {
  const { config, setBackgroundImage } = useStoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(
    (file: File) => {
      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas and crop/scale to 1080x1920
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1920;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setError('Canvas not supported');
            setIsLoading(false);
            return;
          }

          // Cover fit (crop to fill)
          const targetRatio = 1080 / 1920;
          const imgRatio = img.width / img.height;

          let sx = 0, sy = 0, sw = img.width, sh = img.height;

          if (imgRatio > targetRatio) {
            // Image is wider — crop sides
            sw = img.height * targetRatio;
            sx = (img.width - sw) / 2;
          } else {
            // Image is taller — crop top/bottom
            sh = img.width / targetRatio;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1080, 1920);

          // Export as high-quality JPEG to save memory
          const base64 = canvas.toDataURL('image/jpeg', 0.92);
          setBackgroundImage(base64);
          setIsLoading(false);
        };
        img.onerror = () => {
          setError('Failed to load image');
          setIsLoading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    },
    [setBackgroundImage]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      processImage(acceptedFiles[0]);
    },
    [processImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
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
      <div>
        <p className="section-label">Background Photo</p>
        <p className="text-xs text-[#6B6B78] mb-3">
          Upload a photo. It will be auto-cropped to 9:16 (1080×1920).
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
          /* Image preview */
          <div className="relative w-full rounded-xl overflow-hidden group">
            <img
              src={config.backgroundImage}
              alt="Background preview"
              className="w-full object-cover"
              style={{
                height: 200,
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
            {/* Overlay on hover */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <p className="text-xs text-white font-medium">Click to replace</p>
              <p className="text-[10px] text-white/60">or drag a new photo</p>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isDragActive ? '#FC4C02' : '#6B6B78'}
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: isDragActive ? '#FC4C02' : '#E8E8EA' }}
              >
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
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          {error}
        </div>
      )}

      {/* Remove photo button */}
      {config.backgroundImage && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setBackgroundImage(null);
          }}
          className="w-full py-2 rounded-lg text-xs text-[#6B6B78] hover:text-red-400 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          Remove photo
        </button>
      )}

      {/* Tips */}
      <div className="space-y-2">
        <p className="section-label">Tips</p>
        {[
          'Portrait photos work best for 9:16 format',
          'Action shots or running photos make great backgrounds',
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
