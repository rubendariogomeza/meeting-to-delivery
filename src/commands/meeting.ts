import path from "node:path";
import { AttendeeSchema, JiraPlanSchema, ReportSchema, RunManifestSchema, TaskSchema } from "../core/schemas.js";
import type { Report, Task } from "../core/schemas.js";
import { ensureDir, nowIso, readJson, writeJson, writeText } from "../core/fs.js";
import { readTranscriptFile, transcriptAsText } from "../ingest/transcript.js";
import { extractFromTranscript } from "../tasks/extract.js";
import { generateReport, type EngineName } from "../report/engine.js";
import { buildJiraPlan } from "../jira/plan.js";
import { applyJiraPlan, jiraConfigFromEnv, type ApplyResult } from "../jira/client.js";
import { buildDistributionEmail, buildReviewEmail } from "../mail/compose.js";
import { buildEml } from "../mail/eml.js";
import { renderReportMarkdown } from "../report/markdown.js";

export interface MeetingArgs {
  transcript: string;
  attendees: string;
  out: string;
  projectKey: string;
  engine: EngineName;
  apply: boolean;
  date?: string;
  language?: string;
  organizerName: string;
  organizerEmail: string;
}

export interface MeetingResult {
  outDir: string;
  report: Report;
  tasks: Task[];
  jira: ApplyResult;
  warnings: string[];
}

export function attendeesFromJson(raw: unknown) {
  return AttendeeSchema.array().parse(raw);
}

export async function runMeeting(args: MeetingArgs): Promise<MeetingResult> {
  const startedAt = nowIso();
  const attendees = attendeesFromJson(await readJson(args.attendees));
  if (attendees.length === 0) throw new Error("La lista de asistentes está vacía.");

  const transcript = await readTranscriptFile(args.transcript, {
    dateOverride: args.date,
    language: args.language,
  });

  const extraction = extractFromTranscript(transcript, attendees, startedAt);
  const report = ReportSchema.parse(
    await generateReport(transcript, extraction, { engine: args.engine }),
  );
  const tasks = extraction.tasks.map((task) => TaskSchema.parse(task));

  const generatedAt = nowIso();
  const plan = JiraPlanSchema.parse(buildJiraPlan(tasks, report, args.projectKey, generatedAt));

  const outDir = path.join(args.out, transcript.meetingId);
  await ensureDir(outDir);

  const review = buildReviewEmail(report, tasks);
  const distribution = buildDistributionEmail(report, tasks);
  const recipients = attendees
    .map((attendee) => attendee.email)
    .filter((email): email is string => Boolean(email));

  const artifacts: string[] = [];
  const writeArtifact = async (name: string, content: string): Promise<void> => {
    await writeText(path.join(outDir, name), content);
    artifacts.push(name);
  };

  await writeArtifact("transcript.txt", transcriptAsText(transcript));
  await writeArtifact("report.md", renderReportMarkdown(report, tasks));
  await writeArtifact(
    "review.eml",
    buildEml({
      from: args.organizerEmail,
      to: [args.organizerEmail],
      subject: review.subject,
      body: review.body,
      replyTo: args.organizerEmail,
    }),
  );
  if (recipients.length > 0) {
    await writeArtifact(
      "distribution.eml",
      buildEml({
        from: args.organizerEmail,
        to: recipients,
        subject: distribution.subject,
        body: distribution.body,
        replyTo: args.organizerEmail,
      }),
    );
  }

  await writeJson(path.join(outDir, "report.json"), report);
  await writeJson(path.join(outDir, "tasks.json"), tasks);
  await writeJson(path.join(outDir, "jira-plan.json"), plan);

  const jira = await applyJiraPlan(plan, jiraConfigFromEnv(), { apply: args.apply });

  const warnings = [...new Set([...report.warnings, ...plan.warnings])];
  if (recipients.length === 0) {
    warnings.push("Ningún asistente tiene correo; no se generó el correo de distribución.");
  }

  await writeJson(
    path.join(outDir, "run.json"),
    RunManifestSchema.parse({
      meetingId: transcript.meetingId,
      startedAt,
      finishedAt: nowIso(),
      engine: args.engine,
      artifacts: [...artifacts, "report.json", "tasks.json", "jira-plan.json", "run.json"],
      warnings,
    }),
  );

  return { outDir, report, tasks, jira, warnings };
}
