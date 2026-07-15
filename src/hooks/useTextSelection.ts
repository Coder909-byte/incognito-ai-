'use client';
// src/hooks/useTextSelection.ts
// Tracks selection inside a <textarea> element (native window.getSelection()
// cannot see textarea selections - they use a separate selectionStart/End API).

import { useEffect, useCallback, useState } from 'react';
import type { SelectionState } from '@/types';

export function useTextSelection(
  containerRef
) {
  const [state, setState] = useState({ rect: null, text: '' });

  const handleSelection = useCallback(() => {
    const textarea = containerRef && containerRef.current ? containerRef.current.querySelector('textarea') : null;
    if (!textarea) {
      setState({ rect: null, text: '' });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      setState({ rect: null, text: '' });
      return;
    }

    const text = textarea.value.slice(start, end).trim();
    if (!text) {
      setState({ rect: null, text: '' });
      return;
    }

    const rect = textarea.getBoundingClientRect();
    const approxRect = new DOMRect(
      rect.left + rect.width / 2 - 60,
      rect.top,
      120,
      20
    );

    setState({ rect: approxRect, text });
  }, [containerRef]);

  useEffect(() => {
    const textarea = containerRef && containerRef.current ? containerRef.current.querySelector('textarea') : null;
    if (!textarea) return;

    textarea.addEventListener('select', handleSelection);
    textarea.addEventListener('mouseup', handleSelection);
    textarea.addEventListener('keyup', handleSelection);

    return () => {
      textarea.removeEventListener('select', handleSelection);
      textarea.removeEventListener('mouseup', handleSelection);
      textarea.removeEventListener('keyup', handleSelection);
    };
  }, [containerRef, handleSelection]);

  return state;
}
