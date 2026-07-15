// src/workers/web-llm.worker.ts
import { pipeline, env } from "@huggingface/transformers";

console.log("[worker] file evaluated, top level");

if (env.backends && env.backends.onnx) {
  const onnxBackend: any = env.backends.onnx;
  if (!onnxBackend.wasm) onnxBackend.wasm = {};
  onnxBackend.wasm.numThreads = 1;
  onnxBackend.wasm.simd = false;
}

let generator: any = null;

self.postMessage({ type: "booted" });

self.onmessage = async (event: MessageEvent) => {
  console.log("[worker] received message:", event.data);
  const msgType = event.data && event.data.type;

  if (msgType === "load") {
    try {
      self.postMessage({ type: "status", status: "loading", progressText: "Starting model fetch..." });
      console.log("[worker] calling pipeline()...");

      generator = await pipeline(
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
              text: "Downloading weights: " + (p.file || "") + " (" + Math.round(p.progress || 0) + "%)",
            });
          },
        }
      );

      console.log("[worker] pipeline resolved, engine ready");
      self.postMessage({ type: "status", status: "ready" });
    } catch (err) {
      console.error("[worker] CAUGHT error during load:", err);
      self.postMessage({
        type: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  if (msgType === "generate") {
    if (!generator) {
      self.postMessage({ type: "error", error: "Engine not ready yet." });
      return;
    }

    try {
      self.postMessage({ type: "generating_start" });
      console.log("[worker] starting generation for prompt:", event.data.prompt);

      const output = await generator(event.data.prompt, {
        max_new_tokens: 128,
        temperature: 0.7,
        do_sample: true,
      });

      console.log("[worker] generation complete:", output);

      const text =
        Array.isArray(output) && output[0] && output[0].generated_text
          ? output[0].generated_text
          : String(output);

      self.postMessage({ type: "done", text });
    } catch (err) {
      console.error("[worker] CAUGHT error during generate:", err);
      self.postMessage({
        type: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }
};

self.onunhandledrejection = (event) => {
  console.error("[worker] unhandled rejection:", event.reason);
  self.postMessage({ type: "error", error: "Unhandled rejection: " + event.reason });
};