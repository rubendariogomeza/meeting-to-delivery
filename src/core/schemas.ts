import { z } from "zod";

/**
 * Single source of truth for every artifact the engine writes.
 * The JSON files in runs/ are validated against these schemas before
 * anything downstream (Jira, email, brief) is allowed to read them.
 */

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const AttendeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().nullable().default(null),
  aliases: z.array(z.string()).default([]),
});
export type Attendee = z.infer<typeof AttendeeSchema>;

export const OwnerSchema = z.object({
  name: z.string().min(1),
  email: z.string().nullable().default(null),
});
export type Owner = z.infer<typeof OwnerSchema>;

export const DueSchema = z.object({
  date: IsoDate.nullable(),
  raw: z.string().nullable(),
});
export type Due = z.infer<typeof DueSchema>;

export const TaskStatusSchema = z.enum(["abierta", "en_progreso", "bloqueada", "cerrada"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const ConfidenceSchema = z.enum(["alta", "media", "baja"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const PrioritySchema = z.enum(["alta", "media", "baja"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const HistoryEntrySchema = z.object({
  at: z.string(),
  status: TaskStatusSchema,
  note: z.string().default(""),
});
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export const TaskSchema = z.object({
  id: z.string().min(3),
  meetingId: z.string().min(1),
  summary: z.string().min(3).max(200),
  description: z.string().default(""),
  owner: OwnerSchema,
  due: DueSchema,
  priority: PrioritySchema,
  sourceQuote: z.string().default(""),
  confidence: ConfidenceSchema,
  status: TaskStatusSchema.default("abierta"),
  updatedAt: z.string(),
  history: z.array(HistoryEntrySchema).default([]),
});
export type Task = z.infer<typeof TaskSchema>;

export const ReportSchema = z.object({
  meetingId: z.string().min(1),
  title: z.string().min(1),
  date: IsoDate,
  language: z.string().default("es-ES"),
  executiveSummary: z.string().min(1),
  agreements: z.array(z.string()),
  decisions: z.array(z.string()),
  taskIds: z.array(z.string()),
  participants: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
});
export type Report = z.infer<typeof ReportSchema>;

export const JiraIssueSchema = z.object({
  clientRef: z.string().min(1),
  summary: z.string().min(3).max(255),
  description: z.string(),
  issueType: z.string().default("Task"),
  assignee: OwnerSchema,
  due: IsoDate.nullable(),
  labels: z.array(z.string()),
  sourceQuote: z.string(),
});
export type JiraIssue = z.infer<typeof JiraIssueSchema>;

export const JiraPlanSchema = z.object({
  meetingId: z.string().min(1),
  projectKey: z.string().min(1),
  generatedAt: z.string(),
  issues: z.array(JiraIssueSchema),
  warnings: z.array(z.string()).default([]),
});
export type JiraPlan = z.infer<typeof JiraPlanSchema>;

export const BriefSchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/),
  team: z.string(),
  generatedAt: z.string(),
  window: z.object({ from: z.string(), to: z.string() }),
  counts: z.object({
    total: z.number().int().nonnegative(),
    open: z.number().int().nonnegative(),
    closed: z.number().int().nonnegative(),
    stalled: z.number().int().nonnegative(),
    unassigned: z.number().int().nonnegative(),
    overdue: z.number().int().nonnegative(),
  }),
  moved: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
      owner: z.string(),
      from: TaskStatusSchema,
      to: TaskStatusSchema,
      changedAt: z.string(),
    }),
  ),
  stalled: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
      owner: z.string(),
      days: z.number().int().nonnegative(),
      status: TaskStatusSchema,
    }),
  ),
  decisions: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
      reason: z.string(),
      owner: z.string(),
      due: IsoDate.nullable(),
    }),
  ),
  risks: z.array(
    z.object({
      kind: z.string(),
      description: z.string(),
      evidence: z.string(),
    }),
  ),
});
export type Brief = z.infer<typeof BriefSchema>;

export const RunManifestSchema = z.object({
  meetingId: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  engine: z.string(),
  artifacts: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
});
export type RunManifest = z.infer<typeof RunManifestSchema>;
