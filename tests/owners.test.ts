import test from "node:test";
import assert from "node:assert/strict";
import { findOwnerMentions, resolveOwner, UNASSIGNED } from "../src/tasks/owners.js";
import { loadAttendees } from "./helpers.js";

test("encuentra el primer nombre mencionado", async () => {
  const attendees = await loadAttendees();
  const hits = findOwnerMentions("Ana se encarga de revisar el mapeo.", attendees);
  assert.ok(hits.length > 0);
  assert.equal(hits[0].attendee.name, "Ana Torres");
});

test("resuelve el responsable por nombre completo", async () => {
  const attendees = await loadAttendees();
  const { owner } = resolveOwner("Luis Mejía preparará el plan.", "Rubén Gómez", attendees);
  assert.equal(owner.name, "Luis Mejía");
  assert.equal(owner.email, "luis.mejia@example.com");
});

test("una automención gana sobre otro nombre", async () => {
  const attendees = await loadAttendees();
  const { owner } = resolveOwner("Yo me encargo y Luis me ayuda.", "Rubén Gómez", attendees);
  assert.equal(owner.name, "Rubén Gómez");
});

test("no confunde palabras que contienen un nombre", async () => {
  const attendees = await loadAttendees();
  const hits = findOwnerMentions("Vamos a analizar la analítica.", attendees);
  assert.equal(hits.length, 0);
});

test("sin mención devuelve sin asignar", async () => {
  const attendees = await loadAttendees();
  const { owner, matched } = resolveOwner("Hay que documentar el rollback.", "Rubén Gómez", attendees);
  assert.equal(owner.name, UNASSIGNED);
  assert.equal(owner.email, null);
  assert.equal(matched, false);
});
