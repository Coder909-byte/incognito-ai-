'use client';
// src/app/(workspace)/editor/[documentId]/page.tsx
// Editor route with EditorCanvas + StreamingTerminalBlock side-by-side.

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import EditorCanvas from '@/components/ui/EditorCanvas';
import StreamingTerminalBlock from '@/components/ui/StreamingTerminalBlock';
import type { Document } from '@/types';

// Mock documents for dev mode
const MOCK_DOCS: Document[] = [
  {
    id: 'doc-1',
    title: 'Project Roadmap',
    content: '# Project Roadmap\n\n## Q1 Goals\n- Launch beta\n- User testing\n\n## Q2 Goals\n- Public release\n- Marketing',
    userId: 'dev-user',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'doc-2',
    title: 'API Documentation',
    content: '# API Documentation\n\n## Endpoints\n\n### GET /api/documents\nReturns all documents.\n\n### POST /api/documents\nCreates a new document.',
    userId: 'dev-user',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'doc-3',
    title: 'Meeting Notes',
    content: '# Meeting Notes - Oct 7\n\n## Attendees\n- Alice\n- Bob\n\n## Action Items\n1. Review PRD\n2. Implement landing page',
    userId: 'dev-user',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  const containerRef = useRef<HTMLDivElement>(null);

  // State for document content (allows editing)
  const [doc, setDoc] = useState<Document | null>(() => MOCK_DOCS.find((d) => d.id === documentId) || null);

  // Redirect if not found
  useEffect(() => {
    if (!doc) {
      router.push('/dashboard');
    }
  }, [doc, router]);

  // Entrance animation
  useGSAP(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      gsap.set('.editor-panel', { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo('.editor-panel',
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      }
    );
  }, { scope: containerRef });

  const handleContentChange = (content: string) => {
    if (!doc) return;
    setDoc({ ...doc, content });
  };

  if (!doc) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-600 text-xs font-mono">Loading document…</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800/40 shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-zinc-500 hover:text-zinc-300 text-xs font-mono tracking-wide transition-colors"
        >
          ← Documents
        </button>
        <h1 className="text-zinc-200 text-sm font-mono">{doc.title}</h1>
        <span className="text-zinc-700 text-[10px] font-mono ml-auto">
          {doc.id.slice(0, 8)}
        </span>
      </div>

      {/* Editor + Terminal */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        <div className="editor-panel flex-1 overflow-y-auto">
          <EditorCanvas
            value={doc.content}
            onChange={handleContentChange}
            documentId={doc.id}
          />
        </div>
        <div className="editor-panel w-full lg:w-96 shrink-0">
          <StreamingTerminalBlock />
        </div>
      </div>
    </div>
  );
}