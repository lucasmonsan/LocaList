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
	import { onMount } from 'svelte';
	import type { PinCategory } from '$lib/types/database.types';
	import Button from '$lib/components/ui/Button.svelte';
	import { X, Image } from 'lucide-svelte';

	let categories = $state<PinCategory[]>([]);
	let loading = $state(false);
	let uploading = $state(false);
	
	let name = $state('');
	let description = $state('');
	let categoryId = $state('');
	let latitude = $state('');
	let longitude = $state('');
	let address = $state('');
	let photos = $state<Array<{ original: string; thumbnail: string }>>([]);
	let isPublic = $state(true);

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
		}

		try {
			categories = await CategoriesService.getCategories();
			if (categories.length > 0) {
				categoryId = categories[0].id;
			}
		} catch (err) {
			logger.error('Error loading categories:', err);
			toast.error('Erro ao carregar categorias');
		}
	});

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
			toast.error('Preencha todos os campos obrigatórios');
			return;
		}

		// Validar nome
		if (!validation.isValidPinName(trimmedName)) {
			toast.error('Nome do local deve ter entre 3 e 255 caracteres');
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

		// Validar UUIDs
		if (!validation.isValidUUID(authState.user.id) || !validation.isValidUUID(categoryId)) {
			toast.error('Dados inválidos');
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
				photos: photos.map(p => p.original),
				is_public: isPublic
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

	function getCategoryName(category: PinCategory) {
		return i18n.t.categories[category.name] || category.name;
	}
</script>

<div class="page">
	<header>
		<h1>{i18n.t.buttons.addPin || 'Adicionar Pin'}</h1>
		<Button variant="icon" onclick={() => goto('/')} aria-label="Fechar">
			<X size={20} />
		</Button>
	</header>

	<form onsubmit={handleSubmit}>
		<div class="form-group">
			<label for="name">Nome *</label>
			<input
				type="text"
				id="name"
				bind:value={name}
				placeholder="Nome do local"
				required
			/>
		</div>

		<div class="form-group">
			<label for="description">Descrição</label>
			<textarea
				id="description"
				bind:value={description}
				placeholder="Descreva o local..."
				rows="3"
			></textarea>
		</div>

		<div class="form-group">
			<label for="category">Categoria *</label>
			<select id="category" bind:value={categoryId} required>
				{#each categories as category}
					<option value={category.id}>
						{category.icon} {getCategoryName(category)}
					</option>
				{/each}
			</select>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="latitude">Latitude *</label>
				<input
					type="number"
					id="latitude"
					bind:value={latitude}
					placeholder="-23.5505"
					step="any"
					required
				/>
			</div>

			<div class="form-group">
				<label for="longitude">Longitude *</label>
				<input
					type="number"
					id="longitude"
					bind:value={longitude}
					placeholder="-46.6333"
					step="any"
					required
				/>
			</div>
		</div>

		<div class="form-group">
			<label for="address">Endereço</label>
			<input
				type="text"
				id="address"
				bind:value={address}
				placeholder="Endereço completo"
			/>
		</div>

		<div class="form-group">
			<div class="photos-label">Fotos (máx. 5)</div>
			<div class="photos-grid">
				{#each photos as photo, index}
					<div class="photo-item">
						<img src={photo.thumbnail} alt="Foto do pin {index + 1}" />
						<button
							type="button"
							class="remove-photo"
							onclick={() => removePhoto(index)}
							aria-label="Remover foto"
						>
							<X size={16} />
						</button>
					</div>
				{/each}

				{#if photos.length < 5}
					<label class="upload-button" class:uploading>
						<input
							type="file"
							accept="image/*"
							multiple
							onchange={handlePhotoUpload}
							disabled={uploading}
						/>
						<Image size={24} />
						{uploading ? 'Enviando...' : 'Adicionar'}
					</label>
				{/if}
			</div>
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={isPublic} />
				Pin público (visível para todos)
			</label>
		</div>

		<div class="form-actions">
			<Button type="button" variant="secondary" onclick={() => goto('/')}>
				{i18n.t.buttons.cancel}
			</Button>
			<Button type="submit" disabled={loading}>
				{loading ? 'Salvando...' : i18n.t.buttons.save}
			</Button>
		</div>
	</form>
</div>

<style>
	.page {
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		padding: var(--md);
		background-color: var(--bg);
		min-height: 100vh;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--lg);
	}

	h1 {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-1);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--gap-4);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--gap-1);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--gap-2);
	}

	label {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-2);
	}

	input[type="text"],
	input[type="number"],
	textarea,
	select {
		padding: var(--sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-1);
		font-size: var(--font-size-md);
		background-color: var(--bg-2);
		color: var(--text-1);
		transition: border-color 0.2s ease;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: var(--primary);
	}

	textarea {
		resize: vertical;
		font-family: inherit;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		font-size: var(--font-size-md);
		font-weight: 400;
		color: var(--text-1);
		cursor: pointer;
	}

	input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.photos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: var(--gap-2);
	}

	.photo-item {
		position: relative;
		aspect-ratio: 1;
		border-radius: var(--radius-1);
		overflow: hidden;
	}

	.photo-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-photo {
		position: absolute;
		top: var(--xs);
		right: var(--xs);
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.remove-photo:hover {
		background-color: rgba(0, 0, 0, 0.8);
	}

	.upload-button {
		aspect-ratio: 1;
		border: 2px dashed var(--border);
		border-radius: var(--radius-1);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--gap-1);
		cursor: pointer;
		transition: border-color 0.2s ease, background-color 0.2s ease;
		background-color: var(--bg-2);
		color: var(--text-2);
		font-size: var(--font-size-sm);
	}

	.upload-button:hover:not(.uploading) {
		border-color: var(--primary);
		background-color: var(--primary-bg);
		color: var(--primary);
	}

	.upload-button.uploading {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upload-button input {
		display: none;
	}

	.form-actions {
		display: flex;
		gap: var(--gap-2);
		margin-top: var(--md);
	}

	.form-actions :global(button) {
		flex: 1;
	}
</style>

