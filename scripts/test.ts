import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.cwd(), "tests");
const files = (await readdir(dir)).filter((file) => file.endsWith(".test.ts")).sort();

if (files.length === 0) {
  console.error("No hay pruebas en tests/.");
  process.exit(1);
}

for (const file of files) {
  await import(pathToFileURL(path.join(dir, file)).href);
}
