import { error, fail } from '@sveltejs/kit';
import { getRecordRepository } from '$lib/server/v2';
import { parseGrantField, parsePayment } from '$lib/server/v2/validate';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const record = await getRecordRepository().get(params.schoolNumber);
	if (!record) error(404, 'No visit record for this school.');
	return { record };
};

async function requireRecord(schoolNumber: string) {
	const repo = getRecordRepository();
	if (!(await repo.get(schoolNumber))) error(404, 'No visit record for this school.');
	return repo;
}

export const actions: Actions = {
	saveGrant: async ({ params, request }) => {
		const repo = await requireRecord(params.schoolNumber);
		const form = await request.formData();
		const parsed = parseGrantField(String(form.get('field') ?? ''), String(form.get('value') ?? ''));
		if (!parsed.ok) return fail(400, { error: parsed.error });
		await repo.updateGrantField(params.schoolNumber, parsed.value.field, parsed.value.value);
		return { saved: parsed.value.field };
	},
	addPayment: async ({ params, request }) => {
		const repo = await requireRecord(params.schoolNumber);
		const parsed = parsePayment(await request.formData());
		if (!parsed.ok) return fail(400, { error: parsed.error });
		await repo.addPayment(params.schoolNumber, parsed.value);
		return { paymentAdded: true };
	}
};
