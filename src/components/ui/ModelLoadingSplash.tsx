'use client';
// src/components/ui/ModelLoadingSplash.tsx
// Fullscreen model-loading splash screen shown while Qwen-2.5 0.5B downloads and compiles.
// PRD option 3: dedicated fullscreen experience with progress visualization.

import { useEffect, useRef } from 'react';

interface ModelLoadingSplashProps {
  progress: number;       // 0–100
  progressText: string;
}

export default function ModelLoadingSplash({ progress, progressText }: ModelLoadingSplashProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // Particle field background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radial aurora gradient
      const grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.6
      );
      grd.addColorStop(0, 'rgba(16,185,129,0.06)');
      grd.addColorStop(0.5, 'rgba(124,58,237,0.04)');
      grd.addColorStop(1, 'rgba(9,9,11,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${p.opacity})`;
        ctx.fill();
      });

      // Connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(16,185,129,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches) {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Smooth progress bar width
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.max(2, progress)}%`;
    }
  }, [progress]);

  const displayText = progressText
    ? progressText.length > 60
      ? progressText.slice(0, 60) + '…'
      : progressText
    : 'Initialising Local Engine…';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Loading local AI model"
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-zinc-950"
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.8 }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-8 max-w-lg w-full">

        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-1 rounded-full border border-emerald-500/50" />
            <div className="absolute inset-3 rounded-full bg-emerald-500/20 backdrop-blur-sm" />
          </div>
          <div className="text-center">
            <p className="text-zinc-100 font-mono text-xs tracking-[0.3em] uppercase">
              IncognitoAI
            </p>
            <p className="text-zinc-600 font-mono text-[10px] tracking-widest mt-1">
              Privacy-first · Local inference
            </p>
          </div>
        </div>

        {/* Model info */}
        <div className="text-center space-y-1">
          <p className="text-zinc-300 text-sm font-mono">
            Loading <span className="text-emerald-400">Qwen-2.5 0.5B (Local ONNX)</span>
          </p>
          <p className="text-zinc-600 text-xs font-mono">
            This model runs entirely in your browser.
            <br />No data leaves your device.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="relative h-[2px] w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              ref={barRef}
              className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-300 ease-out"
              style={{
                width: `${Math.max(2, progress)}%`,
                background: 'linear-gradient(90deg, #10b981, #7c3aed)',
                boxShadow: '0 0 12px rgba(16,185,129,0.6)',
              }}
            />
          </div>

          {/* Progress labels */}
          <div className="flex justify-between items-center">
            <p className="text-zinc-500 text-[11px] font-mono truncate flex-1 pr-4">
              {displayText}
            </p>
            <span className="text-zinc-400 text-[11px] font-mono tabular-nums shrink-0">
              {progress}%
            </span>
          </div>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 px-4 py-2 border border-zinc-800/60 rounded-xs bg-zinc-900/40 backdrop-blur-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1L2 3v4c0 2.8 2.1 5.4 5 6 2.9-.6 5-3.2 5-6V3L7 1z"
              stroke="#10b981" strokeWidth="1" fill="rgba(16,185,129,0.1)" />
            <path d="M5 7l1.5 1.5L9 5.5" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-zinc-500 text-[10px] font-mono tracking-wider">
            Zero data egress · All inference local
          </span>
        </div>
      </div>
    </div>
  );
}
