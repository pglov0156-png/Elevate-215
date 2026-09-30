import type { GrantField, Payment, SchoolRecord } from '$lib/v2/types';

/**
 * The only way v2 reads or writes data. Today: CSV files (csv-record-repository.ts).
 * Later: a database implementation of this same interface (see db/002_grants.sql).
 * Values passed to writes are already validated (validate.ts).
 */
export interface SchoolRecordRepository {
	/** Schools with a Renée visit record, sorted by name. */
	list(): Promise<SchoolRecord[]>;
	/** null when the school has no visit record (or doesn't exist). */
	get(schoolNumber: string): Promise<SchoolRecord | null>;
	updateGrantField(schoolNumber: string, field: GrantField, value: string): Promise<void>;
	addPayment(schoolNumber: string, payment: Payment): Promise<void>;
}
