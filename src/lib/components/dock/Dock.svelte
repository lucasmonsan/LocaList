<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { searchState } from '$lib/components/search/search.svelte';
	import { mapState } from '$lib/components/map/map.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchBar from '$lib/components/search/SearchBar.svelte';
	import SearchHints from '$lib/components/search/SearchHints.svelte';
	import SearchResults from '$lib/components/search/SearchResults.svelte';
	import GPSIcon from '$lib/icons/GPSIcon.svelte';
	import ProfileIcon from '$lib/icons/ProfileIcon.svelte';
	import { i18n } from '$lib/i18n/index.svelte';
	import ProfileMenu from '../profile/ProfileMenu.svelte';

	let showHints = $derived(searchState.focused && searchState.results.length === 0 && !searchState.hasSearched);
	let showResults = $derived(searchState.results.length > 0 || searchState.hasSearched);
	let isMenuOpen = $state(false);

	$effect(() => {
		console.log('isMenuOpen:', isMenuOpen); // ← Adicione isso
	});
</script>

<footer transition:fade>
	{#if isMenuOpen}
		<ProfileMenu isOpen={isMenuOpen} onClose={() => (isMenuOpen = false)} />
	{:else if showResults}
		<SearchResults />
	{:else if showHints}
		<SearchHints />
	{/if}

	<nav>
		<Button variant="icon" border="out" onclick={() => (isMenuOpen = !isMenuOpen)} aria-label={i18n.t.buttons.profile}>
			<ProfileIcon />
		</Button>
		<SearchBar />
		<Button variant="icon" border="out" onclick={() => mapState.locateUser()} aria-label={i18n.t.buttons.locate}>
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
