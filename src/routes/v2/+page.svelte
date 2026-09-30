<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import StatusBadge from '$lib/v2/components/StatusBadge.svelte';
	import { formatDate, formatMoney, formatResidual, totalPaid } from '$lib/v2/format';

	let { data } = $props();

	let query = $state(page.url.searchParams.get('q') ?? '');

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return data.schools;
		return data.schools.filter(
			(s) => s.schoolName.toLowerCase().includes(q) || s.schoolNumber.includes(q)
		);
	});

	// Keep the search in the URL so the browser Back button returns to the same results.
	function syncUrl() {
		const url = new URL(page.url);
		if (query.trim()) url.searchParams.set('q', query.trim());
		else url.searchParams.delete('q');
		replaceState(url, {});
	}
</script>

<svelte:head><title>Schools · Reconcile Check</title></svelte:head>

<main>
	<div class="intro">
		<p class="eyebrow">School records</p>
		<h1>Where each school stands</h1>
		<p class="sub">Schools with a visit record from Renée. Open a school to see its grant, payments, progress and visit notes.</p>
	</div>

	<form class="search" role="search" onsubmit={(e) => e.preventDefault()}>
		<label for="q">Search for a school</label>
		<div class="search-row">
			<input
				id="q"
				type="search"
				placeholder="School name or SchoolNumber"
				autocomplete="off"
				bind:value={query}
				oninput={syncUrl}
			/>
			{#if query}
				<button
					type="button"
					class="btn ghost"
					onclick={() => {
						query = '';
						syncUrl();
					}}>Clear</button
				>
			{/if}
		</div>
	</form>

	{#if results.length}
		<ul class="grid">
			{#each results as s (s.schoolNumber)}
				{@const paid = totalPaid(s.payments)}
				<li>
					<a class="card school {s.status ?? 'none'}" href="/v2/{s.schoolNumber}">
						<div class="top">
							<div>
								<h2>{s.schoolName}</h2>
								<p class="meta">SchoolNumber {s.schoolNumber}</p>
							</div>
							<StatusBadge status={s.status} />
						</div>
						<dl>
							<div>
								<dt>Residual</dt>
								<dd>{s.metricValue === null ? '—' : formatResidual(s.metricValue)}</dd>
							</div>
							<div>
								<dt>Promised</dt>
								<dd class:insert={s.grant.awardAmount === null}>
									{s.grant.awardAmount === null ? 'Insert here' : formatMoney(s.grant.awardAmount)}
								</dd>
							</div>
							<div>
								<dt>Paid</dt>
								<dd class:insert={!s.payments.length}>
									{s.payments.length ? formatMoney(paid) : 'Insert here'}
								</dd>
							</div>
						</dl>
						<p class="foot">
							Last visit {formatDate(s.visitDate)}
							<span class="open" aria-hidden="true">Open record →</span>
						</p>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="card empty">
			{#if data.schools.length}
				<p>No schools match “{query}”.</p>
				<button
					class="btn"
					onclick={() => {
						query = '';
						syncUrl();
					}}>Clear search</button
				>
			{:else}
				<p>No visit records yet. Schools appear here once Renée adds a visit to <code>data/visit-notes.csv</code>.</p>
			{/if}
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 32px 16px 64px;
	}
	.intro h1 {
		margin: 4px 0 6px;
		font-size: clamp(1.6rem, 3vw, 2.1rem);
	}
	.sub {
		margin: 0;
		color: var(--ink-2);
		max-width: 60ch;
	}
	.search {
		margin: 24px 0;
		max-width: 520px;
	}
	.search label {
		display: block;
		font-weight: 700;
		font-size: 0.9rem;
		margin-bottom: 6px;
	}
	.search-row {
		display: flex;
		gap: 8px;
	}
	.search input {
		padding: 11px 14px;
		font-size: 1rem;
	}
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
		gap: 16px;
	}
	.school {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 18px 20px;
		color: inherit;
		text-decoration: none;
		border-top: 4px solid var(--none);
		transition:
			transform 0.15s,
			box-shadow 0.15s;
	}
	.school.on-track {
		border-top-color: var(--on);
	}
	.school.off-track {
		border-top-color: var(--off);
	}
	.school:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-hover);
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.meta {
		margin: 2px 0 0;
		color: var(--muted);
		font-size: 0.85rem;
	}
	dl {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin: 16px 0;
	}
	dt {
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	dd {
		margin: 2px 0 0;
		font-weight: 700;
	}
	dd.insert {
		color: var(--muted);
		font-weight: 500;
		font-style: italic;
	}
	.foot {
		margin: auto 0 0;
		padding-top: 12px;
		border-top: 1px solid var(--line);
		display: flex;
		justify-content: space-between;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.open {
		color: var(--brand);
		font-weight: 700;
		opacity: 0;
		transform: translateX(-4px);
		transition:
			opacity 0.15s,
			transform 0.15s;
	}
	.school:hover .open,
	.school:focus-visible .open {
		opacity: 1;
		transform: none;
	}
	.empty {
		padding: 32px;
		text-align: center;
		color: var(--ink-2);
	}
</style>
