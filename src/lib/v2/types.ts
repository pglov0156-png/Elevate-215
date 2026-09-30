import type { Status } from '$lib/types';

/** Grant fields that can be filled in from the dashboard ("Insert here"). */
export const GRANT_FIELDS = [
	'agreementTitle',
	'agreementUrl',
	'termStart',
	'termEnd',
	'awardAmount',
	'commitments'
] as const;
export type GrantField = (typeof GRANT_FIELDS)[number];

/** One grant per school. Empty string / null = not provided yet. */
export interface Grant {
	agreementTitle: string;
	agreementUrl: string;
	termStart: string;
	termEnd: string;
	/** What was promised: award amount in dollars. */
	awardAmount: number | null;
	/** What was promised: commitments, one per line. */
	commitments: string;
}

/** What was paid: one row per payment. */
export interface Payment {
	date: string;
	amount: number;
	memo: string;
}

/** The connected record for one school, joined on SchoolNumber. */
export interface SchoolRecord {
	schoolNumber: string;
	schoolName: string;
	schoolType: string;
	gradeSpan: string;
	metricLabel: string;
	/** Enrollment-Weighted Avg Residual; null when the school has no test data. */
	metricValue: number | null;
	/** null when metricValue is null — status is never inferred. */
	status: Status | null;
	visitDate: string;
	/** Renée's original notes, unmodified. */
	notes: string;
	grant: Grant;
	payments: Payment[];
}
