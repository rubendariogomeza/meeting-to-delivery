import type { Brief, Task } from "../core/schemas.js";
import { addDays, daysBetween, toIsoDate, weekKey } from "../core/dates.js";

export interface BriefOptions {
  team: string;
  now: Date;
  windowDays?: number;
  stalledAfterDays?: number;
}

function dateOf(value: string): string {
  return value.slice(0, 10);
}

function lastChange(task: Task): string {
  const history = [...task.history].sort((a, b) => a.at.localeCompare(b.at));
  const historyLast = history.length > 0 ? history[history.length - 1].at : "";
  // updatedAt wins when it is newer: a task can move without a status change.
  return [task.updatedAt, historyLast].filter(Boolean).sort().at(-1) ?? task.updatedAt;
}

function statusBefore(task: Task, at: string): Task["status"] {
  const history = [...task.history].sort((a, b) => a.at.localeCompare(b.at));
  let previous: Task["status"] = "abierta";
  for (const entry of history) {
    if (entry.at >= at) break;
    previous = entry.status;
  }
  return previous;
}

export function buildBrief(tasks: Task[], options: BriefOptions): Brief {
  const windowDays = options.windowDays ?? 7;
  const stalledAfter = options.stalledAfterDays ?? 14;
  const todayIso = toIsoDate(options.now);
  const fromIso = toIsoDate(addDays(options.now, -windowDays));
  const openTasks = tasks.filter((task) => task.status !== "cerrada");

  const moved = tasks
    .map((task) => {
      const history = [...task.history]
        .sort((a, b) => a.at.localeCompare(b.at))
        .filter((entry) => dateOf(entry.at) >= fromIso && dateOf(entry.at) <= todayIso);
      const last = history[history.length - 1];
      if (!last) return null;
      const from = statusBefore(task, last.at);
      if (from === last.status) return null;
      return {
        id: task.id,
        summary: task.summary,
        owner: task.owner.name,
        from,
        to: last.status,
        changedAt: last.at,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));

  const stalled = openTasks
    .map((task) => {
      const days = daysBetween(dateOf(lastChange(task)), todayIso);
      return { id: task.id, summary: task.summary, owner: task.owner.name, days, status: task.status };
    })
    .filter((entry) => entry.days > stalledAfter)
    .sort((a, b) => b.days - a.days);

  const decisions: Brief["decisions"] = [];
  const seen = new Set<string>();
  const pushDecision = (task: Task, reason: string): void => {
    if (seen.has(task.id)) return;
    seen.add(task.id);
    decisions.push({
      id: task.id,
      summary: task.summary,
      reason,
      owner: task.owner.name,
      due: task.due.date,
    });
  };

  for (const task of openTasks) {
    if (task.owner.name === "sin asignar") pushDecision(task, "sin responsable");
  }
  for (const task of openTasks) {
    if (task.due.date && task.due.date < todayIso) {
      pushDecision(task, `vencida hace ${daysBetween(task.due.date, todayIso)} días`);
    }
  }
  for (const task of openTasks) {
    if (task.status === "bloqueada") {
      const days = daysBetween(dateOf(lastChange(task)), todayIso);
      if (days >= 7) pushDecision(task, `bloqueada hace ${days} días`);
    }
  }

  const risks: Brief["risks"] = [];
  const byOwner = new Map<string, number>();
  for (const task of openTasks) {
    if (task.owner.name === "sin asignar") continue;
    byOwner.set(task.owner.name, (byOwner.get(task.owner.name) ?? 0) + 1);
  }
  const top = [...byOwner.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && openTasks.length >= 5 && top[1] / openTasks.length >= 0.4) {
    risks.push({
      kind: "Concentración",
      description: `${top[0]} tiene ${top[1]} de ${openTasks.length} tareas abiertas (${Math.round((top[1] / openTasks.length) * 100)} %).`,
      evidence: `Recuento por responsable sobre ${openTasks.length} tareas abiertas.`,
    });
  }

  const overdue = openTasks.filter((task) => task.due.date && task.due.date < todayIso).length;
  if (overdue >= 3 && overdue / Math.max(openTasks.length, 1) > 0.2) {
    risks.push({
      kind: "Plazos",
      description: `${overdue} de ${openTasks.length} tareas abiertas están vencidas.`,
      evidence: "Fecha objetivo anterior a hoy y estado distinto de cerrada.",
    });
  }

  const stalledCount = stalled.length;
  if (stalledCount >= 4 && stalledCount / Math.max(openTasks.length, 1) > 0.3) {
    risks.push({
      kind: "Estancamiento",
      description: `${stalledCount} tareas llevan más de ${stalledAfter} días sin movimiento.`,
      evidence: "Última actualización o cambio de estado anterior al umbral configurado.",
    });
  }

  const unassigned = openTasks.filter((task) => task.owner.name === "sin asignar").length;
  if (unassigned >= 3) {
    risks.push({
      kind: "Propiedad",
      description: `${unassigned} tareas abiertas no tienen responsable.`,
      evidence: "Campo owner igual a \"sin asignar\".",
    });
  }

  return {
    week: weekKey(options.now),
    team: options.team,
    generatedAt: options.now.toISOString(),
    window: { from: fromIso, to: todayIso },
    counts: {
      total: tasks.length,
      open: openTasks.length,
      closed: tasks.length - openTasks.length,
      stalled: stalledCount,
      unassigned,
      overdue,
    },
    moved,
    stalled,
    decisions,
    risks,
  };
}
