export interface EmailParts {
  from: string;
  to: string[];
  subject: string;
  body: string;
  date?: Date;
  replyTo?: string;
}

function encodeHeader(value: string): string {
  // RFC 2047 keeps accents and Spanish punctuation intact in the subject.
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(value: string): string {
  return value.replace(/.{1,76}/g, (chunk) => `${chunk}\r\n`).trimEnd();
}

/** Build a standards-compliant .eml file. Nothing is sent from here. */
export function buildEml(parts: EmailParts): string {
  const date = (parts.date ?? new Date()).toUTCString();
  const body = wrapBase64(Buffer.from(parts.body, "utf8").toString("base64"));
  const lines = [
    `From: ${parts.from}`,
    `To: ${parts.to.join(", ")}`,
    `Subject: ${encodeHeader(parts.subject)}`,
    `Date: ${date}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
  ];
  if (parts.replyTo) lines.push(`Reply-To: ${parts.replyTo}`);
  return `${lines.join("\r\n")}\r\n\r\n${body}\r\n`;
}
