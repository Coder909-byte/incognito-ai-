'use client';
// src/components/ui/ContextActionToolbar.tsx
// Floats above text selection with CSS transition entrance.
// Triggers rewrite/summarize/expand actions via ONNX context.

import { useRef, useEffect, useState } from 'react';
import { useWebLLMContext } from '@/components/providers/WebLLMProvider';
import type { SelectionState, ActionType } from '@/types';

interface ContextActionToolbarProps {
  selection: SelectionState;
  onAction: (action: ActionType, text: string) => void;
}

// Custom SVG icons — no icon library
const RewriteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7c0-2.8 2.2-5 5-5 1.4 0 2.7.6 3.6 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M12 7c0 2.8-2.2 5-5 5-1.4 0-2.7-.6-3.6-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M9.5 1.5l1.1 2-2 .5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 12.5l-1.1-2 2-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SummarizeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 3.5h10M2 7h7M2 10.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ACTIONS: { type: ActionType; label: string; Icon: React.FC }[] = [
  { type: 'rewrite',   label: 'Rewrite',   Icon: RewriteIcon },
  { type: 'summarize', label: 'Summarize', Icon: SummarizeIcon },
  { type: 'expand',    label: 'Expand',    Icon: ExpandIcon },
];

const PROMPT_MAP: Record<ActionType, (text: string) => string> = {
  rewrite:   (t) => `Rewrite the following text to be clearer and more concise:\n\n"${t}"\n\nRewritten version:`,
  summarize: (t) => `Summarize the following text in 1-2 sentences:\n\n"${t}"\n\nSummary:`,
  expand:    (t) => `Expand the following text with more detail and context:\n\n"${t}"\n\nExpanded version:`,
  generate:  (t) => t,
};

export default function ContextActionToolbar({ selection, onAction }: ContextActionToolbarProps) {
  const { status, generate } = useWebLLMContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const isReady = !!selection.rect && !!selection.text && status === 'ready';

  // Show/hide toolbar with CSS transition
  useEffect(() => {
    if (isReady) {
      // Small delay to allow CSS transition
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isReady]);

  const handleAction = async (action: ActionType) => {
    if (!selection.text) return;
    const prompt = PROMPT_MAP[action](selection.text);
    onAction(action, selection.text);
    await generate(prompt);
  };

  // Position above selection rect
  const style = selection.rect
    ? {
        position: 'fixed' as const,
        left: selection.rect.left + selection.rect.width / 2,
        top: selection.rect.top - 12,
        transform: 'translateX(-50%) translateY(-100%)',
      }
    : { display: 'none' };

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="AI actions for selected text"
      style={{
        ...style,
        zIndex: 100,
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? `${style.transform || ''} translateY(0px) scale(1)`
          : `${style.transform || ''} translateY(8px) scale(0.95)`,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      className="flex items-center gap-[2px] px-1 py-1 rounded-[3px] bg-zinc-900/95 border border-zinc-700/60 backdrop-blur-xl shadow-xl shadow-black/40"
    >
      {ACTIONS.map(({ type, label, Icon }) => (
        <button
          key={type}
          id={`toolbar-${type}`}
          onClick={() => handleAction(type)}
          title={label}
          aria-label={label}
          disabled={status !== 'ready'}
          className="
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px]
            text-zinc-400 text-[11px] font-mono tracking-wide
            hover:text-emerald-400 hover:bg-zinc-800/80
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50
          "
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-4 bg-zinc-700/60 mx-0.5" aria-hidden="true" />

      {/* Local badge */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        <span className="text-zinc-600 text-[10px] font-mono">local</span>
      </div>
    </div>
  );
}