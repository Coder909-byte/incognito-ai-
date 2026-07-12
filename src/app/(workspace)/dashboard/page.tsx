'use client';
// src/app/(workspace)/dashboard/page.tsx
// Document listing with Anime.js stagger entrance.

import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import DocumentListItem from '@/components/ui/DocumentListItem';
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

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docs, setDocs] = useState<Document[]>(MOCK_DOCS);

  // Anime.js stagger on mount
  useGSAP(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      gsap.set('.doc-item', { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo('.doc-item',
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: 'power2.out',
      }
    );
  }, { scope: containerRef });

  const handleBack = () => {
    setSelectedDoc(null);
  };

  const handleCreateNew = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: 'Untitled Document',
      content: '',
      userId: 'dev-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocs((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
  };

  if (selectedDoc) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800/40">
          <button
            onClick={handleBack}
            className="text-zinc-500 hover:text-zinc-300 text-xs font-mono tracking-wide transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-zinc-200 text-sm font-mono">{selectedDoc.title}</h1>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <EditorCanvas
              value={selectedDoc.content}
              onChange={(content) => {
                setSelectedDoc({ ...selectedDoc, content });
                setDocs((prev) => prev.map((d) => d.id === selectedDoc.id ? { ...d, content } : d));
              }}
              documentId={selectedDoc.id}
            />
          </div>
          <div className="w-full lg:w-96 shrink-0">
            <StreamingTerminalBlock />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-zinc-100 text-2xl font-mono tracking-tight mb-2">Documents</h1>
          <p className="text-zinc-600 text-xs font-mono tracking-wide">
            Your local workspace · {docs.length} documents
          </p>
        </div>

        {/* New document button */}
        <button
          onClick={handleCreateNew}
          className="mb-8 px-4 py-2 rounded-xs border border-zinc-800/60 text-zinc-400 text-xs font-mono tracking-wide hover:border-emerald-500/40 hover:text-emerald-400 transition-all duration-200"
        >
          + New Document
        </button>

        {/* Document list */}
        <div className="space-y-1">
          {docs.map((doc, index) => (
            <div key={doc.id} className="doc-item">
              <DocumentListItem
                document={doc}
                index={index}
              />
            </div>
          ))}
        </div>

        {docs.length === 0 && (
          <p className="text-zinc-700 text-xs font-mono text-center py-12">
            No documents yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}