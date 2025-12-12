<script>
	import CrossIcon from '$lib/icons/CrossIcon.svelte';
	import SearchIcon from '$lib/icons/SearchIcon.svelte';
	import Button from '../ui/Button.svelte';
	import { searchState } from './search.svelte';
</script>

<form onsubmit={(e) => e.preventDefault()}>
	<input
		type="text"
		placeholder="Pesquise no LocaLista..."
		bind:value={searchState.query}
		onfocus={() => (searchState.focused = true)}
		onblur={() => (searchState.focused = false)}
	/>

	<Button variant="ghost" onclick={() => searchState.query !== '' && searchState.clear()}>
		{#if searchState.query === ''}
			<SearchIcon />
		{:else if searchState.query !== ''}
			<CrossIcon />
		{/if}
	</Button>
</form>

<style>
	form {
		overflow: hidden;
		display: flex;
		flex-grow: 1;
		height: var(--xxxl, 3rem);
		padding: 0 var(--xxs, 0.4rem) 0 var(--xs, 0.6rem);
		border-radius: var(--radius-out, 1rem);
		box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
		background: var(--surface, #ffffff);
	}

	input {
		width: 100%;
		height: 100%;
		font-size: var(--sm, 0.875rem);
		font-weight: 600;
		color: var(--text-primary, #101214);
	}
</style>
