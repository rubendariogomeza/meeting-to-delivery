import { normalize } from "./text.js";
import type { Due } from "./schemas.js";

const MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11,
};

const WEEKDAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};

export const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseIsoDate(fromIso).getTime();
  const to = parseIsoDate(toIso).getTime();
  return Math.round((to - from) / 86_400_000);
}

/** Monday of the week containing `date`, at 00:00 UTC. */
export function startOfWeek(date: Date): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + delta);
  return copy;
}

/** ISO-8601 week key, e.g. 2026-W45. */
export function weekKey(date: Date): string {
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = thursday.getUTCDay() || 7;
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Extract a due date from Spanish prose. Returns null when the text says
 * nothing dateable; callers must not invent a date.
 */
export function parseDateExpression(text: string, base: Date): Due | null {
  const raw = text.trim();
  if (!raw) return null;
  const plain = normalize(raw);

  const iso = plain.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const [, y, m, d] = iso;
    return { date: `${y}-${m}-${d}`, raw: iso[0] };
  }

  const today = plain.match(/\b(hoy|al final del dia|antes de terminar el dia)\b/);
  if (today) {
    return { date: toIsoDate(base), raw: today[0] };
  }
  const tomorrow = plain.match(/\bmanana\b/);
  if (tomorrow) {
    return { date: toIsoDate(addDays(base, 1)), raw: tomorrow[0] };
  }

  const dayMonth = plain.match(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/);
  if (dayMonth) {
    const day = Number(dayMonth[1]);
    const month = MONTHS[dayMonth[2]];
    let year = base.getUTCFullYear();
    const candidate = new Date(Date.UTC(year, month, day));
    if (candidate.getTime() < base.getTime() - 86_400_000 * 180) year += 1;
    return { date: toIsoDate(new Date(Date.UTC(year, month, day))), raw: dayMonth[0] };
  }

  const thisWeek = plain.match(/\besta semana\b/);
  if (thisWeek) {
    const monday = startOfWeek(base);
    return { date: toIsoDate(addDays(monday, 4)), raw: thisWeek[0] };
  }
  const nextWeek = plain.match(/\b(la )?(proxima|siguiente) semana\b/);
  if (nextWeek) {
    const monday = startOfWeek(addDays(base, 7));
    return { date: toIsoDate(addDays(monday, 4)), raw: nextWeek[0] };
  }

  const weekday = plain.match(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/);
  if (weekday) {
    const target = WEEKDAYS[weekday[1]];
    const current = base.getUTCDay();
    let delta = (target - current + 7) % 7;
    if (delta === 0) delta = 7;
    return { date: toIsoDate(addDays(base, delta)), raw: weekday[0] };
  }

  return null;
}

export function formatSpanishDate(iso: string): string {
  const date = parseIsoDate(iso);
  return `${date.getUTCDate()} de ${MONTH_NAMES[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

export function monthNumber(name: string): number | null {
  const key = normalize(name);
  return key in MONTHS ? MONTHS[key] : null;
}
