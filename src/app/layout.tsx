// src/app/layout.tsx
// Root shell — font loading, dark-mode lock, providers tree.

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { WebLLMProvider } from '@/components/providers/WebLLMProvider';

export const metadata: Metadata = {
  title: {
    default: 'IncognitoAI — Private Local AI Workspace',
    template: '%s | IncognitoAI',
  },
  description:
    'A privacy-first markdown workspace powered by local WebGPU inference. Your documents and prompts never leave your browser.',
  keywords: ['local AI', 'WebGPU', 'privacy', 'markdown editor', 'offline LLM'],
  authors: [{ name: 'IncognitoAI' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'IncognitoAI — Private Local AI Workspace',
    description: 'Zero cloud inference. Zero data egress. Studio-grade local AI.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <ThemeProvider>
          <WebLLMProvider>
            {children}
          </WebLLMProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
