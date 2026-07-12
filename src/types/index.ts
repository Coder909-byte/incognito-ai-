// src/types/index.ts
// Shared TypeScript types across the application

export type WebLLMStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'generating'
  | 'error'
  | 'no_webgpu';

export interface StreamToken {
  text: string;
  index: number;
  done: boolean;
}

export interface WebLLMMessage {
  type:
    | 'STATUS'
    | 'TOKEN'
    | 'DONE'
    | 'ERROR'
    | 'NO_WEBGPU'
    | 'TOKENS_SAVED'
    | 'PROGRESS';
  status?: WebLLMStatus;
  token?: string;
  error?: string;
  tokensSaved?: number;
  progress?: number;     // 0–100 for model download
  progressText?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsLog {
  id: string;
  userId: string;
  actionType: 'rewrite' | 'summarize' | 'expand' | 'generate';
  tokensSaved: number;
  processedAt: string;
}

export type ActionType = 'rewrite' | 'summarize' | 'expand' | 'generate';

export interface SelectionState {
  rect: DOMRect | null;
  text: string;
}
