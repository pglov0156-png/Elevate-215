<script lang="ts">
	import { page } from '$app/state';
</script>

<main>
	<div class="card">
		<p class="eyebrow">{page.status}</p>
		<h1>{page.error?.message ?? 'Something went wrong.'}</h1>
		<a class="btn primary" href="/v2">← Back to all schools</a>
	</div>
</main>

<style>
	main {
		max-width: 640px;
		margin: 0 auto;
		padding: 48px 16px;
	}
	.card {
		padding: 32px;
	}
	h1 {
		margin: 6px 0 20px;
		font-size: 1.4rem;
	}
</style>
