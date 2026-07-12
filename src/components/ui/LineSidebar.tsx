'use client';
// src/components/ui/LineSidebar.tsx
// Hyper-minimalist vertical nav. No filled backgrounds.
// Spring collapse/expand + GSAP active accent line + Anime.js letter-spacing hover.

import { useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

gsap.registerPlugin();

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 6.5L8 2l6 4.5V14H10v-3.5H6V14H2V6.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="none" />
  </svg>
);

const DocsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.1" />
    <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2L3 4v4c0 3.2 2.4 6.1 5 7 2.6-.9 5-3.8 5-7V4L8 2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="none" />
    <path d="M5.5 8l1.8 1.8L10.5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { href: '/',           label: 'Home',      icon: <HomeIcon /> },
  { href: '/dashboard',  label: 'Documents', icon: <DocsIcon /> },
  { href: '#privacy',    label: 'Privacy',   icon: <ShieldIcon /> },
];

interface LineSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function LineSidebar({ collapsed = false, onToggle }: LineSidebarProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const accentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  // Spring width: organic mass/tension collapse
  const springStyle = useSpring({
    width: collapsed ? 56 : 220,
    config: { mass: 1, tension: 210, friction: 24 },
  });

  // GSAP active accent line: scaleY from 0 → 1
  useGSAP(() => {
    NAV_ITEMS.forEach((item) => {
      const accentEl = accentRefs.current[item.href];
      if (!accentEl) return;
      const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
      gsap.fromTo(
        accentEl,
        { scaleY: 0, transformOrigin: 'top center' },
        {
          scaleY: isActive ? 1 : 0,
          duration: 0.35,
          ease: 'power2.out',
        }
      );
    });
  }, { scope: containerRef, dependencies: [pathname] });

  // Anime.js hover: letter-spacing widen (80ms)
  const handleMouseEnter = async (href: string) => {
    const el = labelRefs.current[href];
    if (!el) return;
    const animeModule = await import('animejs');
    const anime = (animeModule as unknown as { default?: unknown }).default || animeModule;
    (anime as { (params: Record<string, unknown>): void })({ targets: el, letterSpacing: '0.08em', duration: 80, easing: 'linear' });
  };

  const handleMouseLeave = async (href: string) => {
    const el = labelRefs.current[href];
    if (!el) return;
    const animeModule = await import('animejs');
    const anime = (animeModule as unknown as { default?: unknown }).default || animeModule;
    (anime as { (params: Record<string, unknown>): void })({ targets: el, letterSpacing: '0em', duration: 80, easing: 'linear' });
  };

  return (
    <animated.nav
      ref={containerRef}
      style={springStyle}
      aria-label="Main navigation"
      className="relative flex flex-col h-full border-r border-zinc-800/40 overflow-hidden shrink-0 z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-800/40 shrink-0">
        <div className="w-5 h-5 rounded-full border border-emerald-500/50 flex items-center justify-center shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
        </div>
        {!collapsed && (
          <span className="text-zinc-300 text-[11px] font-mono tracking-[0.2em] uppercase whitespace-nowrap overflow-hidden">
            IncognitoAI
          </span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-col flex-1 pt-4 gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              onMouseEnter={() => handleMouseEnter(item.href)}
              onMouseLeave={() => handleMouseLeave(item.href)}
              className={`
                relative flex items-center gap-3 px-2 py-2.5 rounded-xs
                transition-colors duration-150
                ${isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Emerald accent line — GSAP scaleY */}
              <div
                ref={(el) => { accentRefs.current[item.href] = el; }}
                className="absolute left-0 top-0 bottom-0 w-px bg-emerald-500"
                style={{ transform: 'scaleY(0)', transformOrigin: 'top center' }}
                aria-hidden="true"
              />

              <span className="shrink-0">{item.icon}</span>

              {!collapsed && (
                <span
                  ref={(el) => { labelRefs.current[item.href] = el; }}
                  className="text-[12px] font-mono tracking-normal whitespace-nowrap"
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <button
        id="sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center justify-center h-10 border-t border-zinc-800/40 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </animated.nav>
  );
}
