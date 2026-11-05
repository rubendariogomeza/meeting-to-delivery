import test from "node:test";
import assert from "node:assert/strict";
import { buildEml } from "../src/mail/eml.js";
import { buildReviewEmail } from "../src/mail/compose.js";
import type { Report, Task } from "../src/core/schemas.js";

test("el correo tiene las cabeceras mínimas", () => {
  const eml = buildEml({
    from: "a@example.com",
    to: ["b@example.com", "c@example.com"],
    subject: "Revisión de sprint — Plataforma de salud",
    body: "Hola\n\nAñadí métricas.",
    date: new Date("2026-11-05T10:00:00Z"),
  });
  assert.match(eml, /^From: a@example\.com/);
  assert.match(eml, /^To: b@example\.com, c@example\.com/m);
  assert.match(eml, /^Subject: =\?UTF-8\?B\?/m);
  assert.match(eml, /Content-Transfer-Encoding: base64/);
});

test("el cuerpo se decodifica sin perder tildes", () => {
  const body = "Hola\n\nAñadí métricas de latencia.";
  const eml = buildEml({ from: "a@example.com", to: ["b@example.com"], subject: "x", body });
  const encoded = eml.split("\r\n\r\n")[1].replace(/\r\n/g, "");
  assert.equal(Buffer.from(encoded, "base64").toString("utf8"), body);
});

test("el correo de revisión incluye advertencias y no las de distribución", () => {
  const report: Report = {
    meetingId: "x",
    title: "Revisión",
    date: "2026-11-03",
    language: "es-ES",
    executiveSummary: "Resumen.",
    agreements: ["Uno."],
    decisions: ["Dos."],
    taskIds: ["T-001"],
    participants: ["Ana Torres"],
    warnings: ["Tarea T-001 sin fecha."],
  };
  const tasks: Task[] = [
    {
      id: "T-001",
      meetingId: "x",
      summary: "Revisar el mapeo",
      description: "",
      owner: { name: "Ana Torres", email: "ana@example.com" },
      due: { date: null, raw: null },
      priority: "media",
      sourceQuote: "Ana revisa el mapeo.",
      confidence: "media",
      status: "abierta",
      updatedAt: "2026-11-03T18:00:00Z",
      history: [],
    },
  ];
  const review = buildReviewEmail(report, tasks);
  assert.match(review.body, /REVISAR ANTES DE DISTRIBUIR/);
  assert.match(review.body, /T-001/);
  assert.match(review.subject, /Revisión/);
});
