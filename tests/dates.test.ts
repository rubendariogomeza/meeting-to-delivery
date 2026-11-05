import test from "node:test";
import assert from "node:assert/strict";
import { daysBetween, parseDateExpression, weekKey } from "../src/core/dates.js";

const base = new Date("2026-11-03T00:00:00Z");

test("fecha ISO explícita", () => {
  assert.deepEqual(parseDateExpression("vence 2026-12-01", base), {
    date: "2026-12-01",
    raw: "2026-12-01",
  });
});

test("día y mes sin año", () => {
  assert.equal(parseDateExpression("antes del 10 de noviembre", base)?.date, "2026-11-10");
});

test("día de la semana", () => {
  assert.equal(parseDateExpression("antes del viernes", base)?.date, "2026-11-06");
});

test("hoy usa la fecha de la reunión", () => {
  assert.equal(parseDateExpression("enviar hoy", base)?.date, "2026-11-03");
});

test("mes anterior implica el año siguiente", () => {
  assert.equal(parseDateExpression("20 de enero", base)?.date, "2027-01-20");
});

test("esta semana termina el viernes", () => {
  assert.equal(parseDateExpression("esta semana", base)?.date, "2026-11-06");
});

test("texto sin fecha no inventa una", () => {
  assert.equal(parseDateExpression("lo antes posible", base), null);
});

test("semana ISO", () => {
  assert.equal(weekKey(new Date("2026-11-05T00:00:00Z")), "2026-W45");
  assert.equal(weekKey(new Date("2026-01-01T00:00:00Z")), "2026-W01");
});

test("días entre fechas", () => {
  assert.equal(daysBetween("2026-10-20", "2026-11-05"), 16);
  assert.equal(daysBetween("2026-11-05", "2026-11-05"), 0);
});
