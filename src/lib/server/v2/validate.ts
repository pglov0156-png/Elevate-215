import { GRANT_FIELDS, type GrantField, type Payment } from '$lib/v2/types';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_TEXT = 5000;

function isIsoDate(v: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
	const d = new Date(`${v}T00:00:00Z`);
	return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
}

function parseMoney(raw: string): number | null {
	const n = Number(raw.replace(/[$,\s]/g, ''));
	return raw.trim() !== '' && Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Validates and normalizes one grant field. An empty value clears it back to "Insert here". */
export function parseGrantField(
	field: string,
	raw: string
): Result<{ field: GrantField; value: string }> {
	if (!(GRANT_FIELDS as readonly string[]).includes(field)) {
		return { ok: false, error: 'Unknown field.' };
	}
	const f = field as GrantField;
	const value = raw.trim();
	if (value.length > MAX_TEXT) return { ok: false, error: 'That is too long.' };
	if (value === '') return { ok: true, value: { field: f, value } };

	switch (f) {
		case 'agreementUrl': {
			let url: URL;
			try {
				url = new URL(value);
			} catch {
				return { ok: false, error: 'Enter a full link starting with https://' };
			}
			if (url.protocol !== 'https:' && url.protocol !== 'http:') {
				return { ok: false, error: 'Enter a full link starting with https://' };
			}
			return { ok: true, value: { field: f, value: url.toString() } };
		}
		case 'awardAmount': {
			const n = parseMoney(value);
			if (n === null || n < 0) return { ok: false, error: 'Enter a dollar amount, like 150000.' };
			return { ok: true, value: { field: f, value: String(n) } };
		}
		case 'termStart':
		case 'termEnd':
			if (!isIsoDate(value)) return { ok: false, error: 'Enter a date.' };
			return { ok: true, value: { field: f, value } };
		default:
			return { ok: true, value: { field: f, value } };
	}
}

export function parsePayment(form: FormData): Result<Payment> {
	const date = String(form.get('date') ?? '').trim();
	const amount = parseMoney(String(form.get('amount') ?? ''));
	const memo = String(form.get('memo') ?? '').trim();
	if (!isIsoDate(date)) return { ok: false, error: 'Enter the payment date.' };
	if (amount === null || amount <= 0) {
		return { ok: false, error: 'Enter a payment amount greater than $0.' };
	}
	if (memo.length > 500) return { ok: false, error: 'Memo is too long.' };
	return { ok: true, value: { date, amount, memo } };
}
