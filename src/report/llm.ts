import type { Report } from "../core/schemas.js";
import { truncate } from "../core/text.js";
import type { ParsedTranscript } from "../ingest/transcript.js";
import { transcriptAsText } from "../ingest/transcript.js";

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export function llmConfigFromEnv(env: NodeJS.ProcessEnv = process.env): LlmConfig | null {
  const apiKey = env.LLM_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    baseUrl: (env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, ""),
    apiKey,
    model: env.LLM_MODEL ?? "gpt-4o-mini",
    timeoutMs: Number(env.LLM_TIMEOUT_MS ?? 45_000),
  };
}

const SYSTEM_PROMPT = `Eres un asistente de gestión de proyectos. Escribes en español neutro, sin adornos.
Recibes la transcripción de una reunión y la lista de tareas ya extraída por el sistema.
Reglas:
- No inventes hechos, cifras, nombres ni fechas que no estén en la transcripción.
- El resumen ejecutivo tiene 2 a 4 frases y menciona solo lo que ocurrió.
- Cada acuerdo y cada decisión debe apoyarse en una frase de la transcripción.
- No repitas tareas en acuerdos ni en decisiones.
- Devuelve únicamente un objeto JSON con esta forma:
{"executiveSummary":"...","agreements":["..."],"decisions":["..."]}`;

function stripFences(text: string): string {
  return text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

/**
 * The model writes prose only. Tasks, owners and dates stay deterministic:
 * a model cannot silently invent a commitment.
 */
export async function enhanceWithLlm(
  base: Report,
  transcript: ParsedTranscript,
  config: LlmConfig,
): Promise<Report> {
  const body = {
    model: config.model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `TRANSCRIPCIÓN:\n${truncate(transcriptAsText(transcript), 24_000)}\n\n` +
          `TAREAS YA EXTRAÍDAS:\n${base.taskIds.join(", ") || "(ninguna)"}\n\n` +
          `ASISTENTES: ${transcript.participants.join(", ")}`,
      },
    ],
  };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`El proveedor del modelo respondió ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("El proveedor del modelo devolvió una respuesta vacía.");

  const parsed = JSON.parse(stripFences(content)) as {
    executiveSummary?: unknown;
    agreements?: unknown;
    decisions?: unknown;
  };

  const summary = typeof parsed.executiveSummary === "string" ? parsed.executiveSummary.trim() : "";
  if (summary.length < 20) throw new Error("El resumen del modelo es demasiado corto.");

  const asStrings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

  return {
    ...base,
    executiveSummary: summary,
    agreements: asStrings(parsed.agreements),
    decisions: asStrings(parsed.decisions),
    warnings: [...base.warnings, "Secciones narrativas generadas por el modelo; tareas y fechas son deterministas."],
  };
}
