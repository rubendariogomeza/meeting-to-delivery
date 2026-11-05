import type { Report } from "../core/schemas.js";
import { formatSpanishDate } from "../core/dates.js";
import type { ParsedTranscript } from "../ingest/transcript.js";
import type { ExtractionResult } from "../tasks/extract.js";

/** Deterministic report: every sentence is derived from the transcript or a count. */
export function buildHeuristicReport(
  transcript: ParsedTranscript,
  extraction: ExtractionResult,
): Report {
  const taskCount = extraction.tasks.length;
  const unassigned = extraction.tasks.filter((task) => task.owner.name === "sin asignar").length;
  const undated = extraction.tasks.filter((task) => !task.due.date).length;

  const summary =
    `Reunión «${transcript.title}» del ${formatSpanishDate(transcript.date)}, con ` +
    `${transcript.participants.length} participantes y ${transcript.lines.length} intervenciones. ` +
    `Quedaron ${extraction.agreements.length} acuerdos, ${extraction.decisions.length} decisiones y ${taskCount} tareas` +
    (taskCount > 0 ? `; ${unassigned} sin responsable y ${undated} sin fecha.` : ".");

  const warnings = [...extraction.warnings];
  if (unassigned > 0) {
    const subject = unassigned === 1 ? "1 de " + taskCount + " tareas necesita" : `${unassigned} de ${taskCount} tareas necesitan`;
    warnings.push(`${subject} responsable antes de crear los issues.`);
  }

  return {
    meetingId: transcript.meetingId,
    title: transcript.title,
    date: transcript.date,
    language: transcript.language,
    executiveSummary: summary,
    agreements: extraction.agreements,
    decisions: extraction.decisions,
    taskIds: extraction.tasks.map((task) => task.id),
    participants: transcript.participants,
    warnings: [...new Set(warnings)],
  };
}
