'use client';
// src/hooks/useWebLLM.ts
// Main-thread bridge to the WebLLM web worker.
// Exposes status, streaming tokens, and a generate() function.
// The main thread NEVER calls the model directly.

import { useEffect, useRef, useCallback, useState } from 'react';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { WebLLMStatus } from '@/types';
import { estimateTokensSaved } from '@/lib/analytics';

const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

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
    // Lazy initializer: check WebGPU support synchronously on first render
    if (typeof window !== 'undefined' && !('gpu' in navigator)) {
      return 'no_webgpu';
    }
    return 'loading'; // Start loading immediately to avoid synchronous setState in effect
  });
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [streamedTokens, setStreamedTokens] = useState('');
  const [tokensSaved, setTokensSaved] = useState(0);

  useEffect(() => {
    // Skip if WebGPU is unavailable (already set by lazy initializer)
    // Use a ref to avoid dependency on status in the effect
    const isNoWebGPU = status === 'no_webgpu';
    if (isNoWebGPU) return;

    let cancelled = false;

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
            setStatus('ready');
            setProgress(100);
          }
        },
      }
    )
      .then((engine) => {
        if (cancelled) return;
        engineRef.current = engine;
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[WebLLM] Engine init error:', err);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [status]); // Include status in deps to satisfy exhaustive-deps rule

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

      // Log tokens saved estimate
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