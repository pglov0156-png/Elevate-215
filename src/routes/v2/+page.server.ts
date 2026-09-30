import { getRecordRepository } from '$lib/server/v2';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { schools: await getRecordRepository().list() };
};
