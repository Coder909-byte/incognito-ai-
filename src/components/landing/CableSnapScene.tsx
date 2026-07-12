'use client';
// src/components/landing/CableSnapScene.tsx
// Static cable scene with CSS animations - no GSAP dependency.
// Shows the cable path and editor preview with emerald accent.

import HeroTitleReveal from './HeroTitleReveal';

export default function CableSnapScene() {
  const editorPreviewRef = { current: null as HTMLDivElement | null };

  return (
    <section
      id="cable-scene"
      aria-label="How IncognitoAI works animation"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* SVG Cable Scene */}
      <div className="relative w-full max-w-3xl mx-auto px-8 mb-20" aria-hidden="true">
        <svg
          viewBox="0 0 600 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          {/* Cloud node */}
          <rect x="20" y="70" width="80" height="50" rx="4" stroke="rgba(113,113,122,0.4)" strokeWidth="1" fill="rgba(39,39,42,0.4)" />
          <text x="60" y="90" textAnchor="middle" fill="rgba(113,113,122,0.7)" fontSize="8" fontFamily="monospace">CLOUD</text>
          <text x="60" y="105" textAnchor="middle" fill="rgba(113,113,122,0.5)" fontSize="7" fontFamily="monospace">API</text>

          {/* Main cable path - animated with CSS */}
          <path
            className="cable-path"
            d="M 100 95 C 180 95, 200 60, 300 60 S 420 95, 500 95"
            stroke="rgba(113,113,122,0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: '600',
              strokeDashoffset: '0',
              animation: 'cableDraw 2s ease-out forwards'
            }}
          />

          {/* Snap segments */}
          <path
            className="segment-a"
            d="M 100 95 C 180 95, 220 80, 300 70"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
          <path
            className="segment-b"
            d="M 300 70 C 380 60, 420 95, 500 95"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />

          {/* Cloud label */}
          <text className="cable-label-cloud" x="60" y="140" textAnchor="middle"
            fill="rgba(113,113,122,0.5)" fontSize="7" fontFamily="monospace">
            data leaves device ↑
          </text>

          {/* Local label */}
          <text
            className="cable-label-local"
            x="300" y="30"
            textAnchor="middle"
            fill="#10b981"
            fontSize="8"
            fontFamily="monospace"
            style={{ opacity: 1 }}
          >
            ✓ local · zero egress
          </text>

          {/* Editor preview node */}
          <rect x="500" y="70" width="80" height="50" rx="2"
            strokeWidth="1"
            stroke="#10b981"
            fill="rgba(9,9,11,0.8)"
          />
          <text x="540" y="90" textAnchor="middle" fill="rgba(113,113,122,0.7)" fontSize="7" fontFamily="monospace">EDITOR</text>
          <text x="540" y="105" textAnchor="middle" fill="rgba(16,185,129,0.6)" fontSize="7" fontFamily="monospace">WebGPU</text>
        </svg>

        {/* Editor preview box with emerald border */}
        <div
          ref={(el) => { editorPreviewRef.current = el; }}
          className="mt-8 mx-auto max-w-md rounded-[2px] border p-4 bg-zinc-900/40 backdrop-blur-sm"
          style={{ borderColor: '#10b981' }}
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-500 text-[10px] font-mono">engine ready</span>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-zinc-800/60 rounded-full w-3/4" />
            <div className="h-2 bg-zinc-800/60 rounded-full w-full" />
            <div className="h-2 bg-zinc-800/60 rounded-full w-1/2" />
          </div>
        </div>
      </div>

      {/* Hero title — reveals after scroll */}
      <div className="relative z-10">
        <HeroTitleReveal />
      </div>

      {/* CSS animation keyframes */}
      <style jsx>{`
        @keyframes cableDraw {
          from {
            stroke-dashoffset: 600;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </section>
  );
}