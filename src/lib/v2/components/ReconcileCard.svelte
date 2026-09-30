<!--
	The v1 Reconcile Check card (src/routes/+page.svelte), copied as-is for the v2 Visit Notes tab.
	v1 stays separate at "/"; keep the two in sync by hand until they are merged.
-->
<script lang="ts">
	import type { SchoolStatus } from '$lib/types';

	let { school }: { school: SchoolStatus } = $props();

	const formatMetric = (v: number) => (v > 0 ? `+${v}` : `${v}`);
</script>

<section class="school {school.status ?? 'none'}">
	<div class="status">
		<h2>{school.schoolName}</h2>
		<p class="metric">
			{school.metricLabel}:
			<strong>{school.metricValue === null ? '—' : formatMetric(school.metricValue)}</strong>
		</p>
		<span class="badge">
			{school.status === 'on-track'
				? 'On-track'
				: school.status === 'off-track'
					? 'Off-track'
					: 'No test data'}
		</span>
	</div>
	<div class="notes">
		<p class="label">Renée's visit notes{school.visitDate ? ` · ${school.visitDate}` : ''}</p>
		<p class="text">{school.notes}</p>
	</div>
</section>

<style>
	.school {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
		background: #fff;
		border: 1px solid #dde1e7;
		border-left: 6px solid #9aa1ad;
		border-radius: 10px;
		margin-bottom: 16px;
	}
	.school.on-track {
		border-left-color: #1f7a4a;
	}
	.school.off-track {
		border-left-color: #b3261e;
	}
	.status,
	.notes {
		padding: 16px 20px;
	}
	.status {
		border-right: 1px solid #dde1e7;
	}
	h2 {
		margin: 0 0 6px;
		font-size: 1.15rem;
	}
	.metric {
		margin: 0 0 10px;
	}
	.badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 6px;
		font-weight: 700;
		font-size: 0.85rem;
		text-transform: uppercase;
		background: #eceef1;
		color: #5d6675;
	}
	.on-track .badge {
		background: #e3f4ea;
		color: #1f7a4a;
	}
	.off-track .badge {
		background: #fbe7e5;
		color: #b3261e;
	}
	.label {
		margin: 0;
		color: #5d6675;
		font-size: 0.85rem;
	}
	.text {
		margin: 4px 0 0;
		white-space: pre-wrap;
	}
	@media (max-width: 640px) {
		.school {
			grid-template-columns: 1fr;
		}
		.status {
			border-right: 0;
			border-bottom: 1px solid #dde1e7;
		}
	}
</style>
