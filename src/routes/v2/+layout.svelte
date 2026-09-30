<script lang="ts">
	import '$lib/v2/theme.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
	/>
</svelte:head>

<div class="v2">
	<header class="topbar">
		<a class="brand" href="/v2">
			<span class="mark" aria-hidden="true">E</span>
			<span>Elevate 215 <span class="product">Reconcile Check</span></span>
		</a>
	</header>
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
	}
	.topbar {
		background: var(--surface);
		border-bottom: 1px solid var(--line);
		padding: 12px 16px;
	}
	.brand {
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--ink);
		font-weight: 800;
		text-decoration: none;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 9px;
		background: var(--brand);
		color: #fff;
		box-shadow: inset 0 -3px 0 var(--accent);
	}
	.product {
		color: var(--muted);
		font-weight: 600;
		margin-left: 4px;
	}
</style>
