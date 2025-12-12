<script>
	import { searchState } from '$lib/components/search/search.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchBar from '$lib/components/search/SearchBar.svelte';
	import SearchHints from '$lib/components/search/SearchHints.svelte';
	import GPSIcon from '$lib/icons/GPSIcon.svelte';
	import ProfileIcon from '$lib/icons/ProfileIcon.svelte';

	let showHints = $derived(searchState.focused || searchState.query.length > 0);
</script>

<footer>
	{#if showHints}
		<SearchHints />
	{/if}

	<nav>
		<Button variant="icon" border="out">
			<ProfileIcon />
		</Button>
		<SearchBar />
		<Button variant="icon" border="out">
			<GPSIcon />
		</Button>
	</nav>
</footer>

<style>
	footer {
		z-index: var(--z-dock, 10);
		position: fixed;
		bottom: var(--xs, 0.625rem);
		display: flex;
		flex-direction: column;
		gap: var(--gap-2, 0.5rem);
		width: calc(100% - var(--md, 1rem));

		margin-left: auto;
		margin-right: auto;

		@media (min-width: 896px) {
			left: var(--xs, 0.625rem);
			width: 100%;
			max-width: calc(var(--md, 1rem) * 20);
		}
	}

	nav {
		display: flex;
		gap: var(--gap-2, 0.5rem);
		width: 100%;
	}
</style>
