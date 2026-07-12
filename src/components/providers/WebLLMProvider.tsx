'use client';
// src/components/providers/WebLLMProvider.tsx
// React context wrapping useWebLLM — provides engine state to all descendants.
// Manages the model-loading splash screen and WebGPU fallback banner.

import { createContext, useContext, ReactNode } from 'react';
import { useWebLLM, UseWebLLMReturn } from '@/hooks/useWebLLM';
import ModelLoadingSplash from '@/components/ui/ModelLoadingSplash';

const WebLLMContext = createContext<UseWebLLMReturn | null>(null);

export function WebLLMProvider({ children }: { children: ReactNode }) {
  const webllm = useWebLLM();

  return (
    <WebLLMContext.Provider value={webllm}>
      {/* Fullscreen splash while model is loading */}
      {(webllm.status === 'loading' || webllm.status === 'idle') && (
        <ModelLoadingSplash
          progress={webllm.progress}
          progressText={webllm.progressText}
        />
      )}

      {/* Non-blocking WebGPU unavailable banner */}
      {webllm.status === 'no_webgpu' && (
        <div
          role="alert"
          className="fixed top-0 inset-x-0 z-[200] flex items-center gap-3 px-6 py-3 bg-amber-950/90 border-b border-amber-800/60 backdrop-blur-sm text-amber-300 text-sm font-mono"
        >
          <span className="text-amber-400">⚠</span>
          <span>
            WebGPU is unavailable in this browser. Local inference is disabled.
            Use Chrome 113+ for full privacy-first AI capabilities.
          </span>
        </div>
      )}

      {children}
    </WebLLMContext.Provider>
  );
}

export function useWebLLMContext(): UseWebLLMReturn {
  const ctx = useContext(WebLLMContext);
  if (!ctx) throw new Error('useWebLLMContext must be used inside <WebLLMProvider>');
  return ctx;
}
