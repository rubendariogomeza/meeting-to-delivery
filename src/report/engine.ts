import type { Report } from "../core/schemas.js";
import type { ParsedTranscript } from "../ingest/transcript.js";
import type { ExtractionResult } from "../tasks/extract.js";
import { buildHeuristicReport } from "./heuristic.js";
import { enhanceWithLlm, llmConfigFromEnv } from "./llm.js";

export type EngineName = "heuristic" | "llm";

export interface GenerateOptions {
  engine: EngineName;
  env?: NodeJS.ProcessEnv;
}

export async function generateReport(
  transcript: ParsedTranscript,
  extraction: ExtractionResult,
  options: GenerateOptions,
): Promise<Report> {
  const base = buildHeuristicReport(transcript, extraction);
  if (options.engine !== "llm") return base;

  const config = llmConfigFromEnv(options.env ?? process.env);
  if (!config) {
    return {
      ...base,
      warnings: [...base.warnings, "LLM no configurado (falta LLM_API_KEY); se usó el motor determinista."],
    };
  }

  try {
    return await enhanceWithLlm(base, transcript, config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...base,
      warnings: [...base.warnings, `El modelo falló: ${message}. Se usó el motor determinista.`],
    };
  }
}
