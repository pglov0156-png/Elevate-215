import { readFile } from 'node:fs/promises';
import type { SchoolStatus } from '$lib/types';
import { parseCSV } from './csv';
import type { SchoolStatusRepository } from './repository';
import { statusFor } from './status';

const METRIC_COLUMN = 'Enrollment-Weighted Avg Residual';

export class CsvSchoolStatusRepository implements SchoolStatusRepository {
	constructor(
		private rollupPath: string,
		private notesPath: string
	) {}

	async list(): Promise<SchoolStatus[]> {
		const [rollupText, notesText] = await Promise.all([
			readFile(this.rollupPath, 'utf8'),
			readFile(this.notesPath, 'utf8')
		]);

		const schools = new Map(parseCSV(rollupText).map((r) => [r.SchoolNumber, r]));

		// Keep only the latest visit per school.
		const latest = new Map<string, Record<string, string>>();
		for (const note of parseCSV(notesText)) {
			const prev = latest.get(note.SchoolNumber);
			if (!prev || note.visit_date > prev.visit_date) latest.set(note.SchoolNumber, note);
		}

		const result: SchoolStatus[] = [];
		for (const [schoolNumber, note] of latest) {
			const school = schools.get(schoolNumber);
			if (!school) {
				console.warn(`visit-notes: SchoolNumber ${schoolNumber} not found in rollup; skipped`);
				continue;
			}
			const raw = school[METRIC_COLUMN];
			const metricValue = raw === '' || raw === undefined ? null : Number(raw);
			result.push({
				schoolNumber,
				schoolName: school.SchoolName,
				metricLabel: METRIC_COLUMN,
				metricValue,
				status: statusFor(metricValue),
				visitDate: note.visit_date,
				notes: note.notes
			});
		}

		return result.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
	}
}
