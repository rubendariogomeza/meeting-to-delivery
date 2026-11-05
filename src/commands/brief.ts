import path from "node:path";
import { BriefSchema, TaskSchema } from "../core/schemas.js";
import type { Brief, Task } from "../core/schemas.js";
import { readJson, writeJson, writeText } from "../core/fs.js";
import { buildBrief } from "../brief/build.js";
import { renderBriefMarkdown } from "../brief/markdown.js";

export interface BriefArgs {
  tasks: string;
  out: string;
  team: string;
  now: Date;
  windowDays: number;
  stalledAfterDays?: number;
}

export interface BriefResult {
  outDir: string;
  brief: Brief;
}

export async function runBrief(args: BriefArgs): Promise<BriefResult> {
  const raw = await readJson<unknown>(args.tasks);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { tasks?: unknown }).tasks)
      ? (raw as { tasks: unknown[] }).tasks
      : null;

  if (!list) {
    throw new Error("El archivo de tareas debe ser un arreglo o un objeto con la propiedad tasks.");
  }

  const tasks: Task[] = list.map((item, index) => {
    try {
      return TaskSchema.parse(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Tarea ${index + 1} inválida: ${message}`);
    }
  });

  const brief = BriefSchema.parse(
    buildBrief(tasks, {
      team: args.team,
      now: args.now,
      windowDays: args.windowDays,
      stalledAfterDays: args.stalledAfterDays,
    }),
  );

  const outDir = path.join(args.out, `brief-${brief.week}`);
  await writeJson(path.join(outDir, "brief.json"), brief);
  await writeText(path.join(outDir, "brief.md"), renderBriefMarkdown(brief));

  return { outDir, brief };
}
