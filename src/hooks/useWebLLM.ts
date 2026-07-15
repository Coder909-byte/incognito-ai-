'use client';

// src/hooks/useWebLLM.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import type { WebLLMStatus } from '@/types';
import { estimateTokensSaved } from '@/lib/analytics';

let globalWorker: Worker | null = null;
let globalWorkerInitialized = false;

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
  const [status, setStatus] = useState<WebLLMStatus>('loading');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('Initializing local ONNX runtime...');
  const [streamedTokens, setStreamedTokens] = useState('');
  const [tokensSaved, setTokensSaved] = useState(0);

  const statusRef = useRef<WebLLMStatus>(status);
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPromptRef = useRef<string>('');
  const onDoneRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const resetStallTimeout = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      
      stallTimeoutRef.current = setTimeout(() => {
        if (!cancelled && !globalWorkerInitialized && statusRef.current !== 'ready') {
          console.warn('[ONNX Engine] Local engine stalled: No progress received.');
          setStatus('error'); 
          setProgressText('Engine initialization timed out.');
        }
      }, 300000); // 5-minute timeout window
    };

    resetStallTimeout();

    // 1. Instantiate Worker with { type: 'module' }
    if (!globalWorker) {
      try {
        globalWorker = new Worker(
          new URL('../workers/web-llm.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (err) {
        console.error('[ONNX Hook] Failed to instantiate worker:', err);
        setStatus('error');
        setProgressText('Failed to spin up background worker thread.');
        return;
      }
    }

    // 2. BIND ERROR HANDLERS PERMANENTLY (No more silent deaths!)
    globalWorker.onerror = (errorEvent) => {
      console.error('[ONNX Worker Runtime Error]:', errorEvent.message, 'in', errorEvent.filename, 'line', errorEvent.lineno);
      setStatus('error');
      setProgressText(`Worker Error: ${errorEvent.message}`);
    };

    globalWorker.onmessageerror = (errorEvent) => {
      console.error('[ONNX Worker Message Deserialization Error]:', errorEvent);
      setStatus('error');
    };

    const handleMessage = (e: MessageEvent) => {
      if (cancelled) return;
      const { type, status: workerStatus, progress: loadProgress, text, error } = e.data;

      // Unconditional heartbeat check
      resetStallTimeout();

      switch (type) {
        case 'booted':
          console.log('[ONNX Hook] Success! Handshake established. Worker is alive.');
          break;

        case 'status':
          if (workerStatus === 'ready') {
            if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
            setStatus('ready');
            setProgress(100);
            setProgressText('Local ONNX Engine Active');
            globalWorkerInitialized = true;
          } else {
            setStatus(workerStatus);
          }
          break;

        case 'progress':
          setStatus('loading');
          setProgress(Math.round(loadProgress));
          setProgressText(text || 'Loading local weights...');
          break;

        case 'generating_start':
          setStatus('generating');
          break;

        case 'done':
          setStreamedTokens(text);
          setStatus('ready');
          if (onDoneRef.current) {
            onDoneRef.current(text);
          }
          break;

        case 'error':
          if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
          setStatus('error');
          setProgressText(`Engine Failure: ${error}`);
          console.error('[ONNX Worker Processing Error]:', error);
          break;
      }
    };

    globalWorker.addEventListener('message', handleMessage);

    if (!globalWorkerInitialized) {
      globalWorker.postMessage({ type: 'load' });
    } else {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      setStatus('ready');
      setProgress(100);
      setProgressText('Local ONNX Engine Active');
    }

    return () => {
      cancelled = true;
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      globalWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const generate = useCallback(async (prompt: string) => {
    if (!globalWorker || status === 'loading') return;
    
    setStreamedTokens('');
    setStatus('generating');
    currentPromptRef.current = prompt;

    globalWorker.postMessage({ type: 'generate', prompt });

    await new Promise<void>((resolve) => {
      onDoneRef.current = (finalText: string) => {
        const saved = estimateTokensSaved(currentPromptRef.current, finalText);
        setStreamedTokens(finalText);
        setTokensSaved((prev) => prev + saved);
        resolve();
      };
    });
  }, [status]);

  const cancel = useCallback(() => {
    if (globalWorker) {
      globalWorker.terminate();
      globalWorker = new Worker(
        new URL('../workers/web-llm.worker.ts', import.meta.url),
        { type: 'module' }
      );
      globalWorkerInitialized = false;
      globalWorker.postMessage({ type: 'load' });
      setStatus('ready');
    }
  }, []);

  return { status, progress, progressText, streamedTokens, tokensSaved, generate, cancel };
}