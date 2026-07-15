// src/workers/web-llm.worker.ts
import { pipeline, env } from "@huggingface/transformers";

console.log("[worker] file evaluated, top level");

if (env.backends?.onnx) {
  const onnxBackend: any = env.backends.onnx;
  if (!onnxBackend.wasm) onnxBackend.wasm = {};
  onnxBackend.wasm.numThreads = 1;
  onnxBackend.wasm.simd = false;
}

self.postMessage({ type: "booted" });

self.onmessage = async (event: MessageEvent) => {
  console.log("[worker] received message:", event.data);
  if (event.data?.type !== "load") return;

  try {
    self.postMessage({ type: "status", status: "loading", progressText: "Starting model fetch..." });
    console.log("[worker] calling pipeline()...");

    const generator = await pipeline(
      "text-generation",
      "onnx-community/Qwen2.5-0.5B-Instruct",
      {
        device: "wasm",
        dtype: "q4",
        progress_callback: (p: any) => {
          console.log("[worker] progress:", p);
          self.postMessage({
            type: "progress",
            progress: p.progress || 0,
            text: `Downloading weights: ${p.file || ""} (${Math.round(p.progress || 0)}%)`,
          });
        },
      }
    );

    console.log("[worker] pipeline resolved, engine ready");
    self.postMessage({ type: "status", status: "ready" });
    (self as any).__generator = generator;
  } catch (err) {
    console.error("[worker] CAUGHT error:", err);
    self.postMessage({ type: "error", error: err instanceof Error ? err.message : String(err) });
  }
};

self.onunhandledrejection = (event) => {
  console.error("[worker] unhandled rejection:", event.reason);
  self.postMessage({ type: "error", error: `Unhandled rejection: ${event.reason}` });
};
