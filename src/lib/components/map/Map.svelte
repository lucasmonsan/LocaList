<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { mapState } from './map.svelte';
	import { MAP_CONFIG } from '$lib/constants/config';

	let mapElement: HTMLElement;
	let currentTileLayer: any;

	function getTileUrl(theme: string): string {
		if (theme === 'dark') {
			return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
		}
		return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
	}

	function updateMapTheme() {
		const theme = document.documentElement.getAttribute('data-theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const effectiveTheme = theme || (prefersDark ? 'dark' : 'light');

		if (currentTileLayer) {
			const map = mapState.getMap();
			if (map) {
				map.removeLayer(currentTileLayer);

				const L = (window as any).L;
				currentTileLayer = L.tileLayer(getTileUrl(effectiveTheme), {
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
					maxZoom: 20
				}).addTo(map);
			}
		}
	}

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

			const theme = document.documentElement.getAttribute('data-theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const effectiveTheme = theme || (prefersDark ? 'dark' : 'light');

			map = L.map(mapElement, {
				zoomControl: false,
				attributionControl: false
			}).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);

			currentTileLayer = L.tileLayer(getTileUrl(effectiveTheme), {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				maxZoom: 20
			}).addTo(map);

			mapState.setMap(map, L);

			resizeObserver = new ResizeObserver(() => map.invalidateSize());
			resizeObserver.observe(mapElement);

			const observer = new MutationObserver(updateMapTheme);
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme']
			});

			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateMapTheme);
		};

		initMap();

		return () => {
			resizeObserver?.disconnect();
			map?.remove();
			mapState.setMap(null, null);
		};
	});
</script>

<div bind:this={mapElement}></div>

<style>
	div {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: var(--z-map, 1);
		background-color: var(--bg);
	}
</style>
