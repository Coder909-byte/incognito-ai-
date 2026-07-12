'use client';
// src/components/landing/HeroTitleReveal.tsx
// Character-split title reveal via CSS animations + Web Animations API.
// Mount-ref guards double-fire under React Strict Mode remounts.

import { useEffect, useRef } from 'react';

interface HeroTitleRevealProps {
  onComplete?: () => void;
}

export default function HeroTitleReveal({ onComplete }: HeroTitleRevealProps) {
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guard against React Strict Mode double-mount
    if (mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const run = async () => {
      if (cancelled || !containerRef.current) return;

      const chars = containerRef.current.querySelectorAll<HTMLElement>('.char');
      const subChars = containerRef.current.querySelectorAll<HTMLElement>('.sub-char');

      if (mq.matches) {
        // Reduced-motion: instant opacity reveal only
        chars.forEach(el => el.style.opacity = '1');
        subChars.forEach(el => el.style.opacity = '1');
        onComplete?.();
        return;
      }

      // Animate main title characters with stagger
      const charPromises: Promise<void>[] = [];
      chars.forEach((el, i) => {
        const delay = 100 + i * 30;
        const promise = el.animate(
          [
            { transform: 'translateY(32px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          { duration: 600, delay, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
        ).finished.then(() => {});
        charPromises.push(promise);
      });

      await Promise.all(charPromises);
      if (cancelled) return;

      // Animate subtitle characters with stagger
      const subCharPromises: Promise<void>[] = [];
      subChars.forEach((el, i) => {
        const delay = i * 20;
        const promise = el.animate(
          [
            { transform: 'translateY(16px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          { duration: 500, delay, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
        ).finished.then(() => {});
        subCharPromises.push(promise);
      });

      await Promise.all(subCharPromises);
      if (!cancelled) onComplete?.();
    };

    run();
    return () => { cancelled = true; };
  }, [onComplete]);

  const titleChars = 'IncognitoAI'.split('');
  const subtitleChars = 'Private · Local · Zero Cloud'.split('');

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6 text-center">
      {/* Main title — character split */}
      <h1
        className="flex overflow-hidden"
        aria-label="IncognitoAI"
      >
        {titleChars.map((char, i) => (
          <span
            key={i}
            className="char inline-block text-zinc-100 font-mono text-6xl md:text-8xl tracking-tight"
            style={{ opacity: 0 }}
            aria-hidden="true"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>

      {/* Subtitle — character split */}
      <p
        className="flex flex-wrap justify-center gap-0 overflow-hidden"
        aria-label="Private · Local · Zero Cloud"
      >
        {subtitleChars.map((char, i) => (
          <span
            key={i}
            className="sub-char inline-block text-zinc-600 font-mono text-sm md:text-base tracking-[0.2em]"
            style={{ opacity: 0 }}
            aria-hidden="true"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </p>

      {/* CTA */}
      <div
        className="char flex flex-col sm:flex-row items-center gap-4 mt-4"
        style={{ opacity: 0 }}
      >
        <a
          href="/dashboard"
          id="hero-cta-primary"
          className="
            px-8 py-3 rounded-[2px]
            bg-emerald-500/10 border border-emerald-500/40 text-emerald-400
            font-mono text-sm tracking-wide
            hover:bg-emerald-500/20 hover:border-emerald-500/70
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50
          "
        >
          Open Workspace
        </a>
        <a
          href="#how-it-works"
          id="hero-cta-secondary"
          className="
            px-8 py-3 rounded-[2px] border border-zinc-800/60 text-zinc-500
            font-mono text-sm tracking-wide
            hover:border-zinc-700 hover:text-zinc-400
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500/50
          "
        >
          How it works ↓
        </a>
      </div>
    </div>
  );
}