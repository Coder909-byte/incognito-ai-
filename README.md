PROJECT NAME - INCOGNITO AI 

DESCRIPTION-A privacy-first, offline-capable markdown workspace powered entirely by local client-side WebGPU inference.

PROBLEM STATEMENT-Traditional AI workspaces rely heavily on cloud-based LLM architectures. This introduces massive vulnerabilities regarding data egress, cloud inference costs, third-party data logging, and complete reliance on internet connectivity. For users handling highly sensitive data, corporate secrets, or personal notes, sending prompts to a remote cloud server is an unacceptable privacy risk.

SOLUTION OVERVIEW-
IncognitoAI brings studio-grade AI execution directly to the user's browser canvas. By executing zero-cloud inference, your prompts, context, and markdown documents never leave your browser sandbox.

Zero Cloud Egress: Total client-side computation.

100% Offline-First: Works fully disconnected from the internet once assets are cached.
Persistent Privacy: Secure local file storage with zero external dependencie

ON DEVICE AI EXPLANATION

The architecture offloads the heavy lifting from central cloud instances down to the user's local silicon.
WebGPU Engine: Utilizes modern browser WebGPU bindings via @mlc-ai/web-llm to coordinate matrix multiplications directly on your hardware's local graphics processing unit.
Web Worker Multithreading: The heavy model file streaming, tokenization, and inference loop run inside a background Web Worker thread (web-llm.worker.ts). This ensures the browser's main UI thread remains fluid, completely preventing page stutter or layout lockups during streaming.
IndexedDB Model Caching: Model weights are safely compiled and stored locally in the browser's IndexedDB cache on the first launch, enabling instant boot times on subsequent visits.

TECH STACK
Frontend Core: Next.js (App Router), TypeScript
Styling Framework: Tailwind CSS, Shadcn/ui
Local Inference: WebLLM (@mlc-ai/web-llm), WebGPU API
Base Local Model: Qwen2.5-0.5B-Instruct (Optimized 4-bit quantization)

SETUP INSTRUCTIONS 

Follow these steps to spin up the local development environment:
Clone the Repository:
git clone https://github.com/Coder909-byte/incognito-ai-.git
cd incognito-ai
Install Dependencies:
npm install
Run the Development Server:
npm run dev
Open http://localhost:3000 (or your configured port) in a WebGPU-compatible browser (Chrome, Edge, or Opera).

USAGE INSTRUCTION 

Initialize the Workspace: Open the workspace editor view. The background worker will check your local storage and automatically initialize the local WebGPU inference engine.
Drafting Markdown: Create and organize private documents directly inside the interactive distraction-free workspace layout.
Triggering Local Inference: Select code blocks or specific text strings in the canvas to prompt your local on-device model for quick markdown optimization, synthesis, or editing context.




