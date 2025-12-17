<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { mapState } from './map.svelte';
	import { themeState } from '$lib/stores/theme.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import { MAP_CONFIG } from '$lib/constants/config';
	import { onMount } from 'svelte';

	let mapElement: HTMLElement;
	let lightTiles: any = null;
	let darkTiles: any = null;
	let currentTileLayer: any = null;

	$effect(() => {
		const theme = themeState.value;
		const map = mapState.getMap();

		if (map && lightTiles && darkTiles && currentTileLayer) {
			map.removeLayer(currentTileLayer);

			const prefersDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
			currentTileLayer = prefersDark ? darkTiles : lightTiles;

			map.addLayer(currentTileLayer);
		}
	});

	$effect(() => {
		let map: any;
		let resizeObserver: ResizeObserver;

		const initMap = async () => {
			if (!mapElement) return;

			const L = (await import('leaflet')).default;
			(window as any).L = L;

			delete (L.Icon.Default.prototype as any)._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconUrl: '',
				iconRetinaUrl: '',
				shadowUrl: ''
			});

			map = L.map(mapElement, {
				zoomControl: false,
				attributionControl: false
			}).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);

			lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				maxZoom: 20
			});

			darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				maxZoom: 20
			});

		const prefersDark = themeState.value === 'dark' || (themeState.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		currentTileLayer = prefersDark ? darkTiles : lightTiles;
		currentTileLayer.addTo(map);

			await mapState.setMap(map, L);

			// Carregar pins quando o mapa se move
			const loadPinsInView = async () => {
				const bounds = map.getBounds();
				if (!bounds) return;

				try {
					const pins = await PinsService.getPinsByBounds(
						bounds.getSouth(),
						bounds.getNorth(),
						bounds.getWest(),
						bounds.getEast(),
						authState.user?.id
					);
					mapState.setPins(pins);
				} catch (error) {
				}
			};

			// Carregar pins inicialmente
			map.once('load', loadPinsInView);
			
			// Carregar pins quando o mapa se move
			map.on('moveend', loadPinsInView);

			// Click no mapa para criar ghost pin
			map.on('click', (e: any) => {
				mapState.handleMapClick(e.latlng.lat, e.latlng.lng);
			});

			resizeObserver = new ResizeObserver(() => map.invalidateSize());
			resizeObserver.observe(mapElement);
		};

		initMap();

		return () => {
			resizeObserver?.disconnect();
			mapState.stopWatchingUserLocation();
			map?.remove();
			mapState.setMap(null, null);
			lightTiles = null;
			darkTiles = null;
			currentTileLayer = null;
		};
	});

	// Iniciar tracking da localização do usuário
	onMount(() => {
		// Aguarda um pouco para o mapa estar pronto
		setTimeout(() => {
			mapState.startWatchingUserLocation();
		}, 1000);
	});
</script>

<div bind:this={mapElement} role="region" aria-label="Mapa interativo"></div>

<style>
	div {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: var(--z-map);
		background-color: var(--bg);
	}
</style>
