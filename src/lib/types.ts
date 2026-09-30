export type Status = 'on-track' | 'off-track';

/** One school as shown on the page: key grant metric, status, and Renée's notes. */
export interface SchoolStatus {
	schoolNumber: string;
	schoolName: string;
	metricLabel: string;
	/** null when the school has no test data for the metric. */
	metricValue: number | null;
	/** null when metricValue is null. */
	status: Status | null;
	visitDate: string;
	/** Renée's original notes, unmodified. */
	notes: string;
}
