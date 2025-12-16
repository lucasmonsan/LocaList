<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { authState } from '$lib/stores/auth.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import Dock from '$lib/components/dock/Dock.svelte';
	import Map from '$lib/components/map/Map.svelte';
	import ToastContainer from '$lib/components/toast/ToastContainer.svelte';
	import '../app.css';
	import Main from '$lib/components/layout/Main.svelte';

	let { children, data } = $props();

	authState.init(data.supabase, data.session);

	let showDock = $derived(page.url.pathname === '/');
	let showOverlay = $derived(page.url.pathname !== '/');

	function handleOverlayClick() {
		goto('/');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
</svelte:head>

<ToastContainer />
<Map />

{#if showOverlay}
	<button class="overlay" onclick={handleOverlayClick} transition:fade aria-label="Fechar"></button>
{/if}

<Main>
	{@render children()}
</Main>

{#if showDock}
	<Dock />
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-page) - 1);
		background: var(--overlay);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(8px);
		border: none;
		padding: 0;
		cursor: default;
	}
</style>
