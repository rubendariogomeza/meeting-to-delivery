import { readFile } from "node:fs/promises";
import path from "node:path";
import { docxToText } from "./docx.js";
import { normalize, slug, truncate } from "../core/text.js";
import { monthNumber, parseDateExpression, toIsoDate } from "../core/dates.js";

export interface TranscriptLine {
  at: string;
  speaker: string;
  text: string;
}

export interface ParsedTranscript {
  meetingId: string;
  title: string;
  date: string;
  language: string;
  participants: string[];
  lines: TranscriptLine[];
  warnings: string[];
}

export interface ParseOptions {
  fileName?: string;
  dateOverride?: string;
  language?: string;
}

const TS_FIRST = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]{1,60}):\s*(.*)$/;
const SPEAKER_FIRST = /^([^:[\]]{1,60}?)\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\]:\s*(.*)$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseHeaderDate(raw: string, base: Date): string | null {
  const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const full = normalize(raw).match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})\b/,
  );
  if (full) {
    const month = monthNumber(full[2]);
    if (month !== null) return `${full[3]}-${pad(month + 1)}-${pad(Number(full[1]))}`;
  }

  const partial = parseDateExpression(raw, base);
  return partial?.date ?? null;
}

function splitParticipants(raw: string): string[] {
  return raw
    .split(/[;,]/)
    .flatMap((chunk) => chunk.split(/\s+y\s+/i))
    .map((name) => name.replace(/^\s*(asistentes|attendees)\s*:\s*/i, "").trim())
    .filter(Boolean);
}

/** Parse a plain-text transcript with a small, explicit header. */
export function parseTranscript(text: string, options: ParseOptions = {}): ParsedTranscript {
  const warnings: string[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  let title = "";
  let headerDate = "";
  let participants: string[] = [];

  const body: TranscriptLine[] = [];
  let current: TranscriptLine | null = null;
  let headerDone = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const timestampFirst = line.match(TS_FIRST);
    const speakerFirst = !timestampFirst ? line.match(SPEAKER_FIRST) : null;

    if (timestampFirst || speakerFirst) {
      headerDone = true;
      const at = timestampFirst ? timestampFirst[1] : speakerFirst![2];
      const speaker = (timestampFirst ? timestampFirst[2] : speakerFirst![1]).trim();
      const content = (timestampFirst ? timestampFirst[3] : speakerFirst![3]).trim();
      current = { at, speaker, text: content };
      body.push(current);
      continue;
    }

    if (!headerDone) {
      const titleMatch = line.match(/^(reuni[oó]n|meeting|t[ií]tulo)\s*:\s*(.+)$/i);
      if (titleMatch) { title = titleMatch[2].trim(); continue; }
      const dateMatch = line.match(/^fecha\s*:\s*(.+)$/i);
      if (dateMatch) { headerDate = dateMatch[1].trim(); continue; }
      const peopleMatch = line.match(/^(asistentes|participantes|attendees)\s*:\s*(.+)$/i);
      if (peopleMatch) { participants = splitParticipants(peopleMatch[2]); continue; }
      continue;
    }

    if (current) {
      current.text = `${current.text} ${line}`.trim();
    } else {
      warnings.push(`Línea fuera de formato ignorada: ${truncate(line, 60)}`);
    }
  }

  const base = options.dateOverride ? new Date(`${options.dateOverride}T00:00:00Z`) : new Date();
  const date = options.dateOverride
    ?? (headerDate ? parseHeaderDate(headerDate, base) : null);

  if (!date) {
    throw new Error(
      "No se pudo determinar la fecha de la reunión. Añade 'Fecha: YYYY-MM-DD' al encabezado o usa --date.",
    );
  }

  if (!title) {
    title = options.fileName
      ? path.basename(options.fileName, path.extname(options.fileName)).replace(/[-_]+/g, " ")
      : "Reunión sin título";
    warnings.push(`Sin título en el encabezado; se usó "${title}".`);
  }

  const speakers = [...new Set(body.map((line) => line.speaker))];
  if (participants.length === 0) {
    participants = speakers;
    warnings.push("Sin lista de asistentes; se usaron los hablantes del transcript.");
  }

  if (body.length === 0) {
    throw new Error("El transcript no contiene líneas con el formato [hh:mm:ss] Hablante: texto.");
  }

  return {
    meetingId: `${date}-${slug(title)}`,
    title,
    date,
    language: options.language ?? "es-ES",
    participants,
    lines: body,
    warnings,
  };
}

export async function readTranscriptFile(file: string, options: ParseOptions = {}): Promise<ParsedTranscript> {
  const ext = path.extname(file).toLowerCase();
  const buffer = await readFile(file);
  const text = ext === ".docx" ? docxToText(new Uint8Array(buffer)) : buffer.toString("utf8");
  return parseTranscript(text, { ...options, fileName: options.fileName ?? file });
}

export function transcriptAsText(transcript: ParsedTranscript): string {
  const header = [
    `Reunión: ${transcript.title}`,
    `Fecha: ${transcript.date}`,
    `Asistentes: ${transcript.participants.join(", ")}`,
    "",
  ].join("\n");
  const body = transcript.lines.map((line) => `[${line.at}] ${line.speaker}: ${line.text}`).join("\n");
  return `${header}\n${body}\n`;
}

export function transcriptDateAsDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}
