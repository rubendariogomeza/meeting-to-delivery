import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readTranscriptFile } from "../src/ingest/transcript.js";
import { extractFromTranscript } from "../src/tasks/extract.js";
import { generateReport } from "../src/report/engine.js";
import { ReportSchema } from "../src/core/schemas.js";
import { buildJiraPlan } from "../src/jira/plan.js";
import { loadAttendees, root } from "./helpers.js";

const NOW = "2026-11-03T18:00:00Z";

async function build() {
  const attendees = await loadAttendees();
  const transcript = await readTranscriptFile(
    path.join(root, "fixtures", "transcripts", "sprint-2026-11-03.txt"),
  );
  const extraction = extractFromTranscript(transcript, attendees, NOW);
  const report = await generateReport(transcript, extraction, { engine: "heuristic", env: {} });
  return { transcript, extraction, report };
}

test("el informe cumple el esquema", async () => {
  const { report } = await build();
  assert.doesNotThrow(() => ReportSchema.parse(report));
});

test("el informe referencia todas las tareas", async () => {
  const { report, extraction } = await build();
  assert.equal(report.taskIds.length, extraction.tasks.length);
  assert.deepEqual(report.taskIds, extraction.tasks.map((task) => task.id));
});

test("el resumen solo usa datos calculados", async () => {
  const { report, extraction } = await build();
  assert.match(report.executiveSummary, new RegExp(`${extraction.tasks.length} tareas`));
  assert.match(report.executiveSummary, /sin responsable/);
});

test("sin clave de modelo no hay llamada externa", async () => {
  const { report } = await build();
  assert.ok(!report.warnings.some((warning) => warning.includes("El modelo falló")));
});

test("el plan de Jira usa etiquetas de reunión y avisa por correos faltantes", async () => {
  const { report, extraction } = await build();
  const plan = buildJiraPlan(extraction.tasks, report, "demo", NOW);
  assert.equal(plan.projectKey, "DEMO");
  assert.equal(plan.issues.length, extraction.tasks.length);
  assert.ok(plan.issues.every((issue) => issue.labels.some((label) => label.startsWith("mtg-"))));
  assert.ok(plan.warnings.some((warning) => warning.includes("Sin correo para \"Diego Salazar\"")));
});

test("el plan no repite resúmenes", async () => {
  const { report, extraction } = await build();
  const plan = buildJiraPlan(extraction.tasks, report, "DEMO", NOW);
  const summaries = plan.issues.map((issue) => issue.summary.toLowerCase());
  assert.equal(new Set(summaries).size, summaries.length);
});
