# IncognitoAI — Product Requirement Document (PRD)
**Version:** 1.0 | **Classification:** Execution-Ready — Antigravity Autonomous Build Spec
**Target Runtime:** Next.js 14+ (App Router) | **Design Doctrine:** Zero-Generic-UI, Studio-Grade Motion Systems

---

## 1. EXECUTIVE SUMMARY & CREATIVE TECH STACK

### 1.1 Overview
IncognitoAI is a privacy-first, local-execution markdown developer workspace. All inference runs client-side via WebGPU — no document content, prompts, or completions ever touch a server. The product must read as a bespoke creative-studio artifact (in the visual lineage of Airborne.studio, Lexspace.co, Threejs.paris, Poch.studio) rather than a SaaS dashboard. **No shadcn/ui, no Radix primitives styled as-is, no generic card/button/dialog boilerplate.** Every surface is hand-built.

### 1.2 Core Value Proposition
- **Zero cloud inference cost** — local LLM execution via WebGPU eliminates per-token billing.
- **Zero data egress** — documents and prompts never leave the browser sandbox.
- **Studio-grade motion** — every interaction (hover, focus, stream, load) is physics- or timeline-driven, never CSS-transition default easing.

### 1.3 Creative Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router, RSC) | Routing, streaming SSR shell |
| Styling | Tailwind CSS (utility-only, no component libs) | Atomic styling substrate |
| ORM | Prisma | Type-safe data layer |
| Database | PostgreSQL | Persistent document/user store |
| Cache/Session | Redis | Ephemeral session + rate-limit state |
| Local Inference | `@mlc-ai/web-llm` | Browser-native WebGPU LLM execution |
| Timeline Animation | GSAP + `@gsap/react` (`useGSAP`) | Scroll-pinned sequences, path morphs |
| Micro-interaction | Anime.js | Staggered list/character animation |
| Declarative Motion | Motion.dev (`motion/react`) | Layout transitions, gesture-driven UI |
| Physics Motion | React Spring (`@react-spring/web`) | Mass/tension-based organic movement |
| Component Inspiration (NOT imported as-is) | 21st.dev, Reactbits.dev | Structural/interaction reference only — all components rebuilt bespoke in-repo |

> **Hard Constraint:** No `shadcn`, `@radix-ui/react-*` wrapped as visual components, `daisyUI`, `chakra`, or `mantine`. Headless primitives (if absolutely required for a11y, e.g. focus-trap) are permitted only when fully restyled with zero default class inheritance.

---

## 2. DIRECTORY STRUCTURE MAP

```
incognito-ai/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root shell, font loading, providers
│   │   ├── page.tsx                      # GSAP-pinned landing sequence
│   │   ├── globals.css                   # Tailwind base + CSS custom properties
│   │   ├── (workspace)/
│   │   │   ├── layout.tsx                # Authenticated workspace shell
│   │   │   ├── editor/
│   │   │   │   └── [documentId]/
│   │   │   │       └── page.tsx          # Editor canvas route
│   │   │   └── dashboard/
│   │   │       └── page.tsx              # Document listing
│   │   └── api/
│   │       ├── documents/
│   │       │   ├── route.ts              # GET (list) / POST (create)
│   │       │   └── [id]/route.ts         # GET / PATCH / DELETE
│   │       ├── analytics/
│   │       │   └── route.ts              # POST tokensSaved log entries
│   │       └── auth/
│   │           └── [...nextauth]/route.ts
│   ├── components/
│   │   ├── ui/                           # ALL bespoke — no shadcn
│   │   │   ├── LineSidebar.tsx
│   │   │   ├── GrainientBackground.tsx
│   │   │   ├── EditorCanvas.tsx
│   │   │   ├── ContextActionToolbar.tsx
│   │   │   ├── StreamingTerminalBlock.tsx
│   │   │   ├── DotFieldLayer.tsx
│   │   │   └── DocumentListItem.tsx
│   │   ├── landing/
│   │   │   ├── CableSnapScene.tsx        # GSAP pinned SVG sequence
│   │   │   └── HeroTitleReveal.tsx       # Anime.js stagger
│   │   └── providers/
│   │       ├── WebLLMProvider.tsx
│   │       └── ThemeProvider.tsx
│   ├── hooks/
│   │   ├── useWebLLM.ts                  # State bridge to worker
│   │   ├── useTextSelection.ts           # Drives ContextActionToolbar
│   │   └── useGrainientNoise.ts          # Canvas noise param controller
│   ├── workers/
│   │   └── web-llm.worker.ts             # WebWorkerMLCEngineHandler isolation
│   ├── lib/
│   │   ├── db.ts                         # Prisma singleton
│   │   ├── redis.ts                      # Redis client config
│   │   └── analytics.ts                  # tokensSaved calculation helpers
│   └── types/
│       └── index.ts
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 3. EXPLICIT PREMIUM UI CORE COMPONENTS (NO SHADCN)

### 3.1 `LineSidebar`
- **File:** `src/components/ui/LineSidebar.tsx`
- **Structure:** Hyper-minimalist vertical nav. No filled backgrounds — definition comes entirely from `border-r border-zinc-800/40` hairlines and typographic weight shifts on active state.
- **Motion:** Collapse/expand driven by `useSpring` from `@react-spring/web` with organic mass/tension (`{ mass: 1, tension: 210, friction: 24 }`) — never a linear CSS width transition.
- **States:** rest / hover (subtle `letter-spacing` widen via Anime.js, 80ms) / active (1px emerald accent line grows from top, GSAP `fromTo` on `scaleY`).

### 3.2 `GrainientBackground`
- **File:** `src/components/ui/GrainientBackground.tsx`
- **Structure:** Full-bleed `<canvas>` (fallback: layered SVG `feTurbulence` mesh) rendered beneath `z-0`, base color `bg-zinc-950`.
- **Behavior:** Custom noise filter (`baseFrequency` slowly oscillating via `requestAnimationFrame`, not CSS keyframes) layered under a soft radial aurora gradient (emerald/violet at ~4% opacity) to avoid banding on OLED displays.
- **Perf constraint:** Must run on a `will-change: transform` isolated layer; pause animation loop via `IntersectionObserver` when off-screen.

### 3.3 Editor Canvas (21st.dev-inspired, fully bespoke)
- **File:** `src/components/ui/EditorCanvas.tsx`
- **Structure:** Borderless, unstyled `<textarea>` (or `contentEditable` markdown surface) with no native focus ring, wrapped in a glassmorphic shell: `backdrop-blur-xl bg-zinc-900/30 border border-zinc-800/50 rounded-[2px]`.
- **Focus behavior:** Border color morphs to emerald (`#10b981`) via GSAP tween (not Tailwind transition) on focus-in, confirming local WebGPU engine is active and bound to this document.

### 3.4 `ContextActionToolbar`
- **File:** `src/components/ui/ContextActionToolbar.tsx`
- **Trigger:** `useTextSelection` hook fires on non-empty `window.getSelection()`.
- **Motion:** Mounts via `@react-spring/web` `useTransition` with real mass/tension (`{ mass: 1.2, tension: 300, friction: 22 }`) producing a slight overshoot-bounce into place above the selection range — explicitly avoiding rigid fade/slide UI-kit defaults.
- **Contents:** Icon-only actions (rewrite, summarize-locally, expand) — icons custom SVG, no icon-library defaults.

### 3.5 `StreamingTerminalBlock`
- **File:** `src/components/ui/StreamingTerminalBlock.tsx`
- **Structure:** Monospace output pane tracking token-by-token AI stream from the WebLLM worker.
- **Ambient layer:** `DotFieldLayer.tsx` — a cursor-reactive dot-grid (magnet-lines behavior: dots subtly rotate/attract toward pointer within a radius) rendered on an absolutely-positioned canvas behind the text stream, opacity ≤ 12% so it never competes with readability.

---

## 4. ANIMATION & SYSTEM INTEGRATION SPECIFICATIONS

### 4.1 GSAP ScrollTrigger Landing Sequence
- **File:** `src/components/landing/CableSnapScene.tsx`
- **Pattern:** Strictly `useGSAP(() => { ... }, { scope: containerRef })` from `@gsap/react` — no manual `gsap.context` cleanup, no unscoped selectors.
- **Sequence (pinned viewport, ScrollTrigger `pin: true`, `scrub: 1`):**
  1. SVG "Cloud Network Cable" path drawn in (`strokeDashoffset` tween) representing cloud dependency.
  2. On scroll progress ~40–60%, cable path physically "snaps" — a custom `CustomEase` (e.g. `"snap.out"`, registered via `CustomEase.create`) drives a fracture animation: path splits into two segments with independent rotation/translate falling out of frame.
  3. Concurrently, the editor canvas preview element's border color tweens `zinc-800 → #10b981` (emerald), signaling the shift to local WebGPU execution.
  4. Timeline releases pin; hero copy reveals via Anime.js stagger (see 4.2).

### 4.2 Anime.js Micro-Interactions
- Document title listings (`DocumentListItem.tsx`) animate in with `anime({ targets: '.doc-item', translateY: [12, 0], opacity: [0, 1], delay: anime.stagger(40) })` on mount — guarded inside `useEffect` with a mount-ref flag to prevent double-fire under React Strict Mode remounts.
- Character-stream rendering in `StreamingTerminalBlock` batches DOM writes per animation frame (not per token) to avoid layout thrashing; Anime.js handles only the cursor-blink and completion-flash, not per-character insertion.

### 4.3 Motion.dev Layout Transitions
- Route transitions between `dashboard` and `editor/[documentId]` use `motion/react`'s `AnimatePresence` with shared-layout `layoutId` on the document card → editor canvas morph, producing a continuous shape transform rather than a cut.

### 4.4 WebGPU Worker Thread
- **File:** `src/workers/web-llm.worker.ts`
- Implements the official `WebWorkerMLCEngineHandler` from `@mlc-ai/web-llm`, isolating model compilation and generation entirely off the main thread.
- **Model:** `Llama-3.2-1B-Instruct-q4f16_1-MLC`.
- **Bridge:** `src/hooks/useWebLLM.ts` exposes `{ status, generate(prompt), streamedTokens, tokensSaved }` via `postMessage`/`onmessage`, keeping the main thread free so GSAP/Spring canvases hold steady 60 FPS during generation.
- **Fallback:** If `navigator.gpu` is undefined, surface an inline non-blocking notice; do not crash the worker bootstrap.

---

## 5. DATA SCHEMAS (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String          @id @default(cuid())
  email         String          @unique
  name          String?
  avatarUrl     String?
  createdAt     DateTime        @default(now())
  documents     Document[]
  analyticsLogs AnalyticsLog[]
}

model Document {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model AnalyticsLog {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  actionType   String   // e.g. "rewrite" | "summarize" | "expand" | "generate"
  tokensSaved  Int      @default(0)
  processedAt  DateTime @default(now())

  @@index([userId])
  @@index([processedAt])
}
```

> **AnalyticsLog rationale:** `tokensSaved` is computed client-side (estimated tokens that *would have* been billed by a cloud API for the equivalent action) and logged post-generation — the core judge-facing metric proving the zero-cloud-cost architecture claim.

---

## 6. BUILD ACCEPTANCE CRITERIA (for Antigravity autonomous scaffolding)

- [ ] Zero imports from `shadcn/ui`, `@radix-ui/react-*` (styled), `daisyui`, `chakra-ui`, `@mantine/*`.
- [ ] `LineSidebar`, `GrainientBackground`, `EditorCanvas`, `ContextActionToolbar`, `StreamingTerminalBlock`, `DotFieldLayer` all present in `src/components/ui/` as bespoke implementations.
- [ ] `useGSAP` with `{ scope }` used for all GSAP timelines — no unscoped `gsap.to` calls.
- [ ] `web-llm.worker.ts` uses `WebWorkerMLCEngineHandler`; main thread never calls the model directly.
- [ ] Prisma schema matches Section 5 exactly (field names, types, relations, indexes).
- [ ] Editor canvas border morphs to `#10b981` only after WebLLM engine reports `status: "ready"`.
- [ ] All animation loops respect `prefers-reduced-motion` (fallback to opacity-only transitions).
- [ ] Lighthouse performance score ≥ 90 on the landing route despite the pinned GSAP sequence.

---

*End of PRD — ready for Antigravity ingestion.*