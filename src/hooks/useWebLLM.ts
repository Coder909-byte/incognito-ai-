'use client';
// src/hooks/useWebLLM.ts
// Main-thread bridge to the WebLLM web worker with a responsive, progress-linked watchdog timer.

import { useEffect, useRef, useCallback, useState } from 'react';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { WebLLMStatus } from '@/types';
import { estimateTokensSaved } from '@/lib/analytics';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';

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

    // AI ADVICE IMPLEMENTATION: Watchdog function linked to progress updates
    const resetStallTimeout = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      
      stallTimeoutRef.current = setTimeout(() => {
        if (!cancelled && engineRef.current === null && statusRef.current !== 'ready') {
          console.warn('[WebLLM] Local engine stalled: No progress for 90s');
          setStatus('error'); 
        }
      }, 90000); // 90 seconds threshold as explicitly suggested
    };

    // Start the watchdog monitoring immediately on mount
    resetStallTimeout();

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
            // AI FIX APPLIED: "Pet the watchdog" instantly inside the real native callback logic
            resetStallTimeout();

            const pct = Math.round((report.progress ?? 0) * 100);
            setProgress(pct);
            setProgressText(report.text ?? '');

            if (report.progress >= 1) {
              if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
              setStatus('ready');
            }
          },
        }
      );
    }

    globalEnginePromise
      .then((engine) => {
        if (cancelled) return;
        if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current); // Stop watchdog on success
        engineRef.current = engine;
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current); // Stop watchdog on standard error
        console.error('[WebLLM] Engine native initialization failure:', err);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
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

  return { status, progress, progressText, streamedTokens, tokensSaved, generate , cancel };
}