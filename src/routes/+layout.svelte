<script lang="ts">
	import { logger } from '$lib/utils/logger';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { authState } from '$lib/stores/auth.svelte';
	import { navigationService } from '$lib/services/navigation.service';
	import { defaultSEO, getSEOForPin } from '$lib/utils/seo';
	import favicon from '$lib/assets/favicon.svg';
	import Dock from '$lib/components/dock/Dock.svelte';
	import Map from '$lib/components/map/Map.svelte';
	import ToastContainer from '$lib/components/toast/ToastContainer.svelte';
	import Splash from '$lib/components/splash/Splash.svelte';
	import BottomSheet from '$lib/components/bottomSheet/BottomSheet.svelte';
	import GhostPinModal from '$lib/components/ghostPin/GhostPinModal.svelte';
	import InstallPrompt from '$lib/components/pwa/InstallPrompt.svelte';
	import PerformanceMonitor from '$lib/components/debug/PerformanceMonitor.svelte';
	import { mapState } from '$lib/components/map/map.svelte';
	import { bottomSheetState } from '$lib/stores/bottomSheet.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import '../app.css';
	import Main from '$lib/components/layout/Main.svelte';

	let { children, data } = $props();
	let showSplash = $state(true);
	let showPerfMonitor = $state(false);

	// Expor globalmente para ser controlado pelo ProfileMenu
	if (typeof window !== 'undefined') {
		(window as any).__togglePerfMonitor = () => {
			showPerfMonitor = !showPerfMonitor;
		};
	}

	// SEO dinâmico baseado no pin aberto
	let seoConfig = $derived(() => {
		const pinId = page.url.searchParams.get('pin');
		if (pinId && bottomSheetState.pin) {
			return getSEOForPin(
				bottomSheetState.pin.name,
				bottomSheetState.pin.description || undefined,
				bottomSheetState.pin.photos?.[0] || undefined
			);
		}
		return defaultSEO;
	});

	$effect(() => {
		authState.init(data.supabase, data.session);
	});

	// Geolocalização inicial com timeout inteligente
	onMount(() => {
		// Register Service Worker
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch((error) => {
				logger.warn('Service Worker registration failed:', error);
			});
		}

		let splashClosed = false;
		
		// Fecha splash após no máximo 2 segundos (UX melhor)
		const maxSplashTimeout = setTimeout(() => {
			if (!splashClosed) {
				splashClosed = true;
				showSplash = false;
			}
		}, 2000);
		
		const closeSplash = () => {
			if (!splashClosed) {
				splashClosed = true;
				clearTimeout(maxSplashTimeout);
				// Pequeno delay para transição suave
				setTimeout(() => {
					showSplash = false;
				}, 300);
			}
		};
		
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					mapState.setCenter?.([latitude, longitude]);
					closeSplash();
				},
				() => {
					// Erro ou negação: centraliza no Brasil
					mapState.setCenter?.([-14.235, -51.9253]);
					closeSplash();
				},
				{ 
					timeout: 2000, // Reduzido para 2s
					enableHighAccuracy: false, // Mais rápido
					maximumAge: 60000 // Aceita cache de até 1 minuto
				}
			);
		} else {
			// Navegador não suporta geolocalização
			mapState.setCenter?.([-14.235, -51.9253]);
			closeSplash();
		}
		
		return () => clearTimeout(maxSplashTimeout);
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
	<link rel="manifest" href="/manifest.json" />
	<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
	<meta name="theme-color" content="#6366f1" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="LocaList" />
	<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
	<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
	
	<!-- SEO Meta Tags -->
	<title>{seoConfig().title}</title>
	<meta name="title" content={seoConfig().title} />
	<meta name="description" content={seoConfig().description} />
	{#if seoConfig().keywords}
		<meta name="keywords" content={seoConfig().keywords?.join(', ')} />
	{/if}
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={seoConfig().type || 'website'} />
	<meta property="og:url" content={page.url.href} />
	<meta property="og:title" content={seoConfig().title} />
	<meta property="og:description" content={seoConfig().description} />
	{#if seoConfig().image}
		<meta property="og:image" content={seoConfig().image} />
	{/if}
	<meta property="og:site_name" content="LocaList" />
	<meta property="og:locale" content="pt_BR" />
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={page.url.href} />
	<meta property="twitter:title" content={seoConfig().title} />
	<meta property="twitter:description" content={seoConfig().description} />
	{#if seoConfig().image}
		<meta property="twitter:image" content={seoConfig().image} />
	{/if}
	
	<!-- Additional SEO -->
	<meta name="robots" content="index, follow" />
	<meta name="googlebot" content="index, follow" />
	<link rel="canonical" href={page.url.href} />
</svelte:head>

<Splash show={showSplash} />
<ToastContainer />
<InstallPrompt />
<PerformanceMonitor show={showPerfMonitor} />
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
