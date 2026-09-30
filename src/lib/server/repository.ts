import type { SchoolStatus } from '$lib/types';

/**
 * The only way the app reads school data. Today: CSV files (csv-repository.ts).
 * Later: a database implementation of this same interface (see db/001_init.sql).
 */
export interface SchoolStatusRepository {
	/** Schools that have visit notes, with their metric and status. */
	list(): Promise<SchoolStatus[]>;
}
