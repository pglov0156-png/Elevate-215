import { readFile } from 'node:fs/promises';
import type { Grant, GrantField, Payment, SchoolRecord } from '$lib/v2/types';
import { parseCSV } from '../csv';
import { toCSV, writeFileAtomic } from '../csv-write';
import { statusFor } from '../status';
import type { SchoolRecordRepository } from './repository';

const METRIC_COLUMN = 'Enrollment-Weighted Avg Residual';

const GRANT_COLUMNS: Record<GrantField, string> = {
	agreementTitle: 'agreement_title',
	agreementUrl: 'agreement_url',
	termStart: 'term_start',
	termEnd: 'term_end',
	awardAmount: 'award_amount',
	commitments: 'commitments'
};
const GRANT_HEADERS = ['SchoolNumber', ...Object.values(GRANT_COLUMNS)];
const PAYMENT_HEADERS = ['SchoolNumber', 'payment_date', 'amount', 'memo'];

export interface CsvPaths {
	rollup: string;
	notes: string;
	grants: string;
	payments: string;
}

async function readRows(path: string): Promise<Record<string, string>[]> {
	try {
		return parseCSV(await readFile(path, 'utf8'));
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw e;
	}
}

// Writes are read-modify-write on whole files, so run them one at a time.
let writeQueue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
	const run = writeQueue.then(fn);
	writeQueue = run.catch(() => {});
	return run;
}

function toGrant(row: Record<string, string> | undefined): Grant {
	const amount = row?.award_amount;
	return {
		agreementTitle: row?.agreement_title ?? '',
		agreementUrl: row?.agreement_url ?? '',
		termStart: row?.term_start ?? '',
		termEnd: row?.term_end ?? '',
		awardAmount: amount ? Number(amount) : null,
		commitments: row?.commitments ?? ''
	};
}

export class CsvSchoolRecordRepository implements SchoolRecordRepository {
	constructor(private paths: CsvPaths) {}

	async list(): Promise<SchoolRecord[]> {
		const [rollup, notes, grants, payments] = await Promise.all([
			readRows(this.paths.rollup),
			readRows(this.paths.notes),
			readRows(this.paths.grants),
			readRows(this.paths.payments)
		]);

		const schools = new Map(rollup.map((r) => [r.SchoolNumber, r]));
		const grantBySchool = new Map(grants.map((g) => [g.SchoolNumber, g]));
		const paymentsBySchool = new Map<string, Payment[]>();
		for (const p of payments) {
			const list = paymentsBySchool.get(p.SchoolNumber) ?? [];
			list.push({ date: p.payment_date, amount: Number(p.amount), memo: p.memo });
			paymentsBySchool.set(p.SchoolNumber, list);
		}

		// Keep only the latest visit per school (same rule as v1).
		const latest = new Map<string, Record<string, string>>();
		for (const note of notes) {
			const prev = latest.get(note.SchoolNumber);
			if (!prev || note.visit_date > prev.visit_date) latest.set(note.SchoolNumber, note);
		}

		const records: SchoolRecord[] = [];
		for (const [schoolNumber, note] of latest) {
			const school = schools.get(schoolNumber);
			if (!school) {
				console.warn(`visit-notes: SchoolNumber ${schoolNumber} not found in rollup; skipped`);
				continue;
			}
			const raw = school[METRIC_COLUMN];
			const metricValue = raw === '' || raw === undefined ? null : Number(raw);
			records.push({
				schoolNumber,
				schoolName: school.SchoolName,
				schoolType: school.SchoolType,
				gradeSpan: school['GradeSpan_2025-26'] ?? '',
				metricLabel: METRIC_COLUMN,
				metricValue,
				status: statusFor(metricValue),
				visitDate: note.visit_date,
				notes: note.notes,
				grant: toGrant(grantBySchool.get(schoolNumber)),
				payments: (paymentsBySchool.get(schoolNumber) ?? []).sort((a, b) =>
					b.date.localeCompare(a.date)
				)
			});
		}

		return records.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
	}

	async get(schoolNumber: string): Promise<SchoolRecord | null> {
		return (await this.list()).find((r) => r.schoolNumber === schoolNumber) ?? null;
	}

	updateGrantField(schoolNumber: string, field: GrantField, value: string): Promise<void> {
		return serialized(async () => {
			const rows = await readRows(this.paths.grants);
			let row = rows.find((r) => r.SchoolNumber === schoolNumber);
			if (!row) {
				row = { SchoolNumber: schoolNumber };
				rows.push(row);
			}
			row[GRANT_COLUMNS[field]] = value;
			await writeFileAtomic(this.paths.grants, toCSV(GRANT_HEADERS, rows));
		});
	}

	addPayment(schoolNumber: string, payment: Payment): Promise<void> {
		return serialized(async () => {
			const rows = await readRows(this.paths.payments);
			rows.push({
				SchoolNumber: schoolNumber,
				payment_date: payment.date,
				amount: String(payment.amount),
				memo: payment.memo
			});
			await writeFileAtomic(this.paths.payments, toCSV(PAYMENT_HEADERS, rows));
		});
	}
}
