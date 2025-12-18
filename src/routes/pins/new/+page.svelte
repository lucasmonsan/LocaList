<script lang="ts">
	import { logger } from '$lib/utils/logger';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authState } from '$lib/stores/auth.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import { CategoriesService } from '$lib/services/categories.service';
	import { toast } from '$lib/components/toast/toast.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import { processImage, formatFileSize } from '$lib/utils/imageCompression';
	import { validation } from '$lib/utils/validation';
	import { reverseGeocode, formatAddress } from '$lib/utils/geocoding';
	import { onMount } from 'svelte';
	import type { PinCategory } from '$lib/types/database.types';
	import Button from '$lib/components/ui/Button.svelte';
	import { X, Image, MapPin, Loader2, Info } from 'lucide-svelte';
	import { getCategoryIcon } from '$lib/config/categories';

	let categories = $state<PinCategory[]>([]);
	let loading = $state(false);
	let uploading = $state(false);
	let loadingAddress = $state(false);

	let name = $state('');
	let description = $state('');
	let categoryId = $state('');
	let latitude = $state('');
	let longitude = $state('');
	let address = $state('');
	let photos = $state<Array<{ original: string; thumbnail: string }>>([]);
	let showAllCategories = $state(false);

	// Calculate how many categories fit in first row
	// With current styling, approximately 4-5 fit comfortably in one row on mobile, 7-8 on desktop
	const CATEGORIES_PER_ROW = 5;

	onMount(async () => {
		if (!authState.user) {
			goto('/');
			return;
		}

		// Preencher coordenadas do query params (ghost pin)
		const lat = $page.url.searchParams.get('lat');
		const lng = $page.url.searchParams.get('lng');
		if (lat && lng) {
			latitude = lat;
			longitude = lng;

			// Buscar endereço automaticamente
			fetchAddress(parseFloat(lat), parseFloat(lng));
		}

		loadCategories();
	});

	async function loadCategories() {
		logger.info('[PIN CREATION] Loading categories...');
		try {
			categories = await CategoriesService.getCategories();
			logger.info('[PIN CREATION] Categories loaded:', categories.length);
			if (categories.length > 0) {
				categoryId = categories[0].id;
			} else {
				logger.warn('[PIN CREATION] No categories found in database');
				toast.error('Nenhuma categoria encontrada. Verifique a conexão com o banco.');
			}
		} catch (err) {
			logger.error('[PIN CREATION] Error loading categories:', err);
			toast.error('Erro ao carregar categorias: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
		}
	}

	$effect(() => {
		if (latitude && longitude && !address) {
			fetchAddress(parseFloat(latitude), parseFloat(longitude));
		}
	});

	async function fetchAddress(lat: number, lng: number) {
		logger.info('[PIN CREATION] Fetching address for:', { lat, lng });
		loadingAddress = true;
		try {
			const result = await reverseGeocode(lat, lng);
			logger.info('[PIN CREATION] Geocode result:', result);
			if (result) {
				address = formatAddress(result);
				logger.info('[PIN CREATION] Formatted address:', address);
			} else {
				logger.warn('[PIN CREATION] No geocode result returned');
				address = ''; // Ensure it's empty string, not undefined
			}
		} catch (error) {
			logger.error('[PIN CREATION] Failed to fetch address:', error);
			address = '';
		} finally {
			loadingAddress = false;
		}
	}

	async function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;

		if (!files || files.length === 0) return;

		// Validar cada arquivo
		for (const file of Array.from(files)) {
			const imageValidation = validation.isValidImage(file, 5);
			if (!imageValidation.valid) {
				toast.error(imageValidation.error || 'Arquivo inválido');
				input.value = '';
				return;
			}
		}

		uploading = true;
		const tempPinId = crypto.randomUUID();

		try {
			for (const file of Array.from(files)) {
				if (photos.length >= 5) {
					toast.error('Máximo de 5 fotos por pin');
					break;
				}

				// Show compression progress
				const originalSize = formatFileSize(file.size);
				toast.info(`Comprimindo imagem (${originalSize})...`);

				// Compress image
				const { main, thumbnail } = await processImage(file);

				const compressedSize = formatFileSize(main.size);
				toast.info(`Enviando imagem (${compressedSize})...`);

				// Upload to R2
				const urls = await PinsService.uploadPhoto(main, thumbnail, tempPinId);
				photos = [...photos, urls];

				toast.success(`Foto adicionada! ${originalSize} → ${compressedSize}`);
			}
		} catch (err) {
			logger.error('Error uploading photo:', err);
			const errorMessage = err instanceof Error ? err.message : i18n.t.errors.uploadPhotoFailed;
			toast.error(errorMessage);
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	function removePhoto(index: number) {
		photos = photos.filter((_, i) => i !== index);
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!authState.user) {
			toast.error(i18n.t.errors.loginRequired);
			return;
		}

		// Validar campos obrigatórios
		const trimmedName = name.trim();
		if (!trimmedName || !categoryId || !latitude || !longitude) {
			toast.error('Preencha os campos obrigatórios (Título e Categoria)');
			return;
		}

		// Validar nome
		if (!validation.isValidPinName(trimmedName)) {
			toast.error('Título do local deve ter entre 3 e 255 caracteres');
			return;
		}

		// Validar descrição
		const trimmedDescription = description.trim();
		if (trimmedDescription && !validation.isValidDescription(trimmedDescription)) {
			toast.error('Descrição muito longa (máximo 1000 caracteres)');
			return;
		}

		// Validar coordenadas
		const lat = parseFloat(latitude);
		const lng = parseFloat(longitude);
		if (!validation.isValidCoordinates(lat, lng)) {
			toast.error('Coordenadas inválidas');
			return;
		}

		loading = true;

		try {
			await PinsService.createPin({
				user_id: authState.user.id,
				name: trimmedName,
				description: trimmedDescription || null,
				category_id: categoryId,
				latitude: lat,
				longitude: lng,
				address: address.trim() || null,
				photos: photos.map((p) => p.original),
				is_public: true // Sempre público
			});

			toast.success(i18n.t.success.pinCreated);
			goto('/');
		} catch (err) {
			logger.error('Error creating pin:', err);
			const errorMessage = err instanceof Error ? err.message : i18n.t.errors.createPinFailed;
			toast.error(errorMessage);
		} finally {
			loading = false;
		}
	}
</script>

<div class="page-container" transition:fade={{ duration: 200 }}>
	<div class="modal-card" transition:fly={{ y: 50, duration: 300, opacity: 0 }}>
		<header>
			<h5>{i18n.t.pinCreation?.title || 'Novo Local'}</h5>
			<Button variant="ghost" onclick={() => goto('/')} aria-label={i18n.t.buttons.close} class="close-btn">
				<X size={20} />
			</Button>
		</header>

		<div class="content-scroll">
			<form onsubmit={handleSubmit}>
				<!-- Categoria -->
				<div class="form-section">
					<div class="category-wrapper" class:expanded={showAllCategories}>
						<div class="category-grid">
							{#each categories as category}
								{@const CategoryIcon = getCategoryIcon(category.name)}
								<button
									type="button"
									class="category-chip"
									class:selected={categoryId === category.id}
									onclick={() => {
										categoryId = category.id;
										showAllCategories = false; // Collapse after selection
									}}
									style="--cat-color: {category.color}"
									aria-pressed={categoryId === category.id}
								>
									<div class="cat-icon" style="color: {category.color}">
										<CategoryIcon size={16} />
									</div>
									<span>{i18n.t.categories[category.name] || category.name}</span>
								</button>
							{/each}
							{#if categories.length === 0}
								<div class="loader-mini">
									<Loader2 class="spin" size={12} />
									<span>{i18n.t.common.loading || 'Carregando...'}</span>
								</div>
							{/if}
						</div>
					</div>
					{#if categories.length > CATEGORIES_PER_ROW}
						<button type="button" class="show-more-btn" onclick={() => (showAllCategories = !showAllCategories)}>
							{showAllCategories ? 'Mostrar menos' : `Mostrar mais (${categories.length - CATEGORIES_PER_ROW})`}
						</button>
					{/if}
				</div>

				<!-- Título e Descrição -->
				<!-- Título e Descrição -->
				<div class="form-group-compact">
					<div class="form-group">
						<input type="text" id="name" bind:value={name} placeholder={i18n.t.pinCreation?.titlePlaceholder || 'Título da review *'} required class="compact-input" />
					</div>

					<div class="form-group">
						<textarea
							id="description"
							bind:value={description}
							placeholder={i18n.t.pinCreation?.descPlaceholder || 'Descreva o local ou sua experiência...'}
							rows="2"
							class="compact-input"
						></textarea>
					</div>
				</div>

				<!-- Endereço (Visual) -->
				<div class="location-row readonly">
					<MapPin size={14} class="text-brand shrink-0" />
					<div class="address-wrapper">
						{#if loadingAddress}
							<div class="address-loader">
								<Loader2 class="spin" size={12} />
								<span>{i18n.t.common.identifyingAddress || 'Identificando endereço...'}</span>
							</div>
						{:else}
							<div class="address-text-input" title={address}>
								{address || i18n.t.common.addressNotFound || 'Endereço não identificado'}
							</div>
						{/if}
					</div>
				</div>

				<!-- Fotos -->
				<div class="form-section">
					<div class="photos-grid">
						{#each photos as photo, index}
							<div class="photo-item">
								<img src={photo.thumbnail} alt="Foto {index + 1}" />
								<button type="button" class="remove-photo" onclick={() => removePhoto(index)} aria-label="Remover">
									<X size={12} />
								</button>
							</div>
						{/each}

						{#if photos.length < 5}
							<label class="upload-button" class:uploading>
								<input type="file" accept="image/*" multiple onchange={handlePhotoUpload} disabled={uploading} />
								<div class="upload-content">
									{#if uploading}
										<Loader2 class="spin" size={20} />
									{:else}
										<Image size={24} />
									{/if}
								</div>
							</label>
						{/if}
					</div>
				</div>

				<!-- Disclaimer -->
				<!-- Disclaimer -->
				<div class="public-notice">
					<Info size={16} class="shrink-0" />
					<p>Todas as reviews são anônimas.</p>
				</div>

				<!-- Actions -->
				<!-- Actions -->
				<div class="form-actions">
					<Button type="button" variant="outline" onclick={() => goto('/')}>
						{i18n.t.buttons.cancel}
					</Button>
					<Button type="submit" variant="primary" disabled={loading}>
						{#if loading}
							<Loader2 class="spin" size={18} />
						{/if}
						{loading ? i18n.t.common.saving : i18n.t.buttons.save}
					</Button>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	.page-container {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		z-index: 2000;
		display: flex;
		align-items: flex-end; /* Mobile bottom sheet style */
		justify-content: center;
	}

	@media (min-width: 768px) {
		.page-container {
			align-items: center;
			padding: var(--md);
		}
	}

	.modal-card {
		background: var(--surface);
		width: 100%;
		max-width: 600px;
		border-radius: var(--radius-out) var(--radius-out) 0 0;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-xl);
		animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@media (min-width: 768px) {
		.modal-card {
			height: auto;
			max-height: 85dvh;
			border-radius: var(--radius-out);
			animation: fadeIn 0.3s ease-out;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	header {
		padding: var(--xxs) var(--md);
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.content-scroll {
		flex: 1;
		overflow-y: auto;
		padding: var(--sm);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--xxs); /* Consistent spacing between sections */
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--xxs); /* Minimal gap within a group */
	}

	.form-group-compact {
		display: flex;
		flex-direction: column;
		gap: var(--xxs); /* Small gap between title and description */
	}

	label {
		font-size: var(--sm);
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.compact-input {
		background: var(--bg);
		border: 1px solid var(--border-color);
		padding: var(--xs) var(--sm); /* Reduced padding */
		border-radius: var(--radius-in);
		font-size: var(--sm);
		color: var(--text-primary);
		transition: all 0.2s;
		width: 100%;
		box-sizing: border-box;
		font-family: inherit;
	}

	.compact-input:focus {
		outline: none;
		border-color: var(--brand-primary);
		background: var(--surface);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-primary) 20%, transparent);
	}

	/* Category Wrapper - Controls overflow and animation */
	.category-wrapper {
		max-height: var(--xxl); /* Height of one row (chip height + gap) */
		overflow: hidden;
		transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.category-wrapper.expanded {
		max-height: calc(var(--md) * 12); /* Enough for all categories */
	}

	/* Category Grid V3 */
	.category-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--xxxs);
		margin-top: 0;
	}

	.category-chip {
		background: var(--bg);
		border: 1px solid var(--border-color);
		padding: var(--xxs) var(--xs); /* Balanced padding */
		border-radius: var(--radius-in);
		display: flex;
		align-items: center;
		gap: var(--xxs);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
		color: var(--text-secondary);
		font-size: var(--xs); /* Readable size */
		font-weight: 500;
		opacity: 0.5;
	}

	.category-chip:hover {
		background: var(--bg-2);
		border-color: var(--text-secondary);
		opacity: 0.75;
	}

	.category-chip.selected {
		background: color-mix(in srgb, var(--cat-color) 15%, transparent);
		border-color: var(--cat-color);
		color: var(--text-primary);
		box-shadow: 0 2px 8px color-mix(in srgb, var(--cat-color) 20%, transparent);
		opacity: 1;
	}

	.cat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* Show More Button */
	.show-more-btn {
		background: transparent;
		border: none;
		color: var(--brand-primary);
		font-size: var(--xs);
		font-weight: 600;
		padding: var(--xxxs) 0;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: var(--xxs);
		width: 100%;
		text-align: center;
		opacity: 0.8;
	}

	.show-more-btn:hover {
		color: var(--brand-secondary);
		opacity: 1;
		transform: translateY(-1px);
	}

	/* Location Row */
	.location-row {
		display: flex;
		align-items: center;
		gap: var(--xs);
		background: var(--surface);
		padding: var(--xs) var(--sm);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
		opacity: 0.9;
	}

	.address-wrapper {
		flex: 1;
		min-width: 0; /* Enable flex shrinkage */
	}

	.address-text-input {
		background: transparent;
		border: none;
		font-size: var(--sm);
		color: var(--text-secondary);
		width: 100%;
		padding: 0;
		margin: 0;
		font-weight: 400;
		line-height: 1.4;
		pointer-events: none;
		/* Allow wrapping if needed, but usually single line is cleaner. Let's try 2 lines max */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.address-text-input:focus {
		outline: none;
	}

	.address-loader {
		display: flex;
		align-items: center;
		gap: var(--xxs);
		color: var(--text-tertiary);
		font-size: var(--xs);
	}

	/* Photos */
	.photos-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--xxs);
	}

	.photo-item {
		width: 100%;
		aspect-ratio: 1;
		border-radius: var(--radius-in);
		overflow: hidden;
		position: relative;
		border: 1px solid var(--border-color);
		box-shadow: var(--shadow-sm);
	}

	.photo-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-photo {
		position: absolute;
		top: var(--xxxs);
		right: var(--xxxs);
		background: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		border-radius: 50%;
		width: var(--md);
		height: var(--md);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		backdrop-filter: blur(2px);
		transition: background 0.2s;
	}

	.remove-photo:hover {
		background: rgba(220, 38, 38, 0.9);
	}

	.upload-button {
		width: 100%;
		aspect-ratio: 1;
		border: 1px dashed var(--border-color);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--text-tertiary);
		transition: all 0.2s;
		background: var(--bg);
	}

	.upload-button:hover {
		border-color: var(--brand-primary);
		color: var(--brand-primary);
		background: var(--brand-primary-alpha);
	}

	.upload-button input {
		display: none;
	}

	.upload-content {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Notice */
	.public-notice {
		background: color-mix(in srgb, var(--info) 8%, transparent);
		padding: var(--xs) var(--sm);
		border-radius: var(--radius-md);
		display: flex;
		gap: var(--xs);
		align-items: center;
		color: var(--text-secondary);
		font-size: var(--xs);
		line-height: 1.4;
	}

	.public-notice p {
		margin: 0;
	}

	/* Actions */
	.form-actions {
		display: flex;
		gap: var(--xs);
		margin-top: var(--xxs);
	}

	.form-actions :global(button) {
		flex: 1;
		height: calc(var(--md) * 2.75); /* ~44px responsive */
		font-size: var(--sm);
		font-weight: 500;
	}

	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.loader-mini {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-tertiary);
		font-size: 11px;
		padding: 4px;
	}
</style>
