<script lang="ts">
	import { enhance } from '$app/forms';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import type { SchoolStatus } from '$lib/types';
	import EditableField from '$lib/v2/components/EditableField.svelte';
	import ReconcileCard from '$lib/v2/components/ReconcileCard.svelte';
	import StatusBadge from '$lib/v2/components/StatusBadge.svelte';
	import { formatDate, formatMoney, formatResidual, totalPaid } from '$lib/v2/format';
	import type { GrantField } from '$lib/v2/types';

	let { data } = $props();
	const r = $derived(data.record);

	const TABS = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'grant', label: 'Grant' },
		{ id: 'progress', label: 'Progress' },
		{ id: 'notes', label: 'Visit Notes' }
	] as const;
	type TabId = (typeof TABS)[number]['id'];

	const initialTab = page.url.searchParams.get('tab');
	let tab = $state<TabId>(TABS.find((t) => t.id === initialTab)?.id ?? 'overview');
	let editing = $state<GrantField | null>(null);
	let addingPayment = $state(false);
	let paymentError = $state('');
	let savingPayment = $state(false);

	const paid = $derived(totalPaid(r.payments));
	const award = $derived(r.grant.awardAmount);
	const paidPct = $derived(award && award > 0 ? Math.min(100, Math.round((paid / award) * 100)) : null);
	const commitments = $derived(
		r.grant.commitments
			.split('\n')
			.map((c) => c.trim())
			.filter(Boolean)
	);

	// The v1 Reconcile Check card takes v1's SchoolStatus shape.
	const reconcile: SchoolStatus = $derived({
		schoolNumber: r.schoolNumber,
		schoolName: r.schoolName,
		metricLabel: r.metricLabel,
		metricValue: r.metricValue,
		status: r.status,
		visitDate: r.visitDate,
		notes: r.notes
	});

	// Residual scale for the Progress tab; values beyond ±SCALE sit at the ends.
	const SCALE = 30;
	const markerPct = $derived(
		r.metricValue === null
			? null
			: ((Math.max(-SCALE, Math.min(SCALE, r.metricValue)) + SCALE) / (2 * SCALE)) * 100
	);

	/** Switch tabs in place (no navigation); the tab is kept in ?tab= so reloads stay put. */
	async function show(id: TabId, scrollToId?: string) {
		tab = id;
		const url = new URL(page.url);
		if (id === 'overview') url.searchParams.delete('tab');
		else url.searchParams.set('tab', id);
		replaceState(url, {});
		await tick();
		if (scrollToId) document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function onTabKey(e: KeyboardEvent, i: number) {
		const next =
			e.key === 'ArrowRight' ? (i + 1) % TABS.length
			: e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length
			: e.key === 'Home' ? 0
			: e.key === 'End' ? TABS.length - 1
			: null;
		if (next === null) return;
		e.preventDefault();
		show(TABS[next].id);
		document.getElementById(`tab-${TABS[next].id}`)?.focus();
	}

	const field = (f: GrantField) => ({
		field: f,
		editing: editing === f,
		onedit: () => (editing = f),
		ondone: () => (editing = null)
	});

	function addAgreementLink() {
		show('grant', 'agreement');
		editing = 'agreementUrl';
	}
</script>

<svelte:head><title>{r.schoolName} · Reconcile Check</title></svelte:head>

{#snippet backToOverview()}
	<button class="btn ghost back" onclick={() => show('overview')}>← Back to overview</button>
{/snippet}

{#snippet agreementButton(primary: boolean)}
	{#if r.grant.agreementUrl}
		<a class="btn" class:primary href={r.grant.agreementUrl} target="_blank" rel="noopener noreferrer">
			Open grant agreement ↗
		</a>
	{:else}
		<button class="btn" class:primary onclick={addAgreementLink}>Add grant agreement link</button>
	{/if}
{/snippet}

<main>
	<a class="crumb" href="/v2">← All schools</a>

	<header class="head card">
		<div>
			<p class="eyebrow">School record</p>
			<h1>{r.schoolName}</h1>
			<p class="meta">
				SchoolNumber <strong>{r.schoolNumber}</strong>
				{#if r.schoolType}· {r.schoolType}{/if}
				{#if r.gradeSpan}· Grades {r.gradeSpan}{/if}
			</p>
		</div>
		<StatusBadge status={r.status} size="lg" />
	</header>

	<div class="tabs" role="tablist" aria-label="School record sections">
		{#each TABS as t, i (t.id)}
			<button
				id="tab-{t.id}"
				role="tab"
				aria-selected={tab === t.id}
				aria-controls="panel-{t.id}"
				tabindex={tab === t.id ? 0 : -1}
				class:active={tab === t.id}
				onclick={() => show(t.id)}
				onkeydown={(e) => onTabKey(e, i)}>{t.label}</button
			>
		{/each}
	</div>

	{#if tab === 'overview'}
		<div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" class="panel overview">
			<article class="card status-card {r.status ?? 'none'}">
				<p class="eyebrow">Current status</p>
				<StatusBadge status={r.status} size="lg" />
				<p class="big">{r.metricValue === null ? '—' : formatResidual(r.metricValue)}</p>
				<p class="caption">{r.metricLabel}</p>
				{#if r.status === null}
					<p class="note">No test data is available, so no status is shown.</p>
				{/if}
				<button class="btn" onclick={() => show('progress')}>View progress</button>
			</article>

			<article class="card">
				<p class="eyebrow">Grant</p>
				<h2 class:insert-title={!r.grant.agreementTitle}>
					{r.grant.agreementTitle || 'Insert here'}
				</h2>
				<dl class="figures">
					<div>
						<dt>Promised</dt>
						<dd class:insert={award === null}>{award === null ? 'Insert here' : formatMoney(award)}</dd>
					</div>
					<div>
						<dt>Paid</dt>
						<dd class:insert={!r.payments.length}>
							{r.payments.length ? formatMoney(paid) : 'Insert here'}
						</dd>
					</div>
				</dl>
				{#if paidPct !== null}
					<div class="meter" role="img" aria-label="{paidPct}% of promised amount paid">
						<span style="width: {paidPct}%"></span>
					</div>
					<p class="caption">{paidPct}% of promised amount paid</p>
				{/if}
				<div class="row">
					{@render agreementButton(true)}
					<button class="btn" onclick={() => show('grant', 'payments')}>View payments</button>
				</div>
			</article>

			<article class="card">
				<p class="eyebrow">Latest visit</p>
				<h2>{formatDate(r.visitDate)}</h2>
				<p class="caption">Renée's visit notes are kept exactly as written.</p>
				<div class="row">
					<button class="btn" onclick={() => show('notes')}>Read visit notes</button>
				</div>
			</article>
		</div>
	{:else if tab === 'grant'}
		<div id="panel-grant" role="tabpanel" aria-labelledby="tab-grant" class="panel">
			{@render backToOverview()}
			<div class="grant-grid">
				<article class="card section" id="agreement">
					<div class="section-head">
						<h2>Grant agreement</h2>
						{@render agreementButton(false)}
					</div>
					<dl>
						<EditableField {...field('agreementTitle')} label="Agreement" value={r.grant.agreementTitle} />
						<EditableField
							{...field('agreementUrl')}
							label="Agreement link"
							input="url"
							hint="Link to the signed agreement (e.g. a shared drive file)."
							value={r.grant.agreementUrl}
						>
							{#snippet display()}
								<a href={r.grant.agreementUrl} target="_blank" rel="noopener noreferrer">{r.grant.agreementUrl}</a>
							{/snippet}
						</EditableField>
						<EditableField {...field('termStart')} label="Term start" input="date" value={r.grant.termStart}>
							{#snippet display()}{formatDate(r.grant.termStart)}{/snippet}
						</EditableField>
						<EditableField {...field('termEnd')} label="Term end" input="date" value={r.grant.termEnd}>
							{#snippet display()}{formatDate(r.grant.termEnd)}{/snippet}
						</EditableField>
					</dl>
				</article>

				<article class="card section">
					<div class="section-head"><h2>What was promised</h2></div>
					<dl>
						<EditableField
							{...field('awardAmount')}
							label="Award amount"
							input="money"
							value={award === null ? '' : String(award)}
						>
							{#snippet display()}{award === null ? '' : formatMoney(award)}{/snippet}
						</EditableField>
						<EditableField
							{...field('commitments')}
							label="Commitments"
							input="textarea"
							hint="One commitment per line."
							value={r.grant.commitments}
						>
							{#snippet display()}
								<ul class="commitments">
									{#each commitments as c, i (i)}<li>{c}</li>{/each}
								</ul>
							{/snippet}
						</EditableField>
					</dl>
				</article>
			</div>

			<article class="card section" id="payments">
				<div class="section-head">
					<h2>What was paid</h2>
					{#if !addingPayment}
						<button class="btn primary" onclick={() => (addingPayment = true)}>+ Add payment</button>
					{/if}
				</div>

				<dl class="figures three">
					<div>
						<dt>Paid to date</dt>
						<dd class:insert={!r.payments.length}>{r.payments.length ? formatMoney(paid) : 'Insert here'}</dd>
					</div>
					<div>
						<dt>Promised</dt>
						<dd class:insert={award === null}>{award === null ? 'Insert here' : formatMoney(award)}</dd>
					</div>
					<div>
						<dt>Remaining</dt>
						<dd class:insert={award === null}>
							{award === null ? 'Insert here' : formatMoney(Math.max(0, award - paid))}
						</dd>
					</div>
				</dl>
				{#if paidPct !== null}
					<div class="meter" role="img" aria-label="{paidPct}% of promised amount paid">
						<span style="width: {paidPct}%"></span>
					</div>
				{/if}

				{#if addingPayment}
					<form
						class="payment-form"
						method="POST"
						action="?/addPayment"
						use:enhance={() => {
							savingPayment = true;
							paymentError = '';
							return async ({ result, update }) => {
								savingPayment = false;
								if (result.type === 'failure') {
									paymentError = String(result.data?.error ?? 'Could not save. Try again.');
								} else {
									await update();
									addingPayment = false;
								}
							};
						}}
					>
						<label>Date<input name="date" type="date" required /></label>
						<label>Amount<input name="amount" inputmode="decimal" placeholder="$0" required /></label>
						<label class="wide">Memo <span class="optional">(optional)</span><input name="memo" /></label>
						{#if paymentError}<p class="error wide" role="alert">{paymentError}</p>{/if}
						<div class="row wide">
							<button class="btn primary" disabled={savingPayment}>
								{savingPayment ? 'Saving…' : 'Save payment'}
							</button>
							<button
								type="button"
								class="btn ghost"
								onclick={() => {
									addingPayment = false;
									paymentError = '';
								}}>Cancel</button
							>
						</div>
					</form>
				{/if}

				{#if r.payments.length}
					<table>
						<thead><tr><th>Date</th><th class="num">Amount</th><th>Memo</th></tr></thead>
						<tbody>
							{#each r.payments as p, i (i)}
								<tr>
									<td>{formatDate(p.date)}</td>
									<td class="num">{formatMoney(p.amount)}</td>
									<td>{p.memo}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else if !addingPayment}
					<p class="empty-line">
						<span class="insert-chip">Insert here</span> No payments recorded yet.
					</p>
				{/if}
			</article>
		</div>
	{:else if tab === 'progress'}
		<div id="panel-progress" role="tabpanel" aria-labelledby="tab-progress" class="panel">
			{@render backToOverview()}
			<article class="card section progress {r.status ?? 'none'}">
				<p class="eyebrow">Key grant metric</p>
				<h2>{r.metricLabel}</h2>
				<div class="progress-top">
					<p class="big">{r.metricValue === null ? '—' : formatResidual(r.metricValue)}</p>
					<StatusBadge status={r.status} size="lg" />
				</div>

				{#if markerPct !== null}
					<div class="scale" role="img" aria-label="Residual {formatResidual(r.metricValue ?? 0)} on a scale from -{SCALE} to +{SCALE}">
						<div class="track"><span class="zero"></span><span class="marker" style="left: {markerPct}%"></span></div>
						<div class="ticks"><span>−{SCALE}</span><span>0</span><span>+{SCALE}</span></div>
					</div>
					<p class="caption">
						How far the school's proficiency is above or below its predicted proficiency, weighted by
						enrollment. <strong>On Track</strong> when the residual is ≥ 0, <strong>Off Track</strong> when it is &lt; 0.
					</p>
				{:else}
					<p class="note">
						No test data is available for this school, so no On Track or Off Track status is shown.
					</p>
				{/if}
			</article>
		</div>
	{:else}
		<div id="panel-notes" role="tabpanel" aria-labelledby="tab-notes" class="panel">
			{@render backToOverview()}
			<ReconcileCard school={reconcile} />
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 20px 16px 64px;
	}
	.crumb {
		display: inline-block;
		margin-bottom: 14px;
		font-weight: 700;
		text-decoration: none;
		padding: 4px 8px;
		margin-left: -8px;
		border-radius: 8px;
	}
	.crumb:hover {
		background: var(--brand-soft);
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		padding: 22px 24px;
	}
	.head h1 {
		margin: 4px 0;
		font-size: clamp(1.4rem, 3vw, 1.9rem);
	}
	.meta {
		margin: 0;
		color: var(--ink-2);
	}

	.tabs {
		display: flex;
		gap: 4px;
		margin: 20px 0 16px;
		padding: 4px;
		background: #ebe9e3;
		border-radius: 12px;
		overflow-x: auto;
	}
	.tabs button {
		flex: 1 0 auto;
		padding: 10px 16px;
		border: 0;
		border-radius: 9px;
		background: transparent;
		color: var(--ink-2);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			box-shadow 0.15s;
	}
	.tabs button:hover {
		background: rgba(255, 255, 255, 0.6);
		color: var(--ink);
	}
	.tabs button.active {
		background: var(--surface);
		color: var(--brand);
		box-shadow: var(--shadow);
	}

	.panel {
		animation: fade 0.18s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
	}
	.back {
		margin: 0 0 12px -8px;
	}

	.overview {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
		gap: 16px;
	}
	.overview .card,
	.section {
		padding: 22px 24px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.overview h2,
	.section h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.status-card {
		border-top: 5px solid var(--none);
		align-items: flex-start;
	}
	.status-card.on-track {
		border-top-color: var(--on);
		background: linear-gradient(180deg, var(--on-soft), var(--surface) 55%);
	}
	.status-card.off-track {
		border-top-color: var(--off);
		background: linear-gradient(180deg, var(--off-soft), var(--surface) 55%);
	}
	.big {
		margin: 6px 0 0;
		font-size: 2.6rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1;
	}
	.caption {
		margin: 0;
		color: var(--muted);
		font-size: 0.88rem;
	}
	.note {
		margin: 4px 0 0;
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--none-soft);
		color: var(--ink-2);
		font-size: 0.9rem;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: auto;
		padding-top: 10px;
	}
	.insert-title,
	dd.insert {
		color: var(--muted);
		font-style: italic;
		font-weight: 500;
	}

	.figures {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin: 6px 0;
	}
	.figures.three {
		grid-template-columns: repeat(3, 1fr);
	}
	.figures dt {
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.figures dd {
		margin: 2px 0 0;
		font-size: 1.25rem;
		font-weight: 800;
	}
	.meter {
		height: 10px;
		border-radius: 999px;
		background: var(--none-soft);
		overflow: hidden;
	}
	.meter span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--brand), color-mix(in srgb, var(--brand) 70%, var(--accent)));
		transition: width 0.4s ease-out;
	}

	.grant-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
		gap: 16px;
		margin-bottom: 16px;
	}
	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 4px;
	}
	.section dl {
		margin: 0;
	}
	.commitments {
		margin: 0;
		padding-left: 18px;
	}
	.commitments li + li {
		margin-top: 4px;
	}

	.payment-form {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin: 12px 0;
		padding: 16px;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface-2);
	}
	.payment-form label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.85rem;
		font-weight: 700;
	}
	.payment-form .wide {
		grid-column: 1 / -1;
	}
	.optional {
		color: var(--muted);
		font-weight: 500;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 12px;
		font-size: 0.95rem;
	}
	th {
		text-align: left;
		color: var(--muted);
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 8px 10px;
		border-bottom: 1px solid var(--line);
	}
	td {
		padding: 10px;
		border-bottom: 1px solid var(--line);
	}
	tbody tr:hover {
		background: var(--surface-2);
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.empty-line {
		margin: 12px 0 0;
		color: var(--muted);
	}
	.insert-chip {
		font-style: italic;
		padding: 2px 10px;
		border: 1px dashed #cfccc3;
		border-radius: 8px;
		background: var(--surface-2);
		margin-right: 6px;
	}

	.progress-top {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		margin: 6px 0 10px;
	}
	.progress-top .big {
		margin: 0;
	}
	.scale {
		margin: 8px 0 4px;
	}
	.track {
		position: relative;
		height: 14px;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--off-soft) 50%, var(--on-soft) 50%);
	}
	.zero {
		position: absolute;
		left: 50%;
		top: -4px;
		bottom: -4px;
		width: 2px;
		background: var(--ink-2);
	}
	.marker {
		position: absolute;
		top: 50%;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		border: 3px solid #fff;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
		background: var(--none);
	}
	.progress.on-track .marker {
		background: var(--on);
	}
	.progress.off-track .marker {
		background: var(--off);
	}
	.ticks {
		display: flex;
		justify-content: space-between;
		margin-top: 6px;
		color: var(--muted);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 520px) {
		.tabs {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 640px) {
		.figures.three {
			grid-template-columns: 1fr 1fr;
		}
		.payment-form {
			grid-template-columns: 1fr;
		}
	}
</style>
