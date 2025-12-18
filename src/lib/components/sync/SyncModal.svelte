<script lang="ts">
	import { slide } from 'svelte/transition';
	import { X } from 'lucide-svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { localDataStore } from '$lib/stores/localData.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import { toast } from '$lib/components/toast/toast.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { onClose } = $props<{ onClose: () => void }>();

	let selectedPins = $state(new Set<string>());
	let selectedReviews = $state(new Set<string>());
	let selectedFavorites = $state(new Set<string>());
	let selectAll = $state(false);
	let syncing = $state(false);

	const localPins = localDataStore.pins;
	const localReviews = localDataStore.reviews;
	const localFavorites = localDataStore.favorites;

	function toggleSelectAll() {
		if (selectAll) {
			selectedPins = new Set(localPins.map((p) => p.id));
			selectedReviews = new Set(localReviews.map((r) => r.id));
			selectedFavorites = new Set(localFavorites);
		} else {
			selectedPins.clear();
			selectedReviews.clear();
			selectedFavorites.clear();
		}
	}

	async function handleSync() {
		if (!authState.user) return;

		syncing = true;
		let successCount = 0;
		let errorCount = 0;

		try {
			for (const pinId of selectedPins) {
				const pin = localPins.find((p) => p.id === pinId);
				if (pin) {
					try {
						await PinsService.createPin(
							{
								name: pin.name,
								description: pin.description,
								latitude: pin.latitude,
								longitude: pin.longitude,
								address: pin.address,
								category_id: pin.category_id,
								photos: [],
								user_id: authState.user.id
							},
							false
						);
						localDataStore.removePin(pinId);
						successCount++;
					} catch {
						errorCount++;
					}
				}
			}

			for (const favoriteId of selectedFavorites) {
				try {
					await PinsService.toggleFavorite(favoriteId, authState.user.id);
					successCount++;
				} catch {
					errorCount++;
				}
			}

			localDataStore.favorites
				.filter((id) => selectedFavorites.has(id))
				.forEach((id) => {
					const index = localDataStore.favorites.indexOf(id);
					if (index > -1) localDataStore.favorites.splice(index, 1);
				});

			if (successCount > 0) {
				toast.success(`${successCount} itens sincronizados com sucesso!`);
			}
			if (errorCount > 0) {
				toast.error(`${errorCount} itens falharam ao sincronizar`);
			}

			onClose();
		} catch (error) {
			toast.error('Erro ao sincronizar dados');
		} finally {
			syncing = false;
		}
	}

	function handleDiscard() {
		localDataStore.clear();
		toast.info('Dados locais descartados');
		onClose();
	}

	const totalSelected = $derived(selectedPins.size + selectedReviews.size + selectedFavorites.size);
</script>

<div class="sync-modal-overlay" onclick={onClose} transition:slide>
	<div class="sync-modal" onclick={(e) => e.stopPropagation()}>
		<header>
			<h2>Sincronizar Dados Locais</h2>
			<button class="close-btn" onclick={onClose} aria-label="Fechar">
				<X size={20} />
			</button>
		</header>

		<p class="description">Você tem dados salvos localmente. Deseja salvá-los na sua conta?</p>

		<div class="select-all">
			<input type="checkbox" id="select-all" bind:checked={selectAll} onchange={toggleSelectAll} />
			<label for="select-all">Selecionar tudo</label>
		</div>

		<div class="lists">
			{#if localPins.length > 0}
				<section>
					<h3>Pins ({localPins.length})</h3>
					<div class="items">
						{#each localPins as pin}
							<label class="item">
								<input
									type="checkbox"
									checked={selectedPins.has(pin.id)}
									onchange={() => {
										if (selectedPins.has(pin.id)) {
											selectedPins.delete(pin.id);
										} else {
											selectedPins.add(pin.id);
										}
										selectedPins = selectedPins;
									}}
								/>
								<div class="item-info">
									<strong>{pin.name}</strong>
									<span>{pin.address}</span>
								</div>
							</label>
						{/each}
					</div>
				</section>
			{/if}

			{#if localReviews.length > 0}
				<section>
					<h3>Avaliações ({localReviews.length})</h3>
					<div class="items">
						{#each localReviews as review}
							<label class="item">
								<input
									type="checkbox"
									checked={selectedReviews.has(review.id)}
									onchange={() => {
										if (selectedReviews.has(review.id)) {
											selectedReviews.delete(review.id);
										} else {
											selectedReviews.add(review.id);
										}
										selectedReviews = selectedReviews;
									}}
								/>
								<div class="item-info">
									<strong>⭐ {review.rating}/5</strong>
									<span>{review.comment.slice(0, 50)}...</span>
								</div>
							</label>
						{/each}
					</div>
				</section>
			{/if}

			{#if localFavorites.length > 0}
				<section>
					<h3>Favoritos ({localFavorites.length})</h3>
					<div class="items">
						{#each localFavorites as pinId}
							<label class="item">
								<input
									type="checkbox"
									checked={selectedFavorites.has(pinId)}
									onchange={() => {
										if (selectedFavorites.has(pinId)) {
											selectedFavorites.delete(pinId);
										} else {
											selectedFavorites.add(pinId);
										}
										selectedFavorites = selectedFavorites;
									}}
								/>
								<div class="item-info">
									<span>Pin ID: {pinId.slice(0, 8)}...</span>
								</div>
							</label>
						{/each}
					</div>
				</section>
			{/if}
		</div>

		<div class="actions">
			<Button variant="primary" onclick={handleSync} disabled={syncing || totalSelected === 0}>
				{syncing ? 'Sincronizando...' : `Salvar Selecionados (${totalSelected})`}
			</Button>
			<Button variant="secondary" onclick={handleDiscard} disabled={syncing}>Descartar Tudo</Button>
			<Button variant="ghost" onclick={onClose} disabled={syncing}>Cancelar</Button>
		</div>
	</div>
</div>

<style>
	.sync-modal-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--md);
	}

	.sync-modal {
		background: var(--surface);
		border-radius: var(--radius-out);
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-lg);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--md);
		border-bottom: 1px solid var(--border-color);
	}

	h2 {
		margin: 0;
		font-size: var(--lg);
		color: var(--text-primary);
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: var(--xxs);
		border-radius: var(--radius-in);
		transition: all var(--fast);
	}

	.close-btn:hover {
		background: var(--bg);
		color: var(--text-primary);
	}

	.description {
		padding: var(--md);
		margin: 0;
		color: var(--text-secondary);
	}

	.select-all {
		padding: 0 var(--md) var(--sm);
		display: flex;
		align-items: center;
		gap: var(--xs);
	}

	.lists {
		flex: 1;
		overflow-y: auto;
		padding: 0 var(--md);
	}

	section {
		margin-bottom: var(--md);
	}

	h3 {
		font-size: var(--md);
		color: var(--text-primary);
		margin: 0 0 var(--xs) 0;
	}

	.items {
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	.item {
		display: flex;
		align-items: flex-start;
		gap: var(--xs);
		padding: var(--xs);
		border-radius: var(--radius-in);
		cursor: pointer;
		transition: background var(--fast);
	}

	.item:hover {
		background: var(--bg);
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-info strong {
		color: var(--text-primary);
		font-size: var(--sm);
	}

	.item-info span {
		color: var(--text-secondary);
		font-size: var(--xs);
	}

	.actions {
		display: flex;
		gap: var(--xs);
		padding: var(--md);
		border-top: 1px solid var(--border-color);
	}

	@media (max-width: 640px) {
		.actions {
			flex-direction: column;
		}
	}
</style>
