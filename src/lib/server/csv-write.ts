import { rename, writeFile } from 'node:fs/promises';

const escape = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Serialize rows to CSV that parseCSV (csv.ts) reads back identically. */
export function toCSV(headers: string[], rows: Record<string, string>[]): string {
	const lines = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ''))];
	return lines.map((l) => l.map(escape).join(',')).join('\n') + '\n';
}

/** Write via temp file + rename so a crash never leaves a half-written CSV. */
export async function writeFileAtomic(path: string, text: string): Promise<void> {
	const tmp = `${path}.tmp`;
	await writeFile(tmp, text, 'utf8');
	await rename(tmp, path);
}
