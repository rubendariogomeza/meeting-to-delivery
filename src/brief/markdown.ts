import type { Brief } from "../core/schemas.js";
import { formatSpanishDate } from "../core/dates.js";

const STATUS_LABEL: Record<string, string> = {
  abierta: "abierta",
  en_progreso: "en progreso",
  bloqueada: "bloqueada",
  cerrada: "cerrada",
};

export function renderBriefMarkdown(brief: Brief): string {
  const lines: string[] = [];
  lines.push(`# Delivery brief — ${brief.team}`);
  lines.push("");
  lines.push(`**Semana:** ${brief.week} · **Ventana:** ${brief.window.from} → ${brief.window.to}`);
  lines.push(`**Generado:** ${brief.generatedAt}`);
  lines.push("");
  lines.push("## Números");
  lines.push("");
  lines.push("| Abiertas | Cerradas | Estancadas | Sin responsable | Vencidas |");
  lines.push("| ---: | ---: | ---: | ---: | ---: |");
  lines.push(
    `| ${brief.counts.open} | ${brief.counts.closed} | ${brief.counts.stalled} | ${brief.counts.unassigned} | ${brief.counts.overdue} |`,
  );
  lines.push("");

  lines.push("## Qué se movió");
  lines.push("");
  if (brief.moved.length === 0) {
    lines.push("Sin movimientos de estado registrados en la ventana.");
  } else {
    for (const item of brief.moved) {
      lines.push(
        `- **[${item.id}]** ${item.summary} — ${item.owner}: ${STATUS_LABEL[item.from]} → ${STATUS_LABEL[item.to]}.`,
      );
    }
  }
  lines.push("");

  lines.push("## Qué está quieto");
  lines.push("");
  if (brief.stalled.length === 0) {
    lines.push("Ninguna tarea supera el umbral de estancamiento.");
  } else {
    for (const item of brief.stalled) {
      lines.push(`- **[${item.id}]** ${item.summary} — ${item.owner}, ${item.days} días en ${STATUS_LABEL[item.status]}.`);
    }
  }
  lines.push("");

  lines.push("## Qué necesita decisión");
  lines.push("");
  if (brief.decisions.length === 0) {
    lines.push("Nada pendiente de decisión esta semana.");
  } else {
    for (const item of brief.decisions) {
      const due = item.due ? ` · fecha ${formatSpanishDate(item.due)}` : "";
      lines.push(`- **[${item.id}]** ${item.summary} — ${item.reason}${due}.`);
    }
  }
  lines.push("");

  lines.push("## Riesgos");
  lines.push("");
  if (brief.risks.length === 0) {
    lines.push("Sin riesgos por encima de los umbrales configurados.");
  } else {
    for (const risk of brief.risks) {
      lines.push(`- **${risk.kind}:** ${risk.description} _(${risk.evidence})_`);
    }
  }
  lines.push("");

  return lines.join("\n");
}
