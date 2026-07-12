// src/workers/web-llm.worker.ts
// WebWorker isolation for @mlc-ai/web-llm — model compilation and generation
// never touches the main thread.

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

// Guard: check WebGPU availability before initialising the handler
if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
  self.postMessage({ type: 'NO_WEBGPU' });
} else {
  // WebWorkerMLCEngineHandler listens on self and handles all message routing
  // including model loading progress, token streaming, and completion signals.
  new WebWorkerMLCEngineHandler();
  
  // The handler automatically sets up onmessage to handle:
  // - 'load' messages with model ID and config
  // - 'generate' messages with prompts
  // - 'interrupt' messages to cancel generation
  // It will post back:
  // - { type: 'status', status: 'loading'|'ready'|'error' }
  // - { type: 'progress', progress: 0-1, text: '...' }
  // - { type: 'token', token: '...' }
  // - { type: 'done', text: '...' }
  // - { type: 'error', error: '...' }
  
  self.postMessage({ type: 'STATUS', status: 'loading' });
}