import type { Attendee, Owner } from "../core/schemas.js";
import { normalize } from "../core/text.js";

export const UNASSIGNED = "sin asignar";

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function ownerAliases(attendee: Attendee): string[] {
  const aliases = new Set<string>();
  const full = normalize(attendee.name);
  aliases.add(full);
  const parts = full.split(" ").filter(Boolean);
  if (parts.length > 1 && parts[0].length > 2) aliases.add(parts[0]);
  for (const alias of attendee.aliases) {
    const clean = normalize(alias);
    if (clean.length > 2) aliases.add(clean);
  }
  return [...aliases].sort((a, b) => b.length - a.length);
}

export interface OwnerHit {
  attendee: Attendee;
  alias: string;
  index: number;
}

/** Find attendee mentions in a sentence, earliest first. */
export function findOwnerMentions(sentence: string, attendees: Attendee[]): OwnerHit[] {
  const plain = normalize(sentence);
  const hits: OwnerHit[] = [];

  for (const attendee of attendees) {
    for (const alias of ownerAliases(attendee)) {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`, "g");
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(plain)) !== null) {
        hits.push({ attendee, alias, index: match.index + match[1].length });
      }
    }
  }

  hits.sort((a, b) => a.index - b.index || b.alias.length - a.alias.length);
  return hits;
}

function asOwner(attendee: Attendee): Owner {
  return { name: attendee.name, email: attendee.email ?? null };
}

export interface OwnerResolution {
  owner: Owner;
  matched: boolean;
}

/**
 * Resolve the owner of a sentence. Self-reference wins ("yo me encargo"),
 * then the first attendee mentioned. Never guesses a name that is not in the
 * attendee list: returns "sin asignar" instead.
 */
export function resolveOwner(
  sentence: string,
  speaker: string,
  attendees: Attendee[],
): OwnerResolution {
  const plain = normalize(sentence);

  if (/\b(yo me encargo|me encargo|lo hago yo|yo lo hago|yo reviso|yo preparo)\b/.test(plain)) {
    const self = attendees.find((a) => normalize(a.name) === normalize(speaker));
    return { owner: self ? asOwner(self) : { name: speaker, email: null }, matched: true };
  }

  const mentions = findOwnerMentions(sentence, attendees);
  if (mentions.length > 0) {
    return { owner: asOwner(mentions[0].attendee), matched: true };
  }

  return { owner: { name: UNASSIGNED, email: null }, matched: false };
}
