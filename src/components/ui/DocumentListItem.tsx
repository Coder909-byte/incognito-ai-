'use client';
// src/components/ui/DocumentListItem.tsx
// Document card with class .doc-item for Anime.js stagger targeting.
// motion/react layoutId for shared-layout morph to editor canvas.

import { motion } from 'motion/react';
import Link from 'next/link';
import type { Document } from '@/types';

interface DocumentListItemProps {
  document: Document;
  index: number;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export default function DocumentListItem({ document, index }: DocumentListItemProps) {
  const preview = document.content
    ? document.content.replace(/[#*`>\[\]]/g, '').slice(0, 120).trim()
    : '';

  return (
    <motion.div
      layoutId={`doc-card-${document.id}`}
      className="doc-item"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        href={`/editor/${document.id}`}
        id={`doc-item-${document.id}`}
        className="
          group block relative p-5 rounded-[2px]
          bg-zinc-900/40 border border-zinc-800/50
          hover:border-zinc-700/70 hover:bg-zinc-900/60
          backdrop-blur-sm transition-all duration-200
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50
        "
      >
        {/* Hover accent line */}
        <div className="
          absolute left-0 top-3 bottom-3 w-px bg-emerald-500
          scale-y-0 group-hover:scale-y-100
          transition-transform duration-200 origin-center
        " aria-hidden="true" />

        {/* Title */}
        <h3 className="
          text-zinc-200 text-sm font-mono mb-2
          group-hover:text-zinc-100 transition-colors duration-150
          truncate
        ">
          {document.title || 'Untitled'}
        </h3>

        {/* Preview */}
        {preview && (
          <p className="text-zinc-600 text-xs font-mono leading-relaxed line-clamp-2 mb-3">
            {preview}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-zinc-700 text-[10px] font-mono">
          <span>{formatRelativeDate(document.updatedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{wordCount(document.content)} words</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-emerald-700" aria-hidden="true" />
            <span className="text-zinc-700">local</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
