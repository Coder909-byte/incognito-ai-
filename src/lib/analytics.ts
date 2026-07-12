// src/lib/analytics.ts
// Token savings estimation — cl100k approximation (4 chars ≈ 1 token)

import type { ActionType } from '@/types';

const CHARS_PER_TOKEN = 4;

/**
 * Estimates the number of tokens that WOULD have been billed by a cloud API
 * for an equivalent rewrite/summarize/expand/generate action.
 * This is the core "zero-cloud-cost" metric.
 */
export function estimateTokensSaved(
  promptText: string,
  completionText: string
): number {
  const promptTokens = Math.ceil(promptText.length / CHARS_PER_TOKEN);
  const completionTokens = Math.ceil(completionText.length / CHARS_PER_TOKEN);
  return promptTokens + completionTokens;
}

/** Multipliers per action type (completion is proportionally larger for expand) */
const ACTION_MULTIPLIERS: Record<ActionType, number> = {
  generate: 1.0,
  rewrite: 1.2,
  expand: 1.8,
  summarize: 0.7,
};

export function estimateTokensSavedForAction(
  inputText: string,
  completionText: string,
  actionType: ActionType
): number {
  const base = estimateTokensSaved(inputText, completionText);
  return Math.round(base * ACTION_MULTIPLIERS[actionType]);
}

/** Format tokens saved as a human-readable cost saving string */
export function formatCostSaving(tokensSaved: number): string {
  // GPT-4o pricing: ~$0.005 per 1k tokens (output)
  const dollarsSaved = (tokensSaved / 1000) * 0.005;
  if (dollarsSaved < 0.01) return `<$0.01 saved`;
  return `$${dollarsSaved.toFixed(3)} saved`;
}
