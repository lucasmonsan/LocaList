<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { authState } from '$lib/stores/auth.svelte';
	import { navigationService } from '$lib/services/navigation.service';
	import favicon from '$lib/assets/favicon.svg';
	import Dock from '$lib/components/dock/Dock.svelte';
	import Map from '$lib/components/map/Map.svelte';
	import ToastContainer from '$lib/components/toast/ToastContainer.svelte';
	import '../app.css';
	import Main from '$lib/components/layout/Main.svelte';

	let { children, data } = $props();

	$effect(() => {
		authState.init(data.supabase, data.session);
	});

	// Sincronizar query params com estado da aplicação
	$effect(() => {
		const pinId = page.url.searchParams.get('pin');
		const expanded = page.url.searchParams.get('expanded') === 'true';
		const showReview = page.url.searchParams.get('review') === 'true';
		
		// TODO: Integrar com BottomSheet quando implementado (COMMIT 6)
		// Por enquanto, apenas monitora os parâmetros da URL
		if (pinId) {
			console.log('[Navigation] Pin opened:', pinId, { expanded, showReview });
		}
	});

	// Listener para popstate (botão voltar/avançar do navegador)
	onMount(() => {
		const handlePopState = () => {
			// SvelteKit já gerencia automaticamente através do $effect acima
			console.log('[Navigation] Browser navigation detected');
		};
		
		window.addEventListener('popstate', handlePopState);
		
		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	});

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
