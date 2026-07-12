'use client';
// src/hooks/useGrainientNoise.ts
// Controls baseFrequency oscillation parameters for GrainientBackground.

import { useState, useCallback } from 'react';

export interface GrainientNoiseParams {
  intensity: number;   // 0–1, default 0.5
  speed: number;       // 0–2, default 1.0
}

export function useGrainientNoise(initial?: Partial<GrainientNoiseParams>) {
  const [params, setParams] = useState<GrainientNoiseParams>({
    intensity: initial?.intensity ?? 0.5,
    speed: initial?.speed ?? 1.0,
  });

  const setIntensity = useCallback((v: number) => {
    setParams((p) => ({ ...p, intensity: Math.max(0, Math.min(1, v)) }));
  }, []);

  const setSpeed = useCallback((v: number) => {
    setParams((p) => ({ ...p, speed: Math.max(0, Math.min(2, v)) }));
  }, []);

  return { ...params, setIntensity, setSpeed };
}
