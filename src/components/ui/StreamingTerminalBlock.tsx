'use client';
// src/components/ui/StreamingTerminalBlock.tsx
// Monospace token-stream output pane. Batches DOM writes per rAF.
// Houses DotFieldLayer as interactive background.

import { useEffect, useRef, useCallback } from 'react';
import DotFieldLayer from './DotFieldLayer';
import { useWebLLMContext } from '@/components/providers/WebLLMProvider';

export default function StreamingTerminalBlock() {
  const { streamedTokens, status, tokensSaved } = useWebLLMContext();
  const outputRef = useRef<HTMLPreElement>(null);
  const pendingRef = useRef('');
  const rafRef = useRef<number>(0);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const isGenerating = status === 'generating';

  // Batch DOM writes per animation frame — never per individual token
  const flush = useCallback(() => {
    if (!outputRef.current || !pendingRef.current) return;
    outputRef.current.textContent = pendingRef.current;
    // Scroll to bottom
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    pendingRef.current = streamedTokens;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(flush);
    return () => cancelAnimationFrame(rafRef.current);
  }, [streamedTokens, flush]);

  // Cursor blink — simple CSS animation (Anime.js handles completion flash below)
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    if (!isGenerating && streamedTokens) {
      // Completion flash via CSS class
      cursor.classList.add('flash-complete');
      const t = setTimeout(() => cursor.classList.remove('flash-complete'), 600);
      return () => clearTimeout(t);
    }
  }, [isGenerating, streamedTokens]);

  const isEmpty = !streamedTokens;

  return (
    <div className="relative flex flex-col rounded-[2px] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl overflow-hidden">
      {/* Dot field — interactive background */}
      <DotFieldLayer />

      {/* Terminal header */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/50">
        <div className="flex gap-1.5" aria-hidden="true">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>
        <span className="text-zinc-600 text-[11px] font-mono ml-2 tracking-wider">
          incognito-ai · local inference
        </span>
        <div className="ml-auto flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 text-[10px] font-mono">generating</span>
            </div>
          )}
          {tokensSaved > 0 && !isGenerating && (
            <span className="text-zinc-600 text-[10px] font-mono">
              ~{tokensSaved} tokens saved
            </span>
          )}
        </div>
      </div>

      {/* Output area */}
      <div className="relative z-10 flex-1 min-h-[160px] max-h-[420px] overflow-y-auto p-4">
        {isEmpty && !isGenerating ? (
          <p className="text-zinc-700 text-xs font-mono">
            Select text in the editor and choose an action above to run local inference…
          </p>
        ) : (
          <pre
            ref={outputRef}
            className="text-zinc-200 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words m-0"
            aria-live="polite"
            aria-label="AI output"
          />
        )}
        {isGenerating && (
          <span
            ref={cursorRef}
            aria-hidden="true"
            className="inline-block w-[7px] h-[14px] bg-emerald-400 align-middle ml-0.5 terminal-cursor"
          />
        )}
      </div>

      <style jsx>{`
        .terminal-cursor {
          animation: blink 1s step-end infinite;
        }
        .flash-complete {
          animation: flash 0.6s ease-out forwards;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes flash {
          0% { background-color: #10b981; box-shadow: 0 0 8px #10b981; }
          100% { background-color: transparent; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
