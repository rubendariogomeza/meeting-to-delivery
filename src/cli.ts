#!/usr/bin/env node
import { parseArgs } from "node:util";
import { runMeeting } from "./commands/meeting.js";
import { runBrief } from "./commands/brief.js";
import type { EngineName } from "./report/engine.js";

const HELP = `meeting-to-delivery

Uso:
  npm run meeting -- --transcript <archivo> --attendees <json> [opciones]
  npm run brief   -- --tasks <json> [opciones]

Reunión:
  --transcript <ruta>        .txt, .md, .vtt o .docx (requerido)
  --attendees <ruta>         JSON con [{name,email,aliases}] (requerido)
  --organizer-email <email>  remitente de los correos (default: organizer@example.com)
  --organizer <nombre>       nombre del organizador
  --project-key <clave>      proyecto de Jira (default: DEMO)
  --engine <heuristic|llm>   motor del informe (default: heuristic)
  --apply                    escribe en Jira (requiere JIRA_* en el entorno)
  --date <YYYY-MM-DD>        fecha si el transcript no la trae
  --language <codigo>        idioma del informe (default: es-ES)
  --out <dir>                carpeta de salida (default: runs)

Brief:
  --tasks <ruta>             tareas en JSON (requerido)
  --team <nombre>            nombre del equipo (default: Equipo)
  --now <ISO>                fecha de corte (default: ahora)
  --window-days <n>          ventana de movimiento (default: 7)
  --stalled-after <n>        días para considerar estancada (default: 14)
  --out <dir>                carpeta de salida (default: runs)
`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      transcript: { type: "string" },
      attendees: { type: "string" },
      "organizer-email": { type: "string" },
      organizer: { type: "string" },
      "project-key": { type: "string" },
      engine: { type: "string" },
      apply: { type: "boolean", default: false },
      date: { type: "string" },
      language: { type: "string" },
      out: { type: "string" },
      tasks: { type: "string" },
      team: { type: "string" },
      now: { type: "string" },
      "window-days": { type: "string" },
      "stalled-after": { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const command = positionals[0];
  if (!command || command === "help" || values.help) {
    process.stdout.write(HELP);
    return;
  }

  if (command === "meeting") {
    if (!values.transcript) throw new Error("Falta --transcript.");
    if (!values.attendees) throw new Error("Falta --attendees.");
    const engine = (values.engine ?? "heuristic") as EngineName;
    if (engine !== "heuristic" && engine !== "llm") {
      throw new Error("--engine debe ser heuristic o llm.");
    }
    const result = await runMeeting({
      transcript: values.transcript,
      attendees: values.attendees,
      out: values.out ?? "runs",
      projectKey: values["project-key"] ?? "DEMO",
      engine,
      apply: values.apply,
      date: values.date,
      language: values.language,
      organizerName: values.organizer ?? "Organizador",
      organizerEmail: values["organizer-email"] ?? "organizer@example.com",
    });

    console.log(`Reunión procesada: ${result.report.title} (${result.report.date})`);
    console.log(`Artefactos: ${result.outDir}`);
    console.log(`Tareas: ${result.tasks.length} · ${result.tasks.filter((task) => task.owner.name === "sin asignar").length} sin responsable`);
    console.log(
      result.jira.dryRun
        ? `Jira: simulación (${result.tasks.length} issues planificados, nada escrito)`
        : result.jira.skipped
          ? `Jira: omitido — ${result.jira.reason}`
          : `Jira: ${result.jira.created.length} issues creados`,
    );
    for (const warning of result.warnings) console.log(`  ! ${warning}`);
    return;
  }

  if (command === "brief") {
    if (!values.tasks) throw new Error("Falta --tasks.");
    const now = values.now ? new Date(values.now) : new Date();
    if (Number.isNaN(now.getTime())) throw new Error("--now no es una fecha válida.");
    const result = await runBrief({
      tasks: values.tasks,
      out: values.out ?? "runs",
      team: values.team ?? "Equipo",
      now,
      windowDays: Number(values["window-days"] ?? 7),
      stalledAfterDays: Number(values["stalled-after"] ?? 14),
    });

    console.log(`Delivery brief: ${result.brief.week} — ${result.brief.team}`);
    console.log(
      `Abiertas ${result.brief.counts.open} · estancadas ${result.brief.counts.stalled} · ` +
        `sin responsable ${result.brief.counts.unassigned} · vencidas ${result.brief.counts.overdue}`,
    );
    console.log(`Decisiones: ${result.brief.decisions.length} · riesgos: ${result.brief.risks.length}`);
    console.log(`Artefactos: ${result.outDir}`);
    return;
  }

  throw new Error(`Comando desconocido: ${command}. Usa "meeting" o "brief".`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
