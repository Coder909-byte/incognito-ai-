'use client';
// src/hooks/useWebLLM.ts
// Main-thread bridge to the WebLLM web worker with an Intel-Mac deadlock timeout safeguard.

import { useEffect, useRef, useCallback, useState } from 'react';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { WebLLMStatus } from '@/types';
import { estimateTokensSaved } from '@/lib/analytics';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';

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
  const engineRef = useRef<Awaited<ReturnType<typeof CreateWebWorkerMLCEngine>> | null>(null);
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

  useEffect(() => {
    const isNoWebGPU = status === 'no_webgpu';
    if (isNoWebGPU) return;

    let cancelled = false;

    // Safety timeout: If your hardware hangs trying to compile the model, 
    // force-unfreeze the UI after 5 seconds by treating it as an error/fallback state.
    const safetyTimeout = setTimeout(() => {
      if (!cancelled && engineRef.current === null && status !== 'ready') {
        console.warn('[WebLLM] Local engine taking its time to build cache...');
        setStatus('error'); 
      }
    }, 60000);
    CreateWebWorkerMLCEngine(
      new Worker(new URL('../workers/web-llm.worker.ts', import.meta.url), { type: 'module' }),
      MODEL_ID,
      {
        initProgressCallback: (report) => {
          if (cancelled) return;
          const pct = Math.round((report.progress ?? 0) * 100);
          setProgress(pct);
          setProgressText(report.text ?? '');
          if (report.progress >= 1) {
            clearTimeout(safetyTimeout);
            setStatus('ready');
            setProgress(100);
          }
        },
      }
    )
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