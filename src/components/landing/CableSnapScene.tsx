'use client';
// src/components/landing/CableSnapScene.tsx
// GSAP ScrollTrigger pinned sequence: SVG cable draw-in → snap fracture → emerald reveal.
// Strictly uses useGSAP({ scope: containerRef }) — no unscoped gsap.to calls.

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import HeroTitleReveal from './HeroTitleReveal';

gsap.registerPlugin(ScrollTrigger, CustomEase);

// Register the snap fracture custom ease
CustomEase.create('snap.out', 'M0,0 C0.05,0 0.133,0.085 0.25,0.4 0.35,0.65 0.45,1.5 0.6,1.05 0.75,0.6 0.9,1.01 1,1');

export default function CableSnapScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorPreviewRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

      if (mq.matches) {
        // Reduced-motion: show all elements immediately, no scroll pin
        gsap.set('.cable-path', { strokeDashoffset: 0 });
        gsap.set('.segment-a, .segment-b', { opacity: 0 });
        if (editorPreviewRef.current) {
          editorPreviewRef.current.style.borderColor = '#10b981';
        }
        return;
      }

      // --- Cable path setup ---
      const cablePath = document.querySelector<SVGPathElement>('.cable-path');
      if (!cablePath) return;
      const pathLength = cablePath.getTotalLength();

      gsap.set(cablePath, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      });

      // Master timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=300%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // 0–40%: Cable draws in
      tl.to('.cable-path', {
        strokeDashoffset: 0,
        ease: 'none',
        duration: 0.4,
      });

      // 40–60%: Cable snaps — two segments fly apart
      tl.to('.cable-path', { opacity: 0, duration: 0.02 }, 0.4);
      tl.fromTo(
        '.segment-a',
        { x: 0, y: 0, rotation: 0, opacity: 1 },
        {
          x: -180,
          y: -80,
          rotation: -35,
          opacity: 0,
          ease: 'snap.out',
          duration: 0.2,
        },
        0.4
      );
      tl.fromTo(
        '.segment-b',
        { x: 0, y: 0, rotation: 0, opacity: 1 },
        {
          x: 200,
          y: 100,
          rotation: 28,
          opacity: 0,
          ease: 'snap.out',
          duration: 0.2,
        },
        0.4
      );

      // 50–70%: Editor preview border morphs to emerald
      tl.fromTo(
        editorPreviewRef.current,
        { borderColor: 'rgba(63,63,70,0.5)' },
        { borderColor: '#10b981', ease: 'power2.out', duration: 0.2 },
        0.5
      );

      // 70–100%: Labels fade in
      tl.to('.cable-label-local', { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' }, 0.7);
      tl.to('.cable-label-cloud', { opacity: 0, duration: 0.1 }, 0.42);
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
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

          {/* Main cable path */}
          <path
            className="cable-path"
            d="M 100 95 C 180 95, 200 60, 300 60 S 420 95, 500 95"
            stroke="rgba(113,113,122,0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Snap segments (hidden until snap) */}
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
            style={{ opacity: 0, transform: 'translateY(8px)' }}
          >
            ✓ local · zero egress
          </text>

          {/* Editor preview node */}
          <rect x="500" y="70" width="80" height="50" rx="2"
            style={{ transition: 'none' }}
            strokeWidth="1"
            stroke="rgba(63,63,70,0.5)"
            fill="rgba(9,9,11,0.8)"
          />
          <text x="540" y="90" textAnchor="middle" fill="rgba(113,113,122,0.7)" fontSize="7" fontFamily="monospace">EDITOR</text>
          <text x="540" y="105" textAnchor="middle" fill="rgba(16,185,129,0.6)" fontSize="7" fontFamily="monospace">WebGPU</text>
        </svg>

        {/* Editor preview box for border morph */}
        <div
          ref={editorPreviewRef}
          className="mt-8 mx-auto max-w-md rounded-[2px] border p-4 bg-zinc-900/40 backdrop-blur-sm"
          style={{ borderColor: 'rgba(63,63,70,0.5)' }}
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <span className="text-zinc-700 text-[10px] font-mono">engine offline</span>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-zinc-800/60 rounded-full w-3/4" />
            <div className="h-2 bg-zinc-800/60 rounded-full w-full" />
            <div className="h-2 bg-zinc-800/60 rounded-full w-1/2" />
          </div>
        </div>
      </div>

      {/* Hero title — reveals after scroll pin releases */}
      <div className="relative z-10">
        <HeroTitleReveal />
      </div>
    </section>
  );
}
