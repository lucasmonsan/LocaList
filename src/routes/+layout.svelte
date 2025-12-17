<script lang="ts">
	import { logger } from '$lib/utils/logger';
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
	import Splash from '$lib/components/splash/Splash.svelte';
	import BottomSheet from '$lib/components/bottomSheet/BottomSheet.svelte';
	import GhostPinModal from '$lib/components/ghostPin/GhostPinModal.svelte';
	import { mapState } from '$lib/components/map/map.svelte';
	import { bottomSheetState } from '$lib/stores/bottomSheet.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import '../app.css';
	import Main from '$lib/components/layout/Main.svelte';

	let { children, data } = $props();
	let showSplash = $state(true);

	$effect(() => {
		authState.init(data.supabase, data.session);
	});

	// Geolocalização inicial
	onMount(() => {
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					// Centraliza mapa na localização do usuário
					mapState.setCenter?.([latitude, longitude]);
					// Aguarda um pouco antes de remover splash para animação suave
					setTimeout(() => {
						showSplash = false;
					}, 800);
				},
				() => {
					// Se usuário negar ou houver erro: centraliza no Brasil
					mapState.setCenter?.([-14.235, -51.9253]);
					setTimeout(() => {
						showSplash = false;
					}, 800);
				},
				{ timeout: 5000 }
			);
		} else {
			// Navegador não suporta geolocalização: centraliza no Brasil
			mapState.setCenter?.([-14.235, -51.9253]);
			setTimeout(() => {
				showSplash = false;
			}, 800);
		}
	});

	// Sincronizar query params com estado do BottomSheet
	$effect(() => {
		const pinId = page.url.searchParams.get('pin');
		const expanded = page.url.searchParams.get('expanded') === 'true';
		const showReview = page.url.searchParams.get('review') === 'true';
		
		if (pinId && pinId !== bottomSheetState.pin?.id) {
			// Carregar pin e abrir BottomSheet
			PinsService.getPinById(pinId, authState.user?.id).then(pin => {
				if (pin) {
					bottomSheetState.open(pin, { expanded, showReviewForm: showReview });
				} else {
					// Pin não encontrado: limpar URL
					navigationService.closeBottomSheet();
				}
			});
		} else if (!pinId && bottomSheetState.pin) {
			// URL não tem pin mas BottomSheet está aberto: fechar
			bottomSheetState.close();
		} else if (pinId && bottomSheetState.pin) {
			// Apenas atualizar estado se já está aberto
			bottomSheetState.expanded = expanded;
			bottomSheetState.showReviewForm = showReview;
		}
	});

	// Listener para popstate (botão voltar/avançar do navegador)
	onMount(() => {
		const handlePopState = () => {
			// SvelteKit já gerencia automaticamente através do $effect acima
			logger.debug('[Navigation] Browser navigation detected');
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
	<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
	<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
</svelte:head>

<Splash show={showSplash} />
<ToastContainer />
<Map />
<BottomSheet />
<GhostPinModal />

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
