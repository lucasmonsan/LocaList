<script lang="ts">
	import { slideUp } from '$lib/utils/transitions';
	import { searchState } from '$lib/components/search/search.svelte';
	import { mapState } from '$lib/components/map/map.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchBar from '$lib/components/search/SearchBar.svelte';
	import SearchHints from '$lib/components/search/SearchHints.svelte';
	import SearchResults from '$lib/components/search/SearchResults.svelte';
	import SearchHistory from '$lib/components/search/SearchHistory.svelte';
	import { Navigation, User } from 'lucide-svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import ProfileMenu from '../profile/ProfileMenu.svelte';

	let showHistory = $derived(searchState.focused && searchState.query === '' && searchState.history.length > 0 && !searchState.hasSearched);
	let showHints = $derived(searchState.focused && searchState.query === '' && searchState.history.length === 0 && !searchState.hasSearched);
	let showResults = $derived(searchState.results.length > 0 || searchState.hasSearched);
	let isMenuOpen = $state(false);
</script>

<footer transition:slideUp={{ duration: 300 }}>
	{#if isMenuOpen}
		<ProfileMenu isOpen={isMenuOpen} onClose={() => (isMenuOpen = false)} />
	{:else if showResults}
		<SearchResults />
	{:else if showHistory}
		<SearchHistory />
	{:else if showHints}
		<SearchHints />
	{/if}

	<nav>
		<Button variant="icon" radius="out" onclick={() => (isMenuOpen = !isMenuOpen)} aria-label={i18n.t.buttons.profile}>
			<User size={20} />
		</Button>
		<SearchBar />
		<Button variant="icon" radius="out" onclick={() => mapState.locateUser()} aria-label={i18n.t.buttons.locate}>
			<Navigation size={20} />
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
