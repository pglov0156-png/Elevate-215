<script lang="ts">
	import type { Status } from '$lib/types';

	let { status, size = 'md' }: { status: Status | null; size?: 'md' | 'lg' } = $props();
</script>

<span class="badge {status ?? 'none'} {size}">
	<span class="icon" aria-hidden="true">{status === 'on-track' ? '✓' : status === 'off-track' ? '!' : '–'}</span>
	{status === 'on-track' ? 'On Track' : status === 'off-track' ? 'Off Track' : 'No test data'}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 4px 12px 4px 5px;
		border-radius: 999px;
		font-weight: 700;
		font-size: 0.85rem;
		white-space: nowrap;
	}
	.icon {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 800;
	}
	.on-track {
		background: var(--on-soft);
		color: var(--on);
	}
	.on-track .icon {
		background: var(--on);
	}
	.off-track {
		background: var(--off-soft);
		color: var(--off);
	}
	.off-track .icon {
		background: var(--off);
	}
	.none {
		background: var(--none-soft);
		color: var(--none);
	}
	.none .icon {
		background: var(--none);
	}
	.lg {
		padding: 7px 18px 7px 7px;
		font-size: 1.05rem;
		gap: 10px;
	}
	.lg .icon {
		width: 28px;
		height: 28px;
		font-size: 0.95rem;
	}
</style>
