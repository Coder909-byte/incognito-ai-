'use client';
// src/hooks/useTextSelection.ts
// Fires on non-empty window.getSelection() — drives ContextActionToolbar mount.

import { useEffect, useCallback, useState } from 'react';
import type { SelectionState } from '@/types';

export function useTextSelection(containerRef?: React.RefObject<HTMLElement | null>): SelectionState {
  const [state, setState] = useState<SelectionState>({ rect: null, text: '' });

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setState({ rect: null, text: '' });
      return;
    }
    const text = selection.toString().trim();
    if (!text) {
      setState({ rect: null, text: '' });
      return;
    }

    // If containerRef is provided, only track selections within that element
    if (containerRef?.current) {
      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        setState({ rect: null, text: '' });
        return;
      }
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setState({ rect, text });
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [handleSelection]);

  return state;
}
