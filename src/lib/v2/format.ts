const usd = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 0,
	maximumFractionDigits: 2
});

export const formatMoney = (v: number) => usd.format(v);

export const formatResidual = (v: number) => (v > 0 ? `+${v}` : `${v}`);

/** "2026-09-22" -> "Sep 22, 2026". Parsed as UTC so the day never shifts. */
export function formatDate(iso: string): string {
	const d = new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

export const totalPaid = (payments: { amount: number }[]) =>
	payments.reduce((sum, p) => sum + p.amount, 0);
