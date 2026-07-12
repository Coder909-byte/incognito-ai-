'use client';
// src/components/ui/GrainientBackground.tsx
// Full-bleed canvas noise + radial aurora. Isolated GPU layer, paused when off-screen.

import { useEffect, useRef, useCallback } from 'react';

interface GrainientBackgroundProps {
  className?: string;
}

export default function GrainientBackground({ className = '' }: GrainientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const pausedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || pausedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    phaseRef.current += 0.003;
    const t = phaseRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Base fill
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Radial aurora — emerald at top-center, violet at bottom-right
    const aurora1 = ctx.createRadialGradient(
      canvas.width * 0.4, canvas.height * 0.2, 0,
      canvas.width * 0.4, canvas.height * 0.2, canvas.width * 0.55
    );
    aurora1.addColorStop(0, `rgba(16,185,129,${0.04 + Math.sin(t) * 0.01})`);
    aurora1.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = aurora1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const aurora2 = ctx.createRadialGradient(
      canvas.width * 0.75, canvas.height * 0.7, 0,
      canvas.width * 0.75, canvas.height * 0.7, canvas.width * 0.45
    );
    aurora2.addColorStop(0, `rgba(124,58,237,${0.03 + Math.cos(t * 0.7) * 0.01})`);
    aurora2.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.fillStyle = aurora2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grain noise — manual pixel scatter (lightweight, no feTurbulence overhead on canvas)
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    const step = 3; // only sample every 3rd pixel for performance
    for (let i = 0; i < data.length; i += 4 * step) {
      const noise = (Math.random() - 0.5) * 18;
      data[i] = noise + 9;
      data[i + 1] = noise + 9;
      data[i + 2] = noise + 9;
      data[i + 3] = 20; // very low alpha — grain effect
    }
    ctx.putImageData(imageData, 0, 0);

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // IntersectionObserver — pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        pausedRef.current = !entry.isIntersecting;
        if (entry.isIntersecting && !rafRef.current) {
          rafRef.current = requestAnimationFrame(draw);
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      // Static fallback — just fill base + aurora once
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const g = ctx.createRadialGradient(
          canvas.width * 0.4, canvas.height * 0.2, 0,
          canvas.width * 0.4, canvas.height * 0.2, canvas.width * 0.6
        );
        g.addColorStop(0, 'rgba(16,185,129,0.05)');
        g.addColorStop(1, 'rgba(16,185,129,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ willChange: 'transform' }}
    />
  );
}
