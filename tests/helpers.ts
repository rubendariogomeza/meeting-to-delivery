import { readFile } from "node:fs/promises";
import path from "node:path";
import { AttendeeSchema, TaskSchema } from "../src/core/schemas.js";

export const root = process.cwd();

export async function loadAttendees() {
  const raw = JSON.parse(await readFile(path.join(root, "fixtures", "attendees.json"), "utf8"));
  return AttendeeSchema.array().parse(raw);
}

export async function loadSeedTasks() {
  const raw = JSON.parse(await readFile(path.join(root, "fixtures", "history", "tasks.json"), "utf8"));
  return TaskSchema.array().parse(raw);
}
