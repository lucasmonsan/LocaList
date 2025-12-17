<script lang="ts">
	import { fly } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import { X, ChevronUp, ChevronDown, MapPin, Star, MessageSquarePlus } from 'lucide-svelte';
	import { navigationService } from '$lib/services/navigation.service';
	import { bottomSheetState } from '$lib/stores/bottomSheet.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import { getCategoryIcon } from '$lib/config/categories';
	import { haptics } from '$lib/utils/haptics';
	import { toast } from '$lib/components/toast/toast.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import ReviewItem from '../reviews/ReviewItem.svelte';
	import ReviewForm from '../reviews/ReviewForm.svelte';
	import Button from '../ui/Button.svelte';

	let startY = $state(0);
	let currentY = $state(0);
	let isDragging = $state(false);
	let sheetElement: HTMLDivElement;
	let isFavorited = $state(false);
	let favoriteLoading = $state(false);
	let showReviewForm = $state(false);

	const DRAG_THRESHOLD = 100; // pixels para confirmar ação
	const COLLAPSED_HEIGHT = 30; // vh
	const EXPANDED_HEIGHT = 80; // vh

	// Verificar se pin está favoritado
	$effect(() => {
		if (bottomSheetState.pin && authState.user) {
			isFavorited = bottomSheetState.pin.is_favorited ?? false;
		} else {
			isFavorited = false;
		}
	});

	// Sincronizar showReviewForm com URL
	$effect(() => {
		showReviewForm = bottomSheetState.showReviewForm;
	});

	function handleTouchStart(e: TouchEvent) {
		startY = e.touches[0].clientY;
		isDragging = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging) return;
		currentY = e.touches[0].clientY;
	}

	function handleTouchEnd() {
		if (!isDragging) return;
		
		const deltaY = currentY - startY;
		isDragging = false;

		// Swipe down
		if (deltaY > DRAG_THRESHOLD) {
			haptics.light();
			if (bottomSheetState.expanded) {
				navigationService.collapseBottomSheet();
			} else {
				navigationService.closeBottomSheet();
			}
		}
		// Swipe up
		else if (deltaY < -DRAG_THRESHOLD && !bottomSheetState.expanded) {
			haptics.light();
			navigationService.expandBottomSheet();
		}

		startY = 0;
		currentY = 0;
	}

	function handleExpand() {
		haptics.medium();
		navigationService.expandBottomSheet();
	}

	function handleCollapse() {
		haptics.light();
		navigationService.collapseBottomSheet();
	}

	function handleClose() {
		haptics.medium();
		navigationService.closeBottomSheet();
	}

	async function handleToggleFavorite() {
		if (!authState.user) {
			toast.error(i18n.t.errors.loginRequired);
			return;
		}

		if (!bottomSheetState.pin || favoriteLoading) return;

		favoriteLoading = true;
		haptics.medium();

		try {
			const newState = await PinsService.toggleFavorite(
				bottomSheetState.pin.id,
				authState.user.id
			);

			isFavorited = newState;

			if (newState) {
				toast.success(i18n.t.success.pinFavorited);
			} else {
				toast.info(i18n.t.success.pinUnfavorited);
			}
		} catch (error) {
			toast.error(i18n.t.errors.favoriteFailed);
		} finally {
			favoriteLoading = false;
		}
	}

	function handleOpenReviewForm() {
		if (!authState.user) {
			toast.error(i18n.t.errors.loginRequired);
			return;
		}
		if (!bottomSheetState.pin) return;
		
		navigationService.openReviewForm(bottomSheetState.pin.id);
		haptics.medium();
	}

	function handleCloseReviewForm() {
		navigationService.closeReviewForm();
		haptics.light();
	}

	async function handleReviewSubmit() {
		if (!bottomSheetState.pin) return;
		
		// Reload pin data
		const updated = await PinsService.getPinById(bottomSheetState.pin.id, authState.user?.id);
		if (updated) {
			bottomSheetState.pin = updated;
		}
		
		handleCloseReviewForm();
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	$effect(() => {
		if (bottomSheetState.pin) {
			window.addEventListener('keydown', handleEscape);
			return () => {
				window.removeEventListener('keydown', handleEscape);
			};
		}
	});
</script>

{#if bottomSheetState.pin}
	<div
		bind:this={sheetElement}
		class="bottom-sheet"
		class:expanded={bottomSheetState.expanded}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		role="dialog"
		aria-modal="true"
		aria-label="Detalhes do local"
		transition:fly={{ y: 500, duration: 400, easing: elasticOut }}
	>
		<!-- Handle visual -->
		<div class="handle"></div>

		<!-- Header -->
		<header>
			<button class="close-button" onclick={handleClose} aria-label={i18n.t.buttons.close || 'Fechar'}>
				<X size={20} />
			</button>

			<div class="header-actions">
				<button 
					class="favorite-button" 
					class:active={isFavorited}
					onclick={handleToggleFavorite} 
					disabled={favoriteLoading}
					aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
				>
					<Star size={20} fill={isFavorited ? 'currentColor' : 'none'} />
				</button>

				{#if bottomSheetState.expanded}
					<button class="collapse-button" onclick={handleCollapse} aria-label="Colapsar">
						<ChevronDown size={20} />
					</button>
				{:else}
					<button class="expand-button" onclick={handleExpand} aria-label="Expandir">
						<ChevronUp size={20} />
					</button>
				{/if}
			</div>
		</header>

		<!-- Content -->
		<div class="content" class:expanded={bottomSheetState.expanded}>
			<div class="pin-info">
				<!-- Category icon -->
				{#if bottomSheetState.pin.category}
					{@const CategoryIcon = getCategoryIcon(bottomSheetState.pin.category.name)}
					<div class="category-badge" style="background-color: {bottomSheetState.pin.category.color};">
						<CategoryIcon size={24} color="white" />
					</div>
				{/if}

				<h2>{bottomSheetState.pin.name}</h2>

				{#if bottomSheetState.pin.category}
					<p class="category-name">{i18n.t.categories[bottomSheetState.pin.category.name] || bottomSheetState.pin.category.name}</p>
				{/if}

				{#if bottomSheetState.pin.average_rating > 0}
					<div class="rating">
						<Star size={16} fill="currentColor" />
						<span>{bottomSheetState.pin.average_rating.toFixed(1)}</span>
						<span class="reviews-count">({bottomSheetState.pin.reviews?.length || 0} {i18n.t.pin?.reviews || 'avaliações'})</span>
					</div>
				{/if}

				{#if bottomSheetState.pin.address}
					<div class="address">
						<MapPin size={16} />
						<span>{bottomSheetState.pin.address}</span>
					</div>
				{/if}

				{#if bottomSheetState.pin.description}
					<p class="description">{bottomSheetState.pin.description}</p>
				{/if}
			</div>

			{#if bottomSheetState.expanded}
				<div class="expanded-content">
					<!-- Photos -->
					{#if bottomSheetState.pin.photos && bottomSheetState.pin.photos.length > 0}
						<div class="photos-gallery">
							{#each bottomSheetState.pin.photos as photo}
								<img src={photo} alt="" />
							{/each}
						</div>
					{/if}

					<!-- Reviews section -->
					<div class="reviews-section">
						<div class="reviews-header">
							<h3>{i18n.t.pin?.reviewsTitle || 'Avaliações'} ({bottomSheetState.pin.reviews?.length || 0})</h3>
							<Button variant="ghost" onclick={handleOpenReviewForm}>
								<MessageSquarePlus size={18} />
								Avaliar
							</Button>
						</div>

						{#if showReviewForm}
							<ReviewForm 
								pinId={bottomSheetState.pin.id} 
								onClose={handleCloseReviewForm}
								onSubmit={handleReviewSubmit}
							/>
						{/if}

						{#if bottomSheetState.pin.reviews && bottomSheetState.pin.reviews.length > 0}
							<div class="reviews-list">
								{#each bottomSheetState.pin.reviews as review (review.id)}
									<ReviewItem {review} onUpdate={handleReviewSubmit} />
								{/each}
							</div>
						{:else}
							<p class="placeholder">{i18n.t.pin?.noReviews || 'Nenhuma avaliação ainda. Seja o primeiro!'}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.bottom-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: var(--z-modal);
		background: var(--surface);
		border-radius: var(--radius-out) var(--radius-out) 0 0;
		box-shadow: var(--shadow-lg);
		height: 30vh;
		display: flex;
		flex-direction: column;
		transition: height 0.3s ease-out;
		max-width: 600px;
		margin: 0 auto;
	}

	.bottom-sheet.expanded {
		height: 80vh;
	}

	.handle {
		width: 40px;
		height: 6px;
		background: var(--border-color);
		border-radius: 3px;
		margin: var(--xs) auto 0;
		flex-shrink: 0;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--xs) var(--md);
		flex-shrink: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--xxs);
	}

	header button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--xl);
		height: var(--xl);
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-in);
		cursor: pointer;
		color: var(--text-secondary);
		transition: all var(--fast);
	}

	header button:hover {
		background: var(--bg);
		color: var(--text-primary);
	}

	header button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.favorite-button {
		color: var(--text-secondary);
	}

	.favorite-button.active {
		color: var(--warning);
	}

	.favorite-button:hover {
		transform: scale(1.1);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 0 var(--md) var(--md);
		scrollbar-width: thin;
		scrollbar-color: var(--border-color) transparent;
	}

	.content::-webkit-scrollbar {
		width: 4px;
	}

	.content::-webkit-scrollbar-thumb {
		background: var(--border-color);
		border-radius: 4px;
	}

	.pin-info {
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	.category-badge {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--xl);
		border: 3px solid var(--surface);
		box-shadow: var(--shadow-md);
	}

	h2 {
		font-size: var(--lg);
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.category-name {
		font-size: var(--sm);
		color: var(--text-secondary);
		margin: 0;
	}

	.rating {
		display: flex;
		align-items: center;
		gap: var(--xxs);
		color: var(--warning);
		font-size: var(--sm);
		font-weight: 600;
	}

	.reviews-count {
		color: var(--text-secondary);
		font-weight: 400;
	}

	.address {
		display: flex;
		align-items: flex-start;
		gap: var(--xxs);
		color: var(--text-secondary);
		font-size: var(--sm);
	}

	.description {
		font-size: var(--sm);
		color: var(--text-primary);
		line-height: 1.5;
		margin: var(--xs) 0 0;
	}

	.expanded-content {
		display: flex;
		flex-direction: column;
		gap: var(--md);
		margin-top: var(--md);
		padding-top: var(--md);
		border-top: 1px solid var(--border-color);
	}

	.photos-gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--xs);
	}

	.photos-gallery img {
		width: 100%;
		height: 120px;
		object-fit: cover;
		border-radius: var(--radius-in);
	}

	.reviews-section {
		display: flex;
		flex-direction: column;
		gap: var(--md);
	}

	.reviews-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.reviews-header h3 {
		font-size: var(--md);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.reviews-list {
		display: flex;
		flex-direction: column;
		gap: var(--md);
	}

	.placeholder {
		font-size: var(--sm);
		color: var(--text-secondary);
		text-align: center;
		padding: var(--lg) 0;
		margin: 0;
	}

	@media (min-width: 768px) {
		.bottom-sheet {
			left: var(--xs);
			right: auto;
			width: 400px;
			border-radius: var(--radius-out);
			height: auto;
			max-height: 80vh;
		}

		.bottom-sheet.expanded {
			height: auto;
		}
	}
</style>

