import { env } from '$env/dynamic/private';
import { CsvSchoolStatusRepository } from './csv-repository';
import type { SchoolStatusRepository } from './repository';

export function getRepository(): SchoolStatusRepository {
	const source = env.DATA_SOURCE ?? 'csv';
	switch (source) {
		case 'csv':
			return new CsvSchoolStatusRepository(
				env.ROLLUP_CSV ??
					'data/Elevate215-School-Data - PHL School Performance Model.xlsx - School Rollup.csv',
				env.NOTES_CSV ?? 'data/visit-notes.csv'
			);
		// case 'db': return new DbSchoolStatusRepository(...)  — added during database migration
		default:
			throw new Error(`Unknown DATA_SOURCE "${source}"`);
	}
}
