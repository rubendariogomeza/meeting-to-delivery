import test from "node:test";
import assert from "node:assert/strict";
import { buildBrief } from "../src/brief/build.js";
import { renderBriefMarkdown } from "../src/brief/markdown.js";
import { BriefSchema } from "../src/core/schemas.js";
import { loadSeedTasks } from "./helpers.js";

const NOW = new Date("2026-11-05T18:00:00Z");

async function brief() {
  return buildBrief(await loadSeedTasks(), {
    team: "Plataforma de salud",
    now: NOW,
    windowDays: 7,
    stalledAfterDays: 14,
  });
}

test("cuenta abiertas y cerradas", async () => {
  const result = await brief();
  assert.equal(result.counts.total, 21);
  assert.equal(result.counts.open, 17);
  assert.equal(result.counts.closed, 4);
});

test("detecta movimientos dentro de la ventana", async () => {
  const result = await brief();
  assert.ok(result.moved.some((item) => item.id === "T-101"));
  assert.ok(result.moved.every((item) => item.from !== item.to));
});

test("no cuenta movimientos fuera de la ventana", async () => {
  const result = await brief();
  assert.ok(!result.moved.some((item) => item.id === "T-102"));
});

test("marca estancadas solo por encima del umbral", async () => {
  const result = await brief();
  assert.ok(result.stalled.every((item) => item.days > 14));
  assert.ok(result.stalled.some((item) => item.id === "T-107"));
  assert.ok(!result.stalled.some((item) => item.id === "T-118"));
});

test("las decisiones incluyen sin responsable, vencidas y bloqueadas", async () => {
  const result = await brief();
  const reasons = result.decisions.map((item) => item.reason);
  assert.ok(reasons.some((reason) => reason === "sin responsable"));
  assert.ok(reasons.some((reason) => reason.startsWith("vencida")));
  assert.ok(reasons.some((reason) => reason.startsWith("bloqueada")));
});

test("no repite una tarea en dos decisiones", async () => {
  const result = await brief();
  const ids = result.decisions.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("calcula riesgos con evidencia", async () => {
  const result = await brief();
  const kinds = result.risks.map((risk) => risk.kind);
  assert.ok(kinds.includes("Concentración"));
  assert.ok(result.risks.every((risk) => risk.evidence.length > 0));
});

test("el brief cumple el esquema y se renderiza", async () => {
  const result = await brief();
  assert.doesNotThrow(() => BriefSchema.parse(result));
  const markdown = renderBriefMarkdown(result);
  assert.match(markdown, /## Qué se movió/);
  assert.match(markdown, /## Qué necesita decisión/);
});
