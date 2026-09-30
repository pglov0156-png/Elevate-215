import { env } from '$env/dynamic/private';
import { CsvSchoolRecordRepository } from './csv-record-repository';
import type { SchoolRecordRepository } from './repository';

export function getRecordRepository(): SchoolRecordRepository {
	const source = env.DATA_SOURCE ?? 'csv';
	switch (source) {
		case 'csv':
			return new CsvSchoolRecordRepository({
				rollup:
					env.ROLLUP_CSV ??
					'data/Elevate215-School-Data - PHL School Performance Model.xlsx - School Rollup.csv',
				notes: env.NOTES_CSV ?? 'data/visit-notes.csv',
				grants: env.GRANTS_CSV ?? 'data/grants.csv',
				payments: env.PAYMENTS_CSV ?? 'data/payments.csv'
			});
		// case 'db': return new DbSchoolRecordRepository(...)  — added during database migration
		default:
			throw new Error(`Unknown DATA_SOURCE "${source}"`);
	}
}
