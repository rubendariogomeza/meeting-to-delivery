const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a",
  "y", "o", "u", "que", "en", "con", "por", "para", "se", "su", "sus", "lo",
  "es", "son", "fue", "ser", "esta", "este", "estos", "estas", "como", "mas",
  "pero", "si", "no", "ya", "hay", "nos", "les", "le", "me", "te", "mi", "tu",
]);

/** Lowercase, strip accents and collapse whitespace. Used for matching only. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function slug(value: string, max = 48): string {
  const base = normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "run").slice(0, max).replace(/-+$/g, "");
}

export function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/[\s,;:.-]+$/, "") + "…";
}

export function words(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

/** Token overlap used to merge near-duplicate tasks. */
export function similarity(a: string, b: string): number {
  const left = new Set(words(a));
  const right = new Set(words(b));
  if (left.size === 0 && right.size === 0) return 1;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  const union = left.size + right.size - shared;
  return union === 0 ? 0 : shared / union;
}

/** Split prose into sentences without breaking on common abbreviations. */
export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export function stripTrailingPunctuation(value: string): string {
  return value.replace(/[\s.;:,]+$/g, "").trim();
}
