'use client';
// src/hooks/useWebLLM.ts
// Main-thread bridge to the WebLLM web worker with an Intel-Mac deadlock timeout safeguard.

import { useEffect, useRef, useCallback, useState } from 'react';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { WebLLMStatus } from '@/types';
import { estimateTokensSaved } from '@/lib/analytics';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';

// Global singleton tracking to defeat React Strict Mode double-instantiation
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
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const isNoWebGPU = status === 'no_webgpu';
    if (isNoWebGPU) return;

    let cancelled = false;

    // Safety timeout: Triggers if compilation completely freezes up
    const safetyTimeout = setTimeout(() => {
      if (!cancelled && engineRef.current === null && statusRef.current !== 'ready') {
        console.warn('[WebLLM] Local engine taking its time to build cache...');
        setStatus('error'); 
      }
    }, 180000);

    // If the engine isn't created yet, create it exactly ONCE globally
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
            // Send updates out to the active window UI
            const pct = Math.round((report.progress ?? 0) * 100);
            window.dispatchEvent(new CustomEvent('webllm-progress', { 
              detail: { pct, text: report.text ?? '', progress: report.progress } 
            }));
          },
        }
      );
    }

    // Listen to the unique global build stream events
    const handleProgressUpdate = (e: Event) => {
      if (cancelled) return;
      const { pct, text, progress: rawProgress } = (e as CustomEvent).detail;
      setProgress(pct);
      setProgressText(text);
      if (rawProgress >= 1) {
        clearTimeout(safetyTimeout);
        setStatus('ready');
        setProgress(100);
      }
    };

    window.addEventListener('webllm-progress', handleProgressUpdate);

    // Attach to the resolved engine instance
    globalEnginePromise
      .then((engine) => {
        if (cancelled) return;
        clearTimeout(safetyTimeout);
        engineRef.current = engine;
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(safetyTimeout);
        console.error('[WebLLM] Engine init error:', err);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
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