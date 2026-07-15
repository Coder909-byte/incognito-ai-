'use client';
// src/components/ui/EditorCanvas.tsx
// Glassmorphic markdown editor surface.
// Border morphs to emerald ONLY after ONNX engine reports status: "ready".
// Uses CSS transitions instead of GSAP.

import { useRef, useEffect, useCallback } from 'react';
import { useWebLLMContext } from '@/components/providers/WebLLMProvider';
import { useTextSelection } from '@/hooks/useTextSelection';
import ContextActionToolbar from './ContextActionToolbar';
import type { ActionType } from '@/types';

interface EditorCanvasProps {
  value: string;
  onChange: (v: string) => void;
  onAction?: (action: ActionType, text: string) => void;
  placeholder?: string;
  documentId?: string;
}

export default function EditorCanvas({
  value,
  onChange,
  onAction,
  placeholder = 'Start writing…',
  documentId,
}: EditorCanvasProps) {
  const { status } = useWebLLMContext();
  const borderRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const selection = useTextSelection(editorContainerRef as React.RefObject<HTMLElement | null>);

  // Border morph: zinc-800 → #10b981 via CSS transition, fires only on status: "ready"
  useEffect(() => {
    if (!borderRef.current) return;
    const el = borderRef.current;

    if (status === 'ready') {
      el.style.borderColor = '#10b981';
      el.style.transition = 'border-color 1.2s ease-out';
    } else {
      el.style.borderColor = 'rgba(63,63,70,0.5)';
      el.style.transition = 'border-color 0.4s ease-in';
    }
  }, [status]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, []);

  useEffect(() => { autoResize(); }, [value, autoResize]);

  const handleAction = (action: ActionType, text: string) => {
    onAction?.(action, text);
  };

  const isReady = status === 'ready';

  return (
    <div ref={editorContainerRef} className="relative">
      {/* Glassmorphic shell */}
      <div
        ref={borderRef}
        className="relative rounded-[2px] backdrop-blur-xl bg-zinc-900/30 border border-zinc-800/50 overflow-hidden"
        style={{ transition: 'border-color 0.4s ease-in' }}
      >
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/40">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              isReady ? 'bg-emerald-500' : 'bg-zinc-600'
            }`}
            aria-hidden="true"
          />
          <span className="text-zinc-600 text-[10px] font-mono tracking-wider">
            {isReady
              ? 'engine ready · local'
              : status === 'loading'
              ? 'loading model…'
              : status === 'generating'
              ? 'generating…'
              : 'engine offline'}
          </span>
          {documentId && (
            <span className="ml-auto text-zinc-700 text-[10px] font-mono">
              {documentId.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Editor surface */}
        <textarea
          ref={textareaRef}
          id="editor-textarea"
          value={value}
          onChange={(e) => { onChange(e.target.value); autoResize(); }}
          placeholder={placeholder}
          spellCheck
          className="
            w-full min-h-[400px] p-6 resize-none
            bg-transparent text-zinc-100 text-[15px] leading-7
            font-mono placeholder:text-zinc-700
            focus:outline-none focus:ring-0 border-0
            selection:bg-emerald-500/20 selection:text-emerald-100
          "
          style={{ caretColor: '#10b981' }}
          aria-label="Document editor"
          aria-multiline="true"
        />
      </div>

      {/* Context action toolbar — floats above selection */}
      <ContextActionToolbar selection={selection} onAction={handleAction} />
    </div>
  );
}