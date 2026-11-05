import type { JiraPlan, Report, Task } from "../core/schemas.js";
import { slug, truncate } from "../core/text.js";

export function buildJiraPlan(
  tasks: Task[],
  report: Report,
  projectKey: string,
  generatedAt: string,
): JiraPlan {
  const warnings: string[] = [];
  const labels = ["meeting-followup", `mtg-${slug(report.meetingId, 40)}`];
  const seen = new Set<string>();
  const issues: JiraPlan["issues"] = [];

  for (const task of tasks) {
    const summary = truncate(task.summary, 240);
    const key = summary.toLowerCase();
    if (seen.has(key)) {
      warnings.push(`Tarea repetida omitida en el plan: "${summary}".`);
      continue;
    }
    seen.add(key);

    if (!task.owner.email) {
      warnings.push(
        `Sin correo para "${task.owner.name}" en "${summary}"; Jira necesita un accountId antes de asignar.`,
      );
    }

    issues.push({
      clientRef: task.id,
      summary,
      description: [
        task.description,
        "",
        `Responsable: ${task.owner.name}`,
        `Fecha objetivo: ${task.due.date ?? "sin fecha"}`,
        `Cita: "${task.sourceQuote}"`,
        `Reunión: ${report.title} (${report.date})`,
      ].join("\n"),
      issueType: "Task",
      assignee: { name: task.owner.name, email: task.owner.email ?? null },
      due: task.due.date,
      labels,
      sourceQuote: task.sourceQuote,
    });
  }

  return {
    meetingId: report.meetingId,
    projectKey: projectKey.trim().toUpperCase(),
    generatedAt,
    issues,
    warnings,
  };
}
