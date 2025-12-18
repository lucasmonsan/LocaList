<script lang="ts">
	import { X, Search, Loader2 } from 'lucide-svelte';
	import Button from '../ui/Button.svelte';
	import { searchState } from './search.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';

	let inputElement: HTMLInputElement | undefined = $state();

	function handleClear() {
		searchState.clear();
		inputElement?.focus();
	}

	function handleSubmit() {
		inputElement?.blur();
		searchState.search();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (searchState.results.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				searchState.navigateDown();
				break;
			case 'ArrowUp':
				e.preventDefault();
				searchState.navigateUp();
				break;
			case 'Enter':
				if (searchState.focusedIndex >= 0) {
					e.preventDefault();
					searchState.selectFocused();
				}
				break;
			case 'Escape':
				e.preventDefault();
				searchState.closeResults();
				inputElement?.blur();
				break;
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	data-loading={searchState.loading}
>
	{#if searchState.loading}
		<div class="progress-bar shimmer" role="progressbar" aria-label={i18n.t.a11y?.loading || 'Carregando'} aria-busy="true"></div>
	{/if}

	<input
		bind:this={inputElement}
		type="text"
		role="combobox"
		placeholder={i18n.t.search.placeholder}
		bind:value={searchState.query}
		oninput={(e) => searchState.setQuery(e.currentTarget.value)}
		onkeydown={handleKeydown}
		onfocus={() => (searchState.focused = true)}
		onblur={() => (searchState.focused = false)}
		disabled={searchState.loading}
		aria-label={i18n.t.buttons.search}
		aria-autocomplete="list"
		aria-controls="search-results"
		aria-expanded={searchState.focused && (searchState.results.length > 0 || searchState.hasSearched)}
		aria-activedescendant={searchState.focusedIndex >= 0 ? `result-${searchState.focusedIndex}` : undefined}
	/>

	<Button
		variant="ghost"
		invisible={searchState.query === ''}
		onclick={() => searchState.query !== '' && handleClear()}
		type="button"
		disabled={searchState.loading}
		aria-label={searchState.loading ? i18n.t.a11y?.loading || 'Carregando' : searchState.query === '' ? i18n.t.buttons.search : i18n.t.buttons.clear}
		aria-busy={searchState.loading}
	>
		{#if searchState.loading}
			<div class="animate-spin" style="display: flex;" aria-hidden="true">
				<Loader2 size={18} />
			</div>
		{:else if searchState.query === ''}
			<Search size={18} />
		{:else}
			<X size={18} />
		{/if}
	</Button>
</form>

<style>
	form {
		position: relative;
		overflow: hidden;
		display: flex;
		flex-grow: 1;
		height: var(--xxxl);
		padding: 0 var(--xxs) 0 var(--xs);
		border-radius: var(--radius-out);
		box-shadow: var(--shadow-md);
		background: var(--surface);
		transition: all var(--fast);

		&:focus-within {
			box-shadow: var(--shadow-lg);
		}

		&[data-loading='true'] {
			box-shadow:
				0 0 0 2px var(--brand-primary),
				var(--shadow-lg);
		}
	}

	.progress-bar {
		position: absolute;
		top: 0;
		left: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-secondary) 50%, var(--brand-primary) 100%);
		background-size: 200% 100%;
		animation: progress 1.5s ease-in-out infinite, shimmer 1.5s ease-in-out infinite;
		border-radius: var(--radius-out) var(--radius-out) 0 0;
	}

	@keyframes progress {
		0% {
			width: 0%;
			left: 0;
		}
		50% {
			width: 70%;
			left: 15%;
		}
		100% {
			width: 0%;
			left: 100%;
		}
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	input {
		width: 100%;
		height: 100%;
		font-size: var(--sm);
		font-weight: 600;
		color: var(--text-primary);
		background: transparent;
		transition: all var(--fast);
	}

	input:disabled {
		cursor: wait;
		opacity: 0.7;
	}
</style>
