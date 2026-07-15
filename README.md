# IncognitoAI – Private Local AI Document Workspace

### 
IncognitoAI is a fully local, privacy-first collaborative document workspace featuring inline smart search and contextual assistance. Users can highlight words or paragraphs directly inside the canvas to seamlessly trigger localized text summaries, context expansions, or search tasks.

### 2. Why it matters
Traditional AI writing assistants leak proprietary text, personal data, and intellectual property across networks to cloud APIs. IncognitoAI changes the paradigm by proving that high-performance, real-time AI context workflows can achieve absolute security and zero server data retention, reducing cloud compute infrastructure costs to $0.

### 3. How it works
The workspace captures structural text selection arrays from the custom inline document canvas. It dispatches text payloads across an asynchronous JavaScript channel directly into background execution loops, ensuring typing and rendering frame rates never drop below 60 FPS.

### 4. How it uses On-Device AI
The application operates completely offline. It integrates a 4-bit quantized `Qwen2.5-0.5B-Instruct` model directly within the user’s browser via **Hugging Face Transformers.js v3** and **ONNX Runtime Web**. The entire inference engine runs asynchronously inside an isolated browser HTML5 **Web Worker thread** to prevent UI thread lockups. Model weights are securely cached locally within the browser’s Cache Storage after the initial download.

### 5. Setup & Usage Instructions (How others can run or try it)
Because this app is designed strictly for local-first execution to protect data, run it locally using:
1. Clone the repository: `git clone <your-repo-link>`
2. Run `npm install` to load all packages.
3. Start the application development server with `npm run dev`.
4. Open `http://localhost:3002` (or your configured port), highlight any text block, and test the offline workspace engine immediately.

### 🎥 Demo Video & Screenshots
[Paste your screen recording link or insert your uploaded screenshots right her


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


