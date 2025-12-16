<script lang="ts">
	import { slideUp } from '$lib/utils/transitions';
	import { searchState } from './search.svelte';
	import { getPlaceLabel } from '$lib/utils/osm';
	import { highlightMatch } from '$lib/utils/string';
	import { i18n } from '$lib/i18n/i18n.svelte';

	let listElements: (HTMLLIElement | null)[] = [];

	$effect(() => {
		const focusedEl = listElements[searchState.focusedIndex];
		if (focusedEl) {
			focusedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	});
</script>

{#if searchState.results.length > 0}
	<div id="search-results" class="results-container shadow" transition:slideUp>
		<ul role="listbox">
			{#each searchState.results as result, index}
				<li bind:this={listElements[index]} role="option" aria-selected={searchState.focusedIndex === index} class:focused={searchState.focusedIndex === index}>
					<button onclick={() => searchState.selectResult(result)} aria-label={`${result.properties.name}, ${getPlaceLabel(result.properties)}`}>
						<div>
							<strong>{@html highlightMatch(result.properties.name, searchState.query)}</strong>
							<small>{getPlaceLabel(result.properties)}</small>
						</div>
						{#if result.properties.city || result.properties.state}
							<span>
								{result.properties.city || result.properties.state}
								{result.properties.country && `- ${result.properties.country}`}
							</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>
{:else if searchState.hasSearched && searchState.results.length === 0 && !searchState.loading}
	<div class="results-container shadow error" transition:slideUp>
		<p>{i18n.t.search.noResults} "<strong>{searchState.lastSearchedQuery}</strong>"</p>
	</div>
{/if}

<style>
	div {
		display: flex;
		flex-direction: column;

		&.results-container {
			width: 100%;
			max-height: 60dvh;
			overflow-y: auto;
			background: var(--surface);
			border-radius: var(--radius-out);
			padding: var(--xxs);
			scrollbar-width: thin;
			scrollbar-color: var(--border-color) transparent;

			&::-webkit-scrollbar {
				width: 4px;
			}
			&::-webkit-scrollbar-thumb {
				background: var(--border-color);
				border-radius: 4px;
			}
		}

		&.shadow {
			box-shadow: var(--shadow-lg);
		}

		&.error {
			padding: var(--sm);
			text-align: center;
			color: var(--text-secondary);
		}
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		border-bottom: 1px solid var(--border-color);

		&:last-child {
			border-bottom: none;
		}

		&.focused button {
			background: var(--bg);
			outline: 2px solid var(--brand-primary);
			outline-offset: 2px;
			box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-primary) 20%, transparent);
		}
	}

	button {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--xs);
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background var(--fast);
		border-radius: var(--radius-in);

		&:hover {
			background: var(--bg);
		}
	}

	strong {
		font-size: var(--sm);
		color: var(--text-primary);
		font-weight: 700;
	}

	strong :global(mark) {
		background: var(--brand-primary);
		color: var(--surface);
		padding: 0 2px;
		border-radius: 2px;
		font-weight: 800;
	}

	small {
		font-size: var(--xs);
		color: var(--brand-primary);
		font-weight: 600;
	}

	span {
		font-size: var(--xs);
		color: var(--text-secondary);
		background: var(--bg);
		padding: 2px 6px;
		border-radius: 4px;
		white-space: nowrap;
		margin-left: var(--xs);
	}
</style>
