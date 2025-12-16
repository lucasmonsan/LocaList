<script lang="ts">
	import CrossIcon from '$lib/icons/CrossIcon.svelte';
	import SearchIcon from '$lib/icons/SearchIcon.svelte';
	import LoadingIcon from '$lib/icons/LoadingIcon.svelte';
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
	<input
		bind:this={inputElement}
		type="text"
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
	/>

	<Button
		variant="ghost"
		onclick={() => searchState.query !== '' && handleClear()}
		type="button"
		disabled={searchState.loading}
		aria-label={searchState.query === '' ? i18n.t.buttons.search : i18n.t.buttons.clear}
	>
		{#if searchState.loading}
			<LoadingIcon />
		{:else if searchState.query === ''}
			<SearchIcon />
		{:else}
			<CrossIcon />
		{/if}
	</Button>
</form>

<style>
	form {
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
			opacity: 0.8;
			pointer-events: none;
		}

		&[data-loading='true'] input {
			border-color: var(--brand-primary);
			background: color-mix(in srgb, var(--brand-primary) 5%, var(--bg));
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
	}
</style>
