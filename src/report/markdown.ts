import type { Report, Task } from "../core/schemas.js";
import { formatSpanishDate } from "../core/dates.js";

export function renderReportMarkdown(report: Report, tasks: Task[]): string {
  const lines: string[] = [];
  lines.push(`# ${report.title}`);
  lines.push("");
  lines.push(`**Fecha:** ${formatSpanishDate(report.date)} · **Participantes:** ${report.participants.join(", ")}`);
  lines.push("");
  lines.push("## Resumen ejecutivo");
  lines.push("");
  lines.push(report.executiveSummary);
  lines.push("");
  lines.push("## Acuerdos");
  lines.push("");
  lines.push(report.agreements.length ? report.agreements.map((item) => `- ${item}`).join("\n") : "- Ninguno.");
  lines.push("");
  lines.push("## Decisiones");
  lines.push("");
  lines.push(report.decisions.length ? report.decisions.map((item) => `- ${item}`).join("\n") : "- Ninguna.");
  lines.push("");
  lines.push("## Tareas");
  lines.push("");
  if (tasks.length === 0) {
    lines.push("- Ninguna.");
  } else {
    lines.push("| ID | Tarea | Responsable | Fecha | Confianza |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const task of tasks) {
      lines.push(
        `| ${task.id} | ${task.summary} | ${task.owner.name} | ${task.due.date ?? "sin fecha"} | ${task.confidence} |`,
      );
    }
  }
  lines.push("");
  if (report.warnings.length > 0) {
    lines.push("## Revisar");
    lines.push("");
    lines.push(report.warnings.map((item) => `- ${item}`).join("\n"));
    lines.push("");
  }
  return lines.join("\n");
}
