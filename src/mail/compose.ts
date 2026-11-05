import type { Report, Task } from "../core/schemas.js";
import { formatSpanishDate } from "../core/dates.js";

function taskLine(task: Task): string {
  const owner = task.owner.name;
  const due = task.due.date ? formatSpanishDate(task.due.date) : "sin fecha";
  return `- [${task.id}] ${task.summary} — ${owner} — ${due}`;
}

export function renderReportText(report: Report, tasks: Task[]): string {
  const sections: string[] = [];
  sections.push(`RESUMEN`);
  sections.push(report.executiveSummary);
  sections.push("");
  sections.push("ACUERDOS");
  sections.push(report.agreements.length ? report.agreements.map((item) => `- ${item}`).join("\n") : "- Ninguno.");
  sections.push("");
  sections.push("DECISIONES");
  sections.push(report.decisions.length ? report.decisions.map((item) => `- ${item}`).join("\n") : "- Ninguna.");
  sections.push("");
  sections.push("TAREAS");
  sections.push(tasks.length ? tasks.map(taskLine).join("\n") : "- Ninguna.");
  return sections.join("\n");
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export function buildReviewEmail(report: Report, tasks: Task[]): EmailDraft {
  const warnings = report.warnings.length
    ? `\n\nREVISAR ANTES DE DISTRIBUIR\n${report.warnings.map((item) => `- ${item}`).join("\n")}`
    : "";
  return {
    subject: `[Revisión] Informe de reunión — ${report.title} (${report.date})`,
    body:
      `Hola,\n\nEste es el borrador del informe de "${report.title}" del ${formatSpanishDate(report.date)}.\n\n` +
      `${renderReportText(report, tasks)}${warnings}\n\n` +
      `Confirma o corrige nombres y responsables antes de enviarlo a los participantes.\n`,
  };
}

export function buildDistributionEmail(report: Report, tasks: Task[]): EmailDraft {
  return {
    subject: `Informe de reunión — ${report.title} (${report.date})`,
    body:
      `Hola,\n\nResumen de "${report.title}" del ${formatSpanishDate(report.date)}.\n\n` +
      `${renderReportText(report, tasks)}\n\n` +
      `Las tareas quedaron registradas en Jira. Cualquier corrección, responde a este correo.\n`,
  };
}
