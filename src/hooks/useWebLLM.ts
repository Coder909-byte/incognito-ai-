'use client';
// src/hooks/useWebLLM.ts
// Main-thread bridge to the WebLLM web worker with an updated 90s initialization ceiling.

import { useEffect, useRef, useCallback, useState } from 'react';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { WebLLMStatus } from '@/types';
import { estimateTokensSaved } from '@/lib/analytics';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';

// Global singleton tracking to completely defeat React Strict Mode double-instantiation
let globalEnginePromise: Promise<any> | null = null;
let globalWorker: Worker | null = null;

export interface UseWebLLMReturn {
  status: WebLLMStatus;
  progress: number;
  progressText: string;
  streamedTokens: string;
  tokensSaved: number;
  generate: (prompt: string) => Promise<void>;
  cancel: () => void;
}

export function useWebLLM(): UseWebLLMReturn {
  const engineRef = useRef<any>(null);
  const abortRef = useRef(false);

  const [status, setStatus] = useState<WebLLMStatus>(() => {
    if (typeof window !== 'undefined' && !('gpu' in navigator)) {
      return 'no_webgpu';
    }
    return 'loading';
  });
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [streamedTokens, setStreamedTokens] = useState('');
  const [tokensSaved, setTokensSaved] = useState(0);

  const statusRef = useRef<WebLLMStatus>(status);
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const isNoWebGPU = status === 'no_webgpu';
    if (isNoWebGPU) return;

    let cancelled = false;

    // Fixed Watchdog Threshold: Set to 90 seconds to handle slow network/shader compilations safely
    const resetStallTimeout = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      
      stallTimeoutRef.current = setTimeout(() => {
        if (!cancelled && engineRef.current === null && statusRef.current !== 'ready') {
          console.warn('[WebLLM] Local engine taking its time to build cache...');
          setStatus('error'); 
        }
      }, 90000); // 90 seconds threshold as suggested by assistant
    };

    // Initialize the threshold watchdog
    resetStallTimeout();

    // If the engine isn't created yet, spawn the worker exactly ONCE globally
    if (!globalEnginePromise) {
      globalWorker = new Worker(
        new URL('../workers/web-llm.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      globalEnginePromise = CreateWebWorkerMLCEngine(
        globalWorker,
        MODEL_ID,
        {
          initProgressCallback: (report) => {
            const pct = Math.round((report.progress ?? 0) * 100);
            window.dispatchEvent(new CustomEvent('webllm-progress', { 
              detail: { pct, text: report.text ?? '', progress: report.progress } 
            }));
          },
        }
      );
    }

    // Handle global engine initialization update messages
    const handleProgressUpdate = (e: Event) => {
      if (cancelled) return;
      const { pct, text, progress: rawProgress } = (e as CustomEvent).detail;
      
      setProgress(pct);
      setProgressText(text);

      // Reset timer whenever progress events successfully bubble up to the main UI thread
      resetStallTimeout();

      if (rawProgress >= 1) {
        if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
        setStatus('ready');
        setProgress(100);
      }
    };

    window.addEventListener('webllm-progress', handleProgressUpdate);

    // Track promise resolution cleanly across render cycles
    globalEnginePromise
      .then((engine) => {
        if (cancelled) return;
        if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current); // Success: Stop watchdog instantly
        engineRef.current = engine;
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current); // Error: Stop watchdog instantly
        console.error('[WebLLM] Engine native initialization failure:', err);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      window.removeEventListener('webllm-progress', handleProgressUpdate);
    };
  }, []);

  const generate = useCallback(async (prompt: string) => {
    if (!engineRef.current || status !== 'ready') return;
    abortRef.current = false;
    setStreamedTokens('');
    setStatus('generating');

    let fullCompletion = '';
    try {
      const chunks = await engineRef.current.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7,
        max_tokens: 512,
      });

      for await (const chunk of chunks) {
        if (abortRef.current) break;
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) {
          fullCompletion += delta;
          setStreamedTokens((prev) => prev + delta);
        }
      }

      const saved = estimateTokensSaved(prompt, fullCompletion);
      setTokensSaved((prev) => prev + saved);
    } catch (err) {
      console.error('[WebLLM] Generate error:', err);
    } finally {
      setStatus('ready');
    }
  }, [status]);

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { status, progress, progressText, streamedTokens, tokensSaved, generate, cancel };
}