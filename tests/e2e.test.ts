import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runMeeting } from "../src/commands/meeting.js";
import { runBrief } from "../src/commands/brief.js";
import { root } from "./helpers.js";

test("de la transcripción al brief, sin servicios externos", async () => {
  const out = await mkdtemp(path.join(tmpdir(), "meeting-to-delivery-"));

  const meeting = await runMeeting({
    transcript: path.join(root, "fixtures", "transcripts", "sprint-2026-11-03.txt"),
    attendees: path.join(root, "fixtures", "attendees.json"),
    out,
    projectKey: "DEMO",
    engine: "heuristic",
    apply: false,
    organizerName: "Rubén Gómez",
    organizerEmail: "organizer@example.com",
  });

  assert.equal(meeting.report.meetingId, "2026-11-03-revision-de-sprint-plataforma-de-salud");
  assert.ok(meeting.tasks.length >= 9);
  assert.equal(meeting.jira.dryRun, true);

  const files = await readdir(meeting.outDir);
  for (const name of ["report.md", "report.json", "tasks.json", "jira-plan.json", "review.eml", "run.json"]) {
    assert.ok(files.includes(name), `falta ${name}`);
  }

  const report = JSON.parse(await readFile(path.join(meeting.outDir, "report.json"), "utf8"));
  assert.equal(report.taskIds.length, meeting.tasks.length);

  const brief = await runBrief({
    tasks: path.join(root, "fixtures", "history", "tasks.json"),
    out,
    team: "Plataforma de salud",
    now: new Date("2026-11-05T18:00:00Z"),
    windowDays: 7,
  });

  assert.equal(brief.brief.counts.open, 17);
  const markdown = await readFile(path.join(brief.outDir, "brief.md"), "utf8");
  assert.match(markdown, /## Qué se movió/);
  assert.match(markdown, /Concentración/);
});

test("un transcript sin fecha falla con un mensaje claro", async () => {
  const out = await mkdtemp(path.join(tmpdir(), "meeting-to-delivery-"));
  await assert.rejects(
    runMeeting({
      transcript: path.join(root, "fixtures", "transcripts", "sin-fecha.txt"),
      attendees: path.join(root, "fixtures", "attendees.json"),
      out,
      projectKey: "DEMO",
      engine: "heuristic",
      apply: false,
      organizerName: "Rubén Gómez",
      organizerEmail: "organizer@example.com",
    }),
    /No se pudo determinar la fecha/,
  );
});
