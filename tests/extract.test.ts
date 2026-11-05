import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readTranscriptFile } from "../src/ingest/transcript.js";
import { extractFromTranscript } from "../src/tasks/extract.js";
import { loadAttendees, root } from "./helpers.js";

const NOW = "2026-11-03T18:00:00Z";

async function extract() {
  const attendees = await loadAttendees();
  const transcript = await readTranscriptFile(
    path.join(root, "fixtures", "transcripts", "sprint-2026-11-03.txt"),
  );
  return { transcript, result: extractFromTranscript(transcript, attendees, NOW) };
}

test("lee el encabezado del transcript", async () => {
  const { transcript } = await extract();
  assert.equal(transcript.date, "2026-11-03");
  assert.equal(transcript.title, "Revisión de sprint — Plataforma de salud");
  assert.equal(transcript.participants.length, 5);
  assert.ok(transcript.lines.length >= 25);
});

test("extrae entre 9 y 12 tareas", async () => {
  const { result } = await extract();
  assert.ok(result.tasks.length >= 9, `tareas: ${result.tasks.length}`);
  assert.ok(result.tasks.length <= 12, `tareas: ${result.tasks.length}`);
});

test("la tarea explícita conserva responsable y fecha", async () => {
  const { result } = await extract();
  const task = result.tasks.find((item) => item.summary.toLowerCase().includes("plan de migración"));
  assert.ok(task);
  assert.equal(task.owner.name, "Luis Mejía");
  assert.equal(task.due.date, "2026-11-20");
  assert.equal(task.confidence, "alta");
});

test("fusiona la tarea repetida en dos frases", async () => {
  const { result } = await extract();
  const matches = result.tasks.filter((item) => item.summary.toLowerCase().includes("plan de migración"));
  assert.equal(matches.length, 1);
  assert.ok(result.warnings.some((warning) => warning.includes("duplicada")));
});

test("detecta el compromiso sin responsable", async () => {
  const { result } = await extract();
  const task = result.tasks.find((item) => item.summary.toLowerCase().includes("rollback"));
  assert.ok(task);
  assert.equal(task.owner.name, "sin asignar");
  assert.equal(task.due.date, null);
  assert.equal(task.confidence, "baja");
});

test("una oferta personal asigna al hablante", async () => {
  const { result } = await extract();
  const task = result.tasks.find((item) => item.summary.toLowerCase().includes("diagrama de arquitectura"));
  assert.ok(task);
  assert.equal(task.owner.name, "Camila Ríos");
});

test("no convierte una frase condicional en tarea", async () => {
  const { result } = await extract();
  const task = result.tasks.find((item) => item.summary.toLowerCase().includes("cronograma"));
  assert.equal(task, undefined);
});

test("separa acuerdos y decisiones", async () => {
  const { result } = await extract();
  assert.equal(result.agreements.length, 2);
  assert.equal(result.decisions.length, 2);
  assert.ok(result.decisions.some((item) => item.toLowerCase().includes("esquema actual")));
});
