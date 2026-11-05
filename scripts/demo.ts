import path from "node:path";
import { runMeeting } from "../src/commands/meeting.js";
import { runBrief } from "../src/commands/brief.js";

const root = process.cwd();
const out = path.join(root, "runs");

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

const brief = await runBrief({
  tasks: path.join(root, "fixtures", "history", "tasks.json"),
  out,
  team: "Plataforma de salud",
  now: new Date("2026-11-05T18:00:00Z"),
  windowDays: 7,
  stalledAfterDays: 14,
});

console.log("");
console.log("Demo completa.");
console.log(`  Informe:  ${path.join(meeting.outDir, "report.md")}`);
console.log(`  Tareas:   ${path.join(meeting.outDir, "tasks.json")}`);
console.log(`  Jira:     ${path.join(meeting.outDir, "jira-plan.json")}`);
console.log(`  Correo:   ${path.join(meeting.outDir, "review.eml")}`);
console.log(`  Brief:    ${brief.outDir}`);
console.log("");
console.log(`  ${brief.brief.counts.open} abiertas · ${brief.brief.counts.stalled} estancadas · ${brief.brief.decisions.length} decisiones · ${brief.brief.risks.length} riesgos`);
