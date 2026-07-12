// src/app/page.tsx
// Landing route — GSAP-pinned scroll sequence + hero reveal.

import type { Metadata } from 'next';
import GrainientBackground from '@/components/ui/GrainientBackground';
import CableSnapScene from '@/components/landing/CableSnapScene';

export const metadata: Metadata = {
  title: 'IncognitoAI — Private Local AI Workspace',
  description:
    'A privacy-first markdown developer workspace. All AI inference runs locally in your browser via WebGPU — zero data egress, zero cloud cost.',
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Animated grain background */}
      <GrainientBackground />

      {/* GSAP-pinned cable snap + hero reveal */}
      <CableSnapScene />

      {/* Features section */}
      <section
        id="how-it-works"
        className="relative z-10 max-w-5xl mx-auto px-6 py-32"
        aria-labelledby="features-heading"
      >
        <h2
          id="features-heading"
          className="text-zinc-500 text-xs font-mono tracking-[0.3em] uppercase mb-16 text-center"
        >
          Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800/30">
          {[
            {
              id: 'feature-webgpu',
              icon: '⬡',
              title: 'WebGPU Inference',
              body: 'Llama 3.2-1B runs entirely in your browser via the WebGPU API. No server round-trips. No per-token billing.',
            },
            {
              id: 'feature-zero-egress',
              icon: '⬡',
              title: 'Zero Data Egress',
              body: 'Your documents, prompts, and completions exist only in your browser sandbox. Nothing is transmitted.',
            },
            {
              id: 'feature-studio',
              icon: '⬡',
              title: 'Studio-Grade Motion',
              body: 'Physics-driven interactions via GSAP, Anime.js, Motion.dev, and React Spring — every surface feels alive.',
            },
          ].map((feat) => (
            <div
              key={feat.id}
              id={feat.id}
              className="p-8 bg-zinc-950 hover:bg-zinc-900/60 transition-colors duration-300 group"
            >
              <div className="text-emerald-500/40 text-2xl mb-4 font-mono group-hover:text-emerald-500/70 transition-colors">
                {feat.icon}
              </div>
              <h3 className="text-zinc-200 text-sm font-mono mb-3">{feat.title}</h3>
              <p className="text-zinc-600 text-xs font-mono leading-relaxed">{feat.body}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 flex flex-wrap justify-center gap-12">
          {[
            { label: 'Cloud API Calls', value: '0' },
            { label: 'Data Transmitted', value: '0 bytes' },
            { label: 'Inference Cost', value: '$0.00' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-mono text-zinc-100 mb-1">{stat.value}</div>
              <div className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/40 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-zinc-700 text-[10px] font-mono tracking-wider">
            IncognitoAI · Privacy-first · Local inference
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" aria-hidden="true" />
            <span className="text-zinc-700 text-[10px] font-mono">All systems local</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
