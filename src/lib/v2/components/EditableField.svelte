<script lang="ts">
	import { enhance } from '$app/forms';
	import type { GrantField } from '$lib/v2/types';
	import type { Snippet } from 'svelte';

	let {
		field,
		label,
		value,
		input = 'text',
		hint = '',
		editing,
		onedit,
		ondone,
		display
	}: {
		field: GrantField;
		label: string;
		/** Raw stored value; empty = "Insert here". */
		value: string;
		input?: 'text' | 'url' | 'money' | 'date' | 'textarea';
		hint?: string;
		editing: boolean;
		onedit: () => void;
		ondone: () => void;
		display?: Snippet;
	} = $props();

	let error = $state('');
	let saving = $state(false);

	const focus = (node: HTMLElement) => node.focus();
</script>

<div class="field">
	<dt>{label}</dt>
	<dd>
		{#if editing}
			<form
				method="POST"
				action="?/saveGrant"
				use:enhance={() => {
					saving = true;
					error = '';
					return async ({ result, update }) => {
						saving = false;
						if (result.type === 'failure') {
							error = String(result.data?.error ?? 'Could not save. Try again.');
						} else {
							await update({ reset: false });
							ondone();
						}
					};
				}}
			>
				<input type="hidden" name="field" value={field} />
				{#if input === 'textarea'}
					<textarea name="value" rows="4" aria-label={label} use:focus>{value}</textarea>
				{:else}
					<input
						name="value"
						type={input === 'money' ? 'text' : input}
						inputmode={input === 'money' ? 'decimal' : undefined}
						placeholder={input === 'url' ? 'https://' : input === 'money' ? '$0' : ''}
						aria-label={label}
						{value}
						use:focus
					/>
				{/if}
				{#if hint}<p class="hint">{hint}</p>{/if}
				{#if error}<p class="error" role="alert">{error}</p>{/if}
				<div class="actions">
					<button class="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
					<button
						type="button"
						class="btn ghost"
						onclick={() => {
							error = '';
							ondone();
						}}>Cancel</button
					>
				</div>
			</form>
		{:else if value}
			<div class="value">
				{#if display}{@render display()}{:else}{value}{/if}
			</div>
			<button class="edit" onclick={onedit} aria-label="Edit {label}">Edit</button>
		{:else}
			<span class="insert">Insert here</span>
			<button class="add" onclick={onedit} aria-label="Add {label}">+ Add</button>
		{/if}
	</dd>
</div>

<style>
	.field {
		padding: 14px 0;
		border-top: 1px solid var(--line);
	}
	.field:first-child {
		border-top: 0;
	}
	dt {
		color: var(--muted);
		font-size: 0.82rem;
		font-weight: 600;
		margin-bottom: 4px;
	}
	dd {
		margin: 0;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	form {
		width: 100%;
	}
	.value {
		font-weight: 600;
		white-space: pre-wrap;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.insert {
		color: var(--muted);
		font-style: italic;
		padding: 2px 10px;
		border: 1px dashed #cfccc3;
		border-radius: 8px;
		background: var(--surface-2);
	}
	.add,
	.edit {
		border: 0;
		background: none;
		padding: 2px 6px;
		border-radius: 6px;
		color: var(--brand);
		font: inherit;
		font-size: 0.88rem;
		font-weight: 700;
		cursor: pointer;
	}
	.add:hover,
	.edit:hover {
		background: var(--brand-soft);
	}
	.hint {
		margin: 6px 0 0;
		color: var(--muted);
		font-size: 0.82rem;
	}
	.actions {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}
</style>
