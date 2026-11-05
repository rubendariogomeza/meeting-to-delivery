import type { Attendee, Confidence, Due, Priority, Task } from "../core/schemas.js";
import { normalize, sentences, similarity, stripTrailingPunctuation, truncate } from "../core/text.js";
import { parseDateExpression, toIsoDate } from "../core/dates.js";
import type { ParsedTranscript } from "../ingest/transcript.js";
import { escapeRegExp, resolveOwner, UNASSIGNED } from "./owners.js";

const OWNER_VERB = new RegExp(
  [
    "\\b(se encarga|se encargan|queda con|quedan con|se compromete|se comprometen)\\b",
    "\\b(va|van) a (revisar|preparar|enviar|documentar|actualizar|coordinar|crear|migrar|probar|desplegar|corregir|definir|contactar|compartir)\\b",
    "\\b(revisara|preparara|enviara|documentara|actualizara|coordinara|creara|migrara|probara|desplegara|corregira|definira|contactara|compartira)\\b",
  ].join("|"),
);
const GENERIC_TASK = /\b(hay que|queda pendiente|pendiente de|falta)\b/;
const SELF_OFFER = /\bpuedo\b/;
const INFINITIVE = /\b(revisar|preparar|enviar|documentar|actualizar|coordinar|crear|migrar|probar|desplegar|corregir|definir|contactar|compartir)\b/;
const DECISION_CUE = /\b(decidimos|decision|se decide|queda decidido|aprobamos|se aprueba)\b/;
const AGREEMENT_CUE = /\b(acordamos|acuerdo|quedamos en|se acuerda|dejamos como acuerdo)\b/;
const EXPLICIT = /^\s*tarea\s*[:\-]\s*/i;

export interface ExtractionResult {
  tasks: Task[];
  agreements: string[];
  decisions: string[];
  warnings: string[];
}

interface Candidate {
  summary: string;
  quote: string;
  ownerName: string;
  ownerEmail: string | null;
  due: Due | null;
  priority: Priority;
  explicit: boolean;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

function cleanSentence(value: string): string {
  return capitalize(stripTrailingPunctuation(value.replace(/\s+/g, " ").trim()));
}

const FUTURE_TO_INFINITIVE: Record<string, string> = {
  revisara: "revisar", preparara: "preparar", enviara: "enviar", documentara: "documentar",
  actualizara: "actualizar", coordinara: "coordinar", creara: "crear", migrara: "migrar",
  probara: "probar", desplegara: "desplegar", corregira: "corregir", definira: "definir",
  contactara: "contactar", compartira: "compartir",
};

function cleanSummary(sentence: string, ownerName: string, due: Due | null): string {
  let value = sentence.trim();
  value = value.replace(EXPLICIT, "");
  value = value.replace(
    /^(acordamos que|acordamos|decidimos que|decidimos|hay que|queda pendiente|pendiente de|se acuerda que|se decide que|puedo|podemos|voy a)\s+/i,
    "",
  );
  if (ownerName && ownerName !== UNASSIGNED) {
    const firstName = ownerName.split(" ")[0];
    value = value.replace(new RegExp(`^${escapeRegExp(firstName)}\\s+`, "i"), "");
  }
  value = value.replace(
    /^(yo me encargo de|yo me encargo|me encargo de|me encargo|se encarga de|se encarga|se encargan de|queda con|quedan con|se compromete a|se comprometen a|va a|van a)\s+/i,
    "",
  );
  value = value.replace(/^([\p{L}]+)(?=\s|$)/u, (word) => FUTURE_TO_INFINITIVE[normalize(word)] ?? word);
  if (due?.raw) {
    const index = normalize(value).lastIndexOf(normalize(due.raw));
    if (index > 3) value = value.slice(0, index).trim();
  }
  value = value.replace(/[;,]\s*(es|sera)\s+urgente\s*$/i, "");
  value = value.replace(/[\s,]+(antes de|antes del?|para el|para la|el|la)\s*$/i, "");
  value = stripTrailingPunctuation(value.replace(/\s{2,}/g, " "));
  if (value.length < 4) value = stripTrailingPunctuation(sentence);
  return capitalize(truncate(value, 160));
}

function priorityOf(plain: string): Priority {
  if (/\b(urgente|critico|critica|bloqueante|incidente|se cae|caido)\b/.test(plain)) return "alta";
  if (/\b(cuando puedas|baja prioridad|sin prisa|si hay tiempo)\b/.test(plain)) return "baja";
  return "media";
}

function confidenceOf(ownerName: string, due: Due | null): Confidence {
  const assigned = ownerName !== UNASSIGNED;
  if (assigned && due?.date) return "alta";
  if (assigned || due?.date) return "media";
  return "baja";
}

interface ExplicitFields {
  summary: string;
  ownerName: string | null;
  dueRaw: string | null;
}

function parseExplicit(sentence: string): ExplicitFields | null {
  if (!EXPLICIT.test(sentence)) return null;
  const body = sentence.replace(EXPLICIT, "").trim();
  const parts = body.split(/\s+[—–-]\s+|;\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const summary = parts[0];
  let ownerName: string | null = null;
  let dueRaw: string | null = null;
  for (const part of parts.slice(1)) {
    const owner = part.match(/^(responsable|dueno|owner|asignado a)\s*:\s*(.+)$/i);
    if (owner) ownerName = owner[2].trim();
    const due = part.match(/^(fecha|vence|plazo|due)\s*:\s*(.+)$/i);
    if (due) dueRaw = due[2].trim();
  }
  return { summary, ownerName, dueRaw };
}

export function extractFromTranscript(
  transcript: ParsedTranscript,
  attendees: Attendee[],
  now: string,
): ExtractionResult {
  const warnings: string[] = [...transcript.warnings];
  const baseDate = new Date(`${transcript.date}T00:00:00Z`);
  const candidates: Candidate[] = [];
  const agreements: string[] = [];
  const decisions: string[] = [];

  for (const line of transcript.lines) {
    for (const sentence of sentences(line.text)) {
      const plain = normalize(sentence);
      const explicit = parseExplicit(sentence);
      const resolution = resolveOwner(sentence, line.speaker, attendees);
      const selfOffer = SELF_OFFER.test(plain) && INFINITIVE.test(plain);

      const looksLikeTask = Boolean(explicit)
        || (resolution.owner.name !== UNASSIGNED && OWNER_VERB.test(plain))
        || (GENERIC_TASK.test(plain) && INFINITIVE.test(plain))
        || selfOffer;

      if (looksLikeTask) {
        let owner = resolution.owner;
        if (selfOffer && owner.name === UNASSIGNED) {
          const speakerKey = normalize(line.speaker);
          const self = attendees.find(
            (attendee) =>
              normalize(attendee.name) === speakerKey
              || normalize(attendee.name).split(" ")[0] === speakerKey,
          );
          owner = self
            ? { name: self.name, email: self.email ?? null }
            : { name: line.speaker, email: null };
        }
        if (explicit?.ownerName) {
          const match = attendees.find((attendee) => {
            const full = normalize(attendee.name);
            const wanted = normalize(explicit.ownerName!);
            return full === wanted || full.split(" ")[0] === wanted;
          });
          if (match) {
            owner = { name: match.name, email: match.email ?? null };
          } else {
            warnings.push(
              `Responsable "${explicit.ownerName}" no está en la lista de asistentes; queda sin asignar.`,
            );
            owner = { name: UNASSIGNED, email: null };
          }
        }

        const due = parseDateExpression(explicit?.dueRaw ?? sentence, baseDate);
        const summarySource = explicit?.summary ?? sentence;
        candidates.push({
          summary: cleanSummary(summarySource, owner.name, due),
          quote: sentence.trim(),
          ownerName: owner.name,
          ownerEmail: owner.email,
          due,
          priority: priorityOf(plain),
          explicit: Boolean(explicit),
        });
        continue;
      }

      if (DECISION_CUE.test(plain)) {
        const withoutLabel = sentence.replace(/^(decisi[oó]n|acuerdo)\s*[:\-]\s*/i, "");
        decisions.push(cleanSentence(withoutLabel.replace(/^(decidimos que|decidimos|se decide que|se decide)\s+/i, "")));
        continue;
      }

      if (AGREEMENT_CUE.test(plain)) {
        const withoutLabel = sentence.replace(/^(decisi[oó]n|acuerdo)\s*[:\-]\s*/i, "");
        agreements.push(cleanSentence(withoutLabel.replace(/^(acordamos que|acordamos|quedamos en|se acuerda que|se acuerda)\s+/i, "")));
      }
    }
  }

  const merged: Candidate[] = [];
  for (const candidate of candidates) {
    const duplicate = merged.find((existing) => similarity(existing.summary, candidate.summary) >= 0.72);
    if (!duplicate) {
      merged.push(candidate);
      continue;
    }
    warnings.push(`Tarea duplicada fusionada: "${candidate.summary}".`);
    const better = confidenceOf(candidate.ownerName, candidate.due) === "alta"
      && confidenceOf(duplicate.ownerName, duplicate.due) !== "alta";
    if (better) Object.assign(duplicate, candidate);
  }

  const tasks: Task[] = merged.map((candidate, index) => {
    const id = `T-${String(index + 1).padStart(3, "0")}`;
    if (candidate.ownerName === UNASSIGNED) warnings.push(`Tarea ${id} sin responsable: "${candidate.summary}".`);
    if (!candidate.due?.date) warnings.push(`Tarea ${id} sin fecha: "${candidate.summary}".`);
    return {
      id,
      meetingId: transcript.meetingId,
      summary: candidate.summary,
      description: `${candidate.summary}. Compromiso de "${transcript.title}" del ${transcript.date}.`,
      owner: { name: candidate.ownerName, email: candidate.ownerEmail },
      due: candidate.due ?? { date: null, raw: null },
      priority: candidate.priority,
      sourceQuote: candidate.quote,
      confidence: confidenceOf(candidate.ownerName, candidate.due),
      status: "abierta",
      updatedAt: now,
      history: [{ at: now, status: "abierta", note: "Creada desde la reunión." }],
    };
  });

  const dedupeText = (values: string[]): string[] => {
    const unique: string[] = [];
    for (const value of values) {
      if (!value) continue;
      if (unique.some((existing) => similarity(existing, value) >= 0.8)) continue;
      unique.push(value);
    }
    return unique;
  };

  const taskSummaries = tasks.map((task) => task.summary);
  const notATask = (value: string): boolean =>
    !taskSummaries.some((summary) => similarity(summary, value) >= 0.7);

  return {
    tasks,
    agreements: dedupeText(agreements).filter(notATask).slice(0, 20),
    decisions: dedupeText(decisions).filter(notATask).slice(0, 20),
    warnings: [...new Set(warnings)],
  };
}
