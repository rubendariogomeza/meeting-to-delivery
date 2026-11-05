import { strFromU8, unzipSync } from "fflate";

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Extract plain text from a .docx file without Word: unzip the container and
 * read word/document.xml. Paragraphs become newlines, tabs and breaks are kept.
 */
export function docxToText(buffer: Uint8Array): string {
  const entries = unzipSync(buffer);
  const document = entries["word/document.xml"];
  if (!document) {
    throw new Error("El archivo .docx no contiene word/document.xml.");
  }
  const xml = strFromU8(document);
  const text = xml
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
