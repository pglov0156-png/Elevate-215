import type { Status } from '$lib/types';

/** Grant rule: a school is on track when its enrollment-weighted avg residual is at or above 0. */
export function statusFor(residual: number | null): Status | null {
	if (residual === null) return null;
	return residual >= 0 ? 'on-track' : 'off-track';
}
