'use client';
// src/app/(workspace)/layout.tsx
// Authenticated workspace shell — LineSidebar + main content area.
// AnimatePresence for route transitions between dashboard ↔ editor.

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import LineSidebar from '@/components/ui/LineSidebar';
import GrainientBackground from '@/components/ui/GrainientBackground';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative flex min-h-screen bg-zinc-950 overflow-hidden">
      {/* Grain background */}
      <GrainientBackground />

      {/* Sidebar */}
      <LineSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Main workspace area */}
      <main
        className="relative z-10 flex-1 flex flex-col overflow-y-auto"
        id="workspace-main"
      >
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
    </div>
  );
}
