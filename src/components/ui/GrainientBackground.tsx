'use client';
// src/components/ui/GrainientBackground.tsx
// Full-bleed canvas noise + radial aurora. Isolated GPU layer, paused when off-screen.

import { useEffect, useRef, useCallback } from 'react';

interface GrainientBackgroundProps {
  className?: string;
}

const TARGET_FPS = 20;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const NOISE_SCALE = 4; // render grain at 1/4 resolution, upscale via CSS

export default function GrainientBackground({ className = '' }: GrainientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const pausedRef = useRef(false);
  const lastFrameTimeRef = useRef(0);

  const draw = useCallback((timestamp: number) => {
    if (pausedRef.current) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // Throttle to TARGET_FPS
    if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }
    lastFrameTimeRef.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    phaseRef.current += 0.02;
    const t = phaseRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Base fill
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Radial aurora
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

    // Grain — draw at low resolution on offscreen canvas, then blit scaled up
    const noiseCanvas = noiseCanvasRef.current;
    if (noiseCanvas) {
      const nCtx = noiseCanvas.getContext('2d');
      if (nCtx) {
        const imageData = nCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 18;
          data[i] = noise + 9;
          data[i + 1] = noise + 9;
          data[i + 2] = noise + 9;
          data[i + 3] = 20;
        }
        nCtx.putImageData(imageData, 0, 0);

        // Blit the small noise canvas scaled up over the full-size canvas.
        // Browsers handle this upscale essentially for free (GPU compositing).
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(noiseCanvas, 0, 0, canvas.width, canvas.height);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Offscreen low-res canvas for grain generation
    if (!noiseCanvasRef.current) {
      noiseCanvasRef.current = document.createElement('canvas');
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (noiseCanvasRef.current) {
        noiseCanvasRef.current.width = Math.ceil(window.innerWidth / NOISE_SCALE);
        noiseCanvasRef.current.height = Math.ceil(window.innerHeight / NOISE_SCALE);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        pausedRef.current = !entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
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