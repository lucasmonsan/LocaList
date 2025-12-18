<script lang="ts">
	import { Star, Image, X } from 'lucide-svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import { processImage } from '$lib/utils/imageCompression';
	import { ProfanityFilter } from '$lib/utils/profanityFilter';
	import { RateLimiter, RateLimitPresets } from '$lib/utils/rateLimit';
	import { validation } from '$lib/utils/validation';
	import { haptics } from '$lib/utils/haptics';
	import { toast } from '$lib/components/toast/toast.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import { localDataStore } from '$lib/stores/localData.svelte';
	import Button from '../ui/Button.svelte';

	interface Props {
		pinId: string;
		onClose: () => void;
		onSubmit: () => void;
	}

	let { pinId, onClose, onSubmit }: Props = $props();

	let rating = $state(0);
	let hoverRating = $state(0);
	let comment = $state('');
	let photos = $state<string[]>([]);
	let loading = $state(false);
	let uploading = $state(false);

	async function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;

		if (!files || files.length === 0) return;

		if (photos.length + files.length > 3) {
			toast.error('Máximo 3 fotos por avaliação');
			return;
		}

		for (const file of Array.from(files)) {
			const imageValidation = validation.isValidImage(file, 5);
			if (!imageValidation.valid) {
				toast.error(imageValidation.error || 'Arquivo inválido');
				if (input) input.value = '';
				return;
			}
		}

		// Rate limiting para upload
		if (authState.user) {
			const rateLimitKey = `upload_${authState.user.id}`;
			const canProceed = await RateLimiter.check(rateLimitKey, RateLimitPresets.PHOTO_UPLOAD);
			if (!canProceed) {
				if (input) input.value = '';
				return;
			}
		}

		uploading = true;

		try {
			for (const file of Array.from(files)) {
				if (photos.length >= 3) break;

				const { main } = await processImage(file);
				const formData = new FormData();
				formData.append('file', main);

				const res = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (!res.ok) throw new Error('Upload failed');
				const { url } = await res.json();
				photos = [...photos, url];
			}

			haptics.success();
		} catch (error) {
			toast.error(i18n.t.errors.uploadError);
		} finally {
			uploading = false;
			if (input) input.value = '';
		}
	}

	function removePhoto(index: number) {
		photos = photos.filter((_, i) => i !== index);
		haptics.light();
	}

	function getPhotoUrl(photo: string): string {
		return photo;
	}

	async function handleSubmit() {
		if (!validation.isValidRating(rating)) {
			toast.error('Selecione uma avaliação válida (1-5 estrelas)');
			return;
		}

		const trimmedComment = comment.trim();
		if (trimmedComment && !validation.isValidComment(trimmedComment)) {
			toast.error('Comentário deve ter entre 1 e 500 caracteres');
			return;
		}

		const sanitizedComment = trimmedComment ? validation.sanitizeHTML(trimmedComment) : '';

		if (sanitizedComment) {
			const profanityValidation = ProfanityFilter.validateComment(sanitizedComment);
			if (!profanityValidation.valid) {
				toast.error(profanityValidation.message || 'Comentário inválido');
				return;
			}
		}

		if (loading || uploading) return;

		loading = true;
		haptics.medium();

		try {
			if (!authState.user) {
				localDataStore.addReview({
					pin_id: pinId,
					rating,
					comment: sanitizedComment
				});

				toast.success('Avaliação salva localmente! Faça login para sincronizar.');
				rating = 0;
				comment = '';
				photos = [];
				onSubmit();
				onClose();
				return;
			}

			// Rate limiting
			const rateLimitKey = `review_${authState.user.id}`;
			const canProceed = await RateLimiter.check(rateLimitKey, RateLimitPresets.REVIEW_CREATION);
			if (!canProceed) return;

			await PinsService.createReview({
				pin_id: pinId,
				user_id: authState.user.id,
				rating,
				comment: sanitizedComment,
				photos: photos
			});

			toast.success(i18n.t.success.reviewCreated);
			haptics.success();

			rating = 0;
			comment = '';
			photos = [];

			onSubmit();
			onClose();
		} catch (error: any) {
			toast.error(i18n.t.errors.review);
		} finally {
			loading = false;
		}
	}
</script>

<div class="review-form">
	<header>
		<h2>Avaliar Local</h2>
		<button class="close-button" onclick={onClose} aria-label="Fechar">
			<X size={20} />
		</button>
	</header>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<!-- Rating Stars -->
		<div class="rating-section">
			<div class="rating-label" id="rating-label">Avaliação *</div>
			<div class="stars" role="radiogroup" aria-labelledby="rating-label" aria-required="true">
				{#each Array(5) as _, i}
					<button
						type="button"
						class="star"
						role="radio"
						aria-checked={rating === i + 1}
						onmouseenter={() => (hoverRating = i + 1)}
						onmouseleave={() => (hoverRating = 0)}
						onclick={() => {
							rating = i + 1;
							haptics.light();
						}}
						aria-label={`${i + 1} ${i === 0 ? 'estrela' : 'estrelas'}`}
					>
						<Star size={32} fill={i < (hoverRating || rating) ? 'currentColor' : 'none'} />
					</button>
				{/each}
			</div>
		</div>

		<!-- Comment -->
		<div class="form-group">
			<label for="comment">Comentário (opcional)</label>
			<textarea id="comment" bind:value={comment} placeholder="Conte sua experiência..." maxlength="500" rows="4"></textarea>
			<small>{comment.length}/500</small>
		</div>

		<!-- Photos -->
		<div class="form-group">
			<label for="photos">Fotos (máx. 3)</label>
			<div class="photo-previews">
				{#each photos as photo, index}
					<div class="photo-preview">
						<img src={photo} alt="Foto da avaliação {index + 1}" />
						<button type="button" class="remove-photo" onclick={() => removePhoto(index)} aria-label="Remover foto">
							<X size={16} />
						</button>
					</div>
				{/each}

				{#if photos.length < 3}
					<div class="photos-section">
						<label for="photo-upload" class:uploading={uploading || !authState.user} class:disabled={!authState.user}>
							<Image size={24} />
							{uploading ? 'Processando...' : i18n.t.review?.addPhotos || 'Adicionar fotos'}
							{#if !uploading}<span class="optional">(opcional)</span>{/if}
						</label>

						{#if !authState.user}
							<p class="offline-notice">
								📸 {i18n.t.offline?.photosDisabled || 'Upload de fotos disponível apenas com login'}
							</p>
						{:else}
							<input id="photo-upload" type="file" accept="image/*" multiple onchange={handlePhotoUpload} disabled={uploading} />
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Submit Button -->
		<Button
			type="submit"
			variant="primary"
			disabled={loading || uploading || rating === 0}
			aria-busy={loading || uploading}
			aria-label={loading ? 'Publicando avaliação' : uploading ? 'Enviando fotos' : 'Publicar avaliação'}
		>
			{loading ? 'Publicando...' : 'Publicar Avaliação'}
		</Button>
	</form>
</div>

<style>
	.review-form {
		background: var(--surface);
		border-radius: var(--radius-out);
		padding: var(--md);
		display: flex;
		flex-direction: column;
		gap: var(--md);
		max-height: 70vh;
		overflow-y: auto;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	header h2 {
		font-size: var(--lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.close-button {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: var(--xxs);
		border-radius: var(--radius-in);
		transition: all var(--fast);
	}

	.close-button:hover {
		background: var(--bg);
		color: var(--text-primary);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--md);
	}

	.rating-section {
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	/* Removed unused label CSS - now using .rating-label */

	.stars {
		display: flex;
		gap: var(--xxs);
	}

	.star {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0;
		transition: all var(--fast);
	}

	.star:hover,
	.star :global(svg[fill='currentColor']) {
		color: var(--warning);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--xxs);
	}

	.form-group label {
		font-size: var(--sm);
		font-weight: 600;
		color: var(--text-primary);
	}

	.form-group textarea {
		width: 100%;
		padding: var(--xs);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-in);
		background: var(--bg);
		color: var(--text-primary);
		font-family: inherit;
		font-size: var(--sm);
		resize: vertical;
		transition: all var(--fast);
	}

	.form-group textarea:focus {
		outline: none;
		border-color: var(--brand-primary);
	}

	.form-group small {
		font-size: var(--xs);
		color: var(--text-secondary);
		align-self: flex-end;
	}

	.photo-previews {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: var(--xs);
	}

	.photo-preview {
		position: relative;
		width: 100%;
		height: 80px;
	}

	.photo-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: var(--radius-in);
		background: var(--bg);
	}

	.remove-photo {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--error);
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: all var(--fast);
	}

	.remove-photo:hover {
		transform: scale(1.1);
	}

	.upload-button {
		width: 100%;
		height: 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--xxxs);
		border: 2px dashed var(--border-color);
		border-radius: var(--radius-in);
		background: var(--bg);
		color: var(--text-secondary);
		font-size: var(--xs);
		cursor: pointer;
		transition: all var(--fast);
	}

	.upload-button:hover {
		border-color: var(--brand-primary);
		color: var(--brand-primary);
		background: var(--brand-primary-alpha);
	}

	.upload-button.uploading {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upload-button input {
		display: none;
	}

	.offline-notice {
		font-size: var(--xs);
		color: var(--warning);
		margin: var(--xs) 0 0;
		padding: var(--xs);
		background: rgba(243, 156, 18, 0.1);
		border-radius: var(--radius-in);
		text-align: center;
	}

	label.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	label.disabled:hover {
		background: transparent;
		transform: none;
	}
</style>
