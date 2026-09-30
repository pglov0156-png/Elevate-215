import { getRepository } from '$lib/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { schools: await getRepository().list() };
};
