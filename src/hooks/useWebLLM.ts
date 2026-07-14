'use client';
// src/hooks/useWebLLM.ts

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

    // Resettable watchdog timer (180s for slow disk I/O / shader compilation on old hardware)
    const resetStallTimeout = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      
      stallTimeoutRef.current = setTimeout(() => {
        if (!cancelled && engineRef.current === null && statusRef.current !== 'ready') {
          console.warn('[WebLLM] Local engine stalled: No progress for 180s');
          setStatus('error'); 
        }
      }, 180000); 
    };

    // Initialize watchdog timer immediately on mount
    resetStallTimeout();

    if (!globalEnginePromise) {
      globalWorker = new Worker(
        new URL('../workers/web-llm.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      // Fixed: using the correct property 'initProgressCallback' recognized by MLCEngineConfig
      globalEnginePromise = CreateWebWorkerMLCEngine(
        globalWorker,
        MODEL_ID,
        {
          initProgressCallback: (report) => {
            console.log(report.text);
            
            // Reset the timeout whenever the engine reports progress
            resetStallTimeout(); 
            setStatus('loading');

            const pct = Math.round((report.progress ?? 0) * 100);
            setProgress(pct);
            setProgressText(report.text ?? '');
          },
        }
      );
    }

    globalEnginePromise
      .then((engine) => {
        if (cancelled) return;
        
        if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
        engineRef.current = engine;
        setStatus('ready');
        setProgress(100);
      })
      .catch((err) => {
        if (cancelled) return;
        if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
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

  return { status, progress, progressText, streamedTokens, tokensSaved, generate, cancel };
}