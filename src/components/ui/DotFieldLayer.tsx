'use client';
// src/components/ui/DotFieldLayer.tsx
// Cursor-reactive dot-grid with magnet-attract behavior.
// Rendered on an absolutely-positioned canvas behind text, opacity ≤ 12%.

import { useEffect, useRef, useCallback } from 'react';

interface DotFieldLayerProps {
  className?: string;
}

const DOT_SPACING = 28;
const MAGNET_RADIUS = 80;
const MAX_ATTRACT = 6; // px

export default function DotFieldLayer({ className = '' }: DotFieldLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(canvas.width / DOT_SPACING);
    const rows = Math.ceil(canvas.height / DOT_SPACING);
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        const baseX = c * DOT_SPACING;
        const baseY = r * DOT_SPACING;

        const dx = mx - baseX;
        const dy = my - baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let dotX = baseX;
        let dotY = baseY;
        let alpha = 0.25;

        if (dist < MAGNET_RADIUS) {
          const strength = (1 - dist / MAGNET_RADIUS);
          dotX += (dx / dist) * strength * MAX_ATTRACT;
          dotY += (dy / dist) * strength * MAX_ATTRACT;
          alpha = 0.25 + strength * 0.5;
        }

        ctx.beginPath();
        ctx.arc(dotX, dotY, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${alpha})`;
        ctx.fill();
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    const parent = canvas.parentElement;
    parent?.addEventListener('mousemove', handleMouse);
    parent?.addEventListener('mouseleave', handleLeave);
    window.addEventListener('resize', resize);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches) {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      parent?.removeEventListener('mousemove', handleMouse);
      parent?.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.12 }}
    />
  );
}
