<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import { Star, MapPin, Navigation } from 'lucide-svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { navigationService } from '$lib/services/navigation.service';
	import { mapState } from '$lib/components/map/map.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import { haptics } from '$lib/utils/haptics';
	import { toast } from '$lib/components/toast/toast.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import type { PinWithCategory } from '$lib/types/database.types';

	let favorites = $state<PinWithCategory[]>([]);
	let loading = $state(true);

	onMount(async () => {
		if (!authState.user) {
			toast.info(i18n.t.errors.loginRequired);
			goto('/');
			return;
		}

		try {
			favorites = await PinsService.getUserFavorites(authState.user.id);
		} catch (error) {
			console.error('Error loading favorites:', error);
			toast.error('Erro ao carregar favoritos');
		} finally {
			loading = false;
		}
	});

	function handlePinClick(pin: PinWithCategory) {
		haptics.medium();
		// Centraliza mapa no pin
		mapState.setCenter([pin.latitude, pin.longitude]);
		// Abre BottomSheet
		navigationService.openPin(pin.id);
	}

	function calculateDistance(lat: number, lng: number): string {
		const center = mapState.getCenter();
		if (!center) return '';

		const R = 6371; // Raio da Terra em km
		const dLat = (lat - center.lat) * (Math.PI / 180);
		const dLng = (lng - center.lng) * (Math.PI / 180);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(center.lat * (Math.PI / 180)) *
				Math.cos(lat * (Math.PI / 180)) *
				Math.sin(dLng / 2) *
				Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c;

		if (distance < 1) {
			return `${Math.round(distance * 1000)}m`;
		}
		return `${distance.toFixed(1)}km`;
	}
</script>

<div class="favorites-page" transition:fade={{ duration: 200 }}>
	<header>
		<h1>
			<Star size={24} fill="var(--warning)" />
			{i18n.t.profile.favorites}
		</h1>
	</header>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Carregando...</p>
		</div>
	{:else if favorites.length === 0}
		<div class="empty-state">
			<Star size={64} />
			<h2>Nenhum favorito ainda</h2>
			<p>Explore o mapa e favorite os locais que você gosta!</p>
		</div>
	{:else}
		<div class="favorites-grid">
			{#each favorites as pin, i (pin.id)}
				<button 
					class="favorite-card" 
					onclick={() => handlePinClick(pin)}
					transition:fly={{ y: 20, duration: 300, delay: i * 50 }}
				>
					{#if pin.photos && pin.photos.length > 0}
						<div class="card-image">
							<img src={pin.photos[0]} alt={pin.name} />
						</div>
					{:else}
						<div class="card-image placeholder">
							<MapPin size={32} />
						</div>
					{/if}

					<div class="card-content">
						<h3>{pin.name}</h3>
						
						{#if pin.category}
							<div class="category">
								<span class="category-icon" style="background-color: {pin.category.color};">
									{pin.category.icon}
								</span>
								<span>{i18n.t.categories[pin.category.name] || pin.category.name}</span>
							</div>
						{/if}

						<div class="card-footer">
							<div class="distance">
								<Navigation size={14} />
								<span>{calculateDistance(pin.latitude, pin.longitude)}</span>
							</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.favorites-page {
		position: fixed;
		inset: 0;
		z-index: var(--z-page);
		background: var(--bg);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		padding: var(--md);
		padding-bottom: calc(var(--dock-height, 60px) + var(--md));
	}

	header {
		margin-bottom: var(--lg);
	}

	header h1 {
		display: flex;
		align-items: center;
		gap: var(--xs);
		font-size: var(--xl);
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	header h1 :global(svg) {
		color: var(--warning);
	}

	.loading,
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--md);
		color: var(--text-secondary);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--border-color);
		border-top-color: var(--brand-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty-state :global(svg) {
		color: var(--text-secondary);
		opacity: 0.5;
	}

	.empty-state h2 {
		font-size: var(--lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-state p {
		font-size: var(--sm);
		text-align: center;
		max-width: 300px;
		margin: 0;
	}

	.favorites-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--md);
	}

	.favorite-card {
		background: var(--surface);
		border: none;
		border-radius: var(--radius-out);
		overflow: hidden;
		cursor: pointer;
		transition: all var(--fast);
		text-align: left;
		padding: 0;
		box-shadow: var(--shadow-sm);
	}

	.favorite-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.card-image {
		width: 100%;
		height: 160px;
		overflow: hidden;
		background: var(--bg);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.card-image.placeholder {
		color: var(--text-secondary);
	}

	.card-content {
		padding: var(--md);
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	.card-content h3 {
		font-size: var(--md);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.category {
		display: flex;
		align-items: center;
		gap: var(--xxs);
		font-size: var(--sm);
		color: var(--text-secondary);
	}

	.category-icon {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--sm);
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: var(--xs);
		color: var(--text-secondary);
		margin-top: var(--xxs);
	}

	.distance {
		display: flex;
		align-items: center;
		gap: var(--xxxs);
	}

	@media (max-width: 768px) {
		.favorites-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

